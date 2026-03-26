import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import {
  User,
  Role,
  UserRole,
  Stylist,
  Veterinarian,
  Clinic,
  ClinicConfiguration,
  StylistAvailability,
  VeterinarianAvailability,
} from '@/database/entities';
import {
  CreateClinicUserDto,
  UpdateClinicUserDto,
  ClinicUserResponseDto,
  ListClinicUsersQueryDto,
  StylistResponseDto,
  VeterinarianResponseDto,
  RoleResponseDto,
} from '../dtos';
import { EmailService } from '@/modules/email/email.service';

@Injectable()
export class ClinicUsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Stylist)
    private stylistRepository: Repository<Stylist>,
    @InjectRepository(Veterinarian)
    private veterinarianRepository: Repository<Veterinarian>,
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
    @InjectRepository(ClinicConfiguration)
    private clinicConfigRepository: Repository<ClinicConfiguration>,
    @InjectRepository(StylistAvailability)
    private stylistAvailabilityRepository: Repository<StylistAvailability>,
    @InjectRepository(VeterinarianAvailability)
    private veterinarianAvailabilityRepository: Repository<VeterinarianAvailability>,
    private dataSource: DataSource,
    private emailService: EmailService,
  ) {}

  async createClinicUser(
    clinicId: string,
    dto: CreateClinicUserDto,
    createdBy?: string,
  ): Promise<ClinicUserResponseDto> {
    // Check email uniqueness
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Validate roles exist
    const roles = await this.roleRepository.find({
      where: [
        { code: In(dto.roles), clinicId: IsNull() }, // System roles
        { code: In(dto.roles), clinicId }, // Clinic-specific roles
      ],
    });

    if (roles.length !== dto.roles.length) {
      const foundCodes = roles.map((r) => r.code);
      const missing = dto.roles.filter((c) => !foundCodes.includes(c));
      throw new BadRequestException(`Roles no encontrados: ${missing.join(', ')}`);
    }

    const hasStylistRole = dto.roles.includes('CLINIC_STYLIST');
    const hasVeterinarianRole = dto.roles.includes('CLINIC_VETERINARIAN');

    // If stylist role but no profile data provided, create default
    if (hasStylistRole && !dto.stylistProfile) {
      dto.stylistProfile = {};
    }

    // If veterinarian role but no profile data provided, create default
    if (hasVeterinarianRole && !dto.veterinarianProfile) {
      dto.veterinarianProfile = {};
    }

    // Run in transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create user
      const invitationToken = crypto.randomUUID();
      const invitationExpires = new Date();
      invitationExpires.setDate(invitationExpires.getDate() + 7); // 7 days

      const user = queryRunner.manager.create(User, {
        clinicId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        hashedPassword: '', // Will be set on invitation acceptance
        role: 'staff', // Legacy field compatibility
        status: 'INVITED' as const,
        invitationToken,
        invitationTokenExpiresAt: invitationExpires,
      });

      const savedUser = await queryRunner.manager.save(User, user);

      // Assign roles
      const userRoles = roles.map((role) => ({
        userId: savedUser.id,
        roleId: role.id,
      }));

      await queryRunner.manager.save(UserRole, userRoles);

      // Create stylist profile if needed
      let stylistProfile: Stylist | null = null;
      if (hasStylistRole) {
        stylistProfile = queryRunner.manager.create(Stylist, {
          clinicId,
          userId: savedUser.id,
          displayName: dto.stylistProfile?.displayName || dto.name,
          calendarColor: dto.stylistProfile?.calendarColor || null,
          isBookable: dto.stylistProfile?.isBookable ?? true,
        });

        const savedStylist = await queryRunner.manager.save(Stylist, stylistProfile);

        // Copy clinic business hours to stylist availabilities
        await this.copyClinicHoursToStylist(
          queryRunner,
          clinicId,
          savedStylist.id,
        );

        stylistProfile = savedStylist;
      }

      // Create veterinarian profile if needed
      let veterinarianProfile: Veterinarian | null = null;
      if (hasVeterinarianRole) {
        veterinarianProfile = queryRunner.manager.create(Veterinarian, {
          clinicId,
          userId: savedUser.id,
          displayName: dto.veterinarianProfile?.displayName || dto.name,
          calendarColor: dto.veterinarianProfile?.calendarColor || null,
          isBookable: dto.veterinarianProfile?.isBookable ?? true,
        });

        const savedVeterinarian = await queryRunner.manager.save(Veterinarian, veterinarianProfile);

        // Copy clinic business hours to veterinarian availabilities
        await this.copyClinicHoursToVeterinarian(
          queryRunner,
          clinicId,
          savedVeterinarian.id,
        );

        veterinarianProfile = savedVeterinarian;
      }

      await queryRunner.commitTransaction();

      // Send invitation email (best-effort, don't fail if email fails)
      const clinic = await this.clinicRepository.findOne({
        where: { id: clinicId },
      });
      const roleNames = roles.map((r) => r.name);

      this.emailService.sendStaffInvitation({
        staffName: dto.name,
        staffEmail: dto.email,
        clinicName: clinic?.name || 'VibraLive Clinic',
        invitationToken,
        expiresAt: invitationExpires,
        roles: roleNames,
      });

      return this.mapToResponse(savedUser, roles, stylistProfile, veterinarianProfile);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listClinicUsers(
    clinicId: string,
    query: ListClinicUsersQueryDto,
  ): Promise<ClinicUserResponseDto[]> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.clinic_id = :clinicId', { clinicId });

    // Search filter
    if (query.search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Status filter
    if (query.status) {
      queryBuilder.andWhere('user.status = :status', { status: query.status });
    }

    queryBuilder.orderBy('user.created_at', 'DESC');

    const users = await queryBuilder.getMany();

    // Load roles and stylist profiles for all users
    const userIds = users.map((u) => u.id);

    if (userIds.length === 0) {
      return [];
    }

    // Load user roles with role details
    const userRolesData = await this.userRoleRepository
      .createQueryBuilder('ur')
      .leftJoinAndSelect('ur.role', 'role')
      .where('ur.user_id IN (:...userIds)', { userIds })
      .getMany();

    // Group roles by user
    const rolesByUser = new Map<string, Role[]>();
    for (const ur of userRolesData) {
      const existing = rolesByUser.get(ur.userId) || [];
      existing.push(ur.role);
      rolesByUser.set(ur.userId, existing);
    }

    // Load stylists
    const stylists = await this.stylistRepository.find({
      where: { userId: In(userIds) },
    });

    const stylistByUser = new Map<string, Stylist>();
    for (const stylist of stylists) {
      stylistByUser.set(stylist.userId, stylist);
    }

    // Load veterinarians
    const veterinarians = await this.veterinarianRepository.find({
      where: { userId: In(userIds) },
    });

    const veterinarianByUser = new Map<string, Veterinarian>();
    for (const veterinarian of veterinarians) {
      veterinarianByUser.set(veterinarian.userId, veterinarian);
    }

    // Filter by isStylist if specified
    let filteredUsers = users;
    if (query.isStylist !== undefined) {
      filteredUsers = users.filter((u) => {
        const hasStylist = stylistByUser.has(u.id);
        return query.isStylist ? hasStylist : !hasStylist;
      });
    }

    // Filter by isVeterinarian if specified
    if (query.isVeterinarian !== undefined) {
      filteredUsers = filteredUsers.filter((u) => {
        const hasVeterinarian = veterinarianByUser.has(u.id);
        return query.isVeterinarian ? hasVeterinarian : !hasVeterinarian;
      });
    }

    return filteredUsers.map((user) =>
      this.mapToResponse(
        user,
        rolesByUser.get(user.id) || [],
        stylistByUser.get(user.id) || null,
        veterinarianByUser.get(user.id) || null,
      ),
    );
  }

  async getClinicUser(
    clinicId: string,
    userId: string,
  ): Promise<ClinicUserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, clinicId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    const roles = userRoles.map((ur) => ur.role);

    const stylist = await this.stylistRepository.findOne({
      where: { userId },
    });

    const veterinarian = await this.veterinarianRepository.findOne({
      where: { userId },
    });

    return this.mapToResponse(user, roles, stylist, veterinarian);
  }

  async updateClinicUser(
    clinicId: string,
    userId: string,
    dto: UpdateClinicUserDto,
    updatedBy?: string,
  ): Promise<ClinicUserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, clinicId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update basic user fields
      if (dto.name !== undefined) {
        user.name = dto.name;
      }
      if (dto.phone !== undefined) {
        user.phone = dto.phone;
      }

      await queryRunner.manager.save(User, user);

      // Handle roles update
      let currentRoles: Role[] = [];
      if (dto.roles !== undefined) {
        // Get new roles
        const newRoles = await this.roleRepository.find({
          where: [
            { code: In(dto.roles), clinicId: IsNull() },
            { code: In(dto.roles), clinicId },
          ],
        });

        if (newRoles.length !== dto.roles.length) {
          const foundCodes = newRoles.map((r) => r.code);
          const missing = dto.roles.filter((c) => !foundCodes.includes(c));
          throw new BadRequestException(`Roles no encontrados: ${missing.join(', ')}`);
        }

        // Get current roles
        const currentUserRoles = await queryRunner.manager.find(UserRole, {
          where: { userId },
          relations: ['role'],
        });
        const currentRoleCodes = currentUserRoles.map((ur) => ur.role.code);

        // Determine added and removed roles
        const newRoleCodes = newRoles.map((r) => r.code);
        const addedRoleCodes = newRoleCodes.filter((c) => !currentRoleCodes.includes(c));
        const removedRoleCodes = currentRoleCodes.filter((c) => !newRoleCodes.includes(c));

        // Handle CLINIC_STYLIST role changes
        const hadStylistRole = currentRoleCodes.includes('CLINIC_STYLIST');
        const hasStylistRole = newRoleCodes.includes('CLINIC_STYLIST');

        // Handle CLINIC_VETERINARIAN role changes
        const hadVeterinarianRole = currentRoleCodes.includes('CLINIC_VETERINARIAN');
        const hasVeterinarianRole = newRoleCodes.includes('CLINIC_VETERINARIAN');

        // Remove old role assignments
        if (removedRoleCodes.length > 0) {
          const rolesToRemove = currentUserRoles
            .filter((ur) => removedRoleCodes.includes(ur.role.code))
            .map((ur) => ur.roleId);

          if (rolesToRemove.length > 0) {
            await queryRunner.manager.delete(UserRole, {
              userId,
              roleId: In(rolesToRemove),
            });
          }
        }

        // Add new role assignments
        if (addedRoleCodes.length > 0) {
          const rolesToAdd = newRoles.filter((r) => addedRoleCodes.includes(r.code));
          const newUserRoles = rolesToAdd.map((role) => ({
            userId,
            roleId: role.id,
          }));
          await queryRunner.manager.save(UserRole, newUserRoles);
        }

        // Handle stylist profile
        if (!hadStylistRole && hasStylistRole) {
          // Create stylist profile
          const stylistProfile = queryRunner.manager.create(Stylist, {
            clinicId,
            userId,
            displayName: dto.stylistProfile?.displayName || user.name,
            calendarColor: dto.stylistProfile?.calendarColor || null,
            isBookable: dto.stylistProfile?.isBookable ?? true,
          });
          await queryRunner.manager.save(Stylist, stylistProfile);
        } else if (hadStylistRole && !hasStylistRole) {
          // Set stylist as not bookable (do NOT delete)
          await queryRunner.manager.update(
            Stylist,
            { userId },
            { isBookable: false },
          );
        }

        // Handle veterinarian profile
        if (!hadVeterinarianRole && hasVeterinarianRole) {
          // Create veterinarian profile
          const veterinarianProfile = queryRunner.manager.create(Veterinarian, {
            clinicId,
            userId,
            displayName: dto.veterinarianProfile?.displayName || user.name,
            calendarColor: dto.veterinarianProfile?.calendarColor || null,
            isBookable: dto.veterinarianProfile?.isBookable ?? true,
          });
          await queryRunner.manager.save(Veterinarian, veterinarianProfile);
        } else if (hadVeterinarianRole && !hasVeterinarianRole) {
          // Set veterinarian as not bookable (do NOT delete)
          await queryRunner.manager.update(
            Veterinarian,
            { userId },
            { isBookable: false },
          );
        }

        currentRoles = newRoles;
      } else {
        // Load current roles
        const userRoles = await queryRunner.manager.find(UserRole, {
          where: { userId },
          relations: ['role'],
        });
        currentRoles = userRoles.map((ur) => ur.role);
      }

      // Update stylist profile if provided and user is a stylist
      if (dto.stylistProfile) {
        const existingStylist = await queryRunner.manager.findOne(Stylist, {
          where: { userId },
        });

        if (existingStylist) {
          if (dto.stylistProfile.displayName !== undefined) {
            existingStylist.displayName = dto.stylistProfile.displayName;
          }
          if (dto.stylistProfile.calendarColor !== undefined) {
            existingStylist.calendarColor = dto.stylistProfile.calendarColor;
          }
          if (dto.stylistProfile.isBookable !== undefined) {
            existingStylist.isBookable = dto.stylistProfile.isBookable;
          }
          await queryRunner.manager.save(Stylist, existingStylist);
        }
      }

      // Update veterinarian profile if provided and user is a veterinarian
      if (dto.veterinarianProfile) {
        const existingVeterinarian = await queryRunner.manager.findOne(Veterinarian, {
          where: { userId },
        });

        if (existingVeterinarian) {
          if (dto.veterinarianProfile.displayName !== undefined) {
            existingVeterinarian.displayName = dto.veterinarianProfile.displayName;
          }
          if (dto.veterinarianProfile.calendarColor !== undefined) {
            existingVeterinarian.calendarColor = dto.veterinarianProfile.calendarColor;
          }
          if (dto.veterinarianProfile.isBookable !== undefined) {
            existingVeterinarian.isBookable = dto.veterinarianProfile.isBookable;
          }
          await queryRunner.manager.save(Veterinarian, existingVeterinarian);
        }
      }

      await queryRunner.commitTransaction();

      // Reload data for response
      const stylist = await this.stylistRepository.findOne({
        where: { userId },
      });

      const veterinarian = await this.veterinarianRepository.findOne({
        where: { userId },
      });

      return this.mapToResponse(user, currentRoles, stylist, veterinarian);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deactivateUser(
    clinicId: string,
    userId: string,
    deactivatedBy: string,
  ): Promise<ClinicUserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, clinicId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (user.status === 'DEACTIVATED') {
      throw new BadRequestException('El usuario ya está desactivado');
    }

    user.status = 'DEACTIVATED';
    user.deactivatedAt = new Date();
    user.deactivatedBy = deactivatedBy;

    await this.userRepository.save(user);

    // Also set stylist as not bookable
    await this.stylistRepository.update(
      { userId },
      { isBookable: false },
    );

    // Also set veterinarian as not bookable
    await this.veterinarianRepository.update(
      { userId },
      { isBookable: false },
    );

    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    const stylist = await this.stylistRepository.findOne({
      where: { userId },
    });

    const veterinarian = await this.veterinarianRepository.findOne({
      where: { userId },
    });

    return this.mapToResponse(
      user,
      userRoles.map((ur) => ur.role),
      stylist,
      veterinarian,
    );
  }

  /**
   * Copy clinic business hours to stylist availabilities
   * Maps clinic hours (mon-sun) to stylist_availabilities (0-6 for Monday-Sunday)
   */
  private async copyClinicHoursToStylist(
    queryRunner: any,
    clinicId: string,
    stylistId: string,
  ): Promise<void> {
    try {
      // Get clinic configuration
      const config = await queryRunner.manager.findOne(ClinicConfiguration, {
        where: { clinicId },
      });

      if (!config || !config.businessHours?.week) {
        console.warn(
          `No business hours configured for clinic ${clinicId}, skipping stylist availability setup`,
        );
        return;
      }

      const { week } = config.businessHours;

      // Map day names to day of week (0 = Monday in ISO 8601)
      const dayMap: { [key: string]: number } = {
        mon: 0,
        tue: 1,
        wed: 2,
        thu: 3,
        fri: 4,
        sat: 5,
        sun: 6,
      };

      // Create availability records for each day
      const availabilities: StylistAvailability[] = [];

      for (const [dayName, dayOfWeek] of Object.entries(dayMap)) {
        const dayHours = week[dayName as keyof typeof week];

        if (!dayHours || dayHours.length === 0) {
          // No hours for this day - create inactive entry
          const availability = queryRunner.manager.create(StylistAvailability, {
            stylistId,
            dayOfWeek,
            startTime: '09:00',
            endTime: '09:00',
            isActive: false,
          });
          availabilities.push(availability);
        } else {
          // Use first time slot (most clinics have single slot per day)
          const slot = dayHours[0];
          const availability = queryRunner.manager.create(StylistAvailability, {
            stylistId,
            dayOfWeek,
            startTime: slot.start,
            endTime: slot.end,
            isActive: true,
          });
          availabilities.push(availability);

          // Log if there are multiple slots (not typical but good to know)
          if (dayHours.length > 1) {
            console.warn(
              `Clinic ${clinicId} has multiple time slots for ${dayName} - using first slot only for stylist ${stylistId}`,
            );
          }
        }
      }

      // Save all availabilities in transaction
      await queryRunner.manager.save(StylistAvailability, availabilities);

      console.log(
        `✅ Copied clinic business hours to stylist ${stylistId}`,
      );
    } catch (error) {
      console.error(
        `Error copying business hours to stylist: ${error}`,
      );
      // Don't throw - log and continue (non-critical operation)
    }
  }

  /**
   * Copy clinic business hours to veterinarian availabilities
   * Maps clinic hours (mon-sun) to veterinarian_availabilities (0-6 for Monday-Sunday)
   */
  private async copyClinicHoursToVeterinarian(
    queryRunner: any,
    clinicId: string,
    veterinarianId: string,
  ): Promise<void> {
    try {
      // Get clinic configuration
      const config = await queryRunner.manager.findOne(ClinicConfiguration, {
        where: { clinicId },
      });

      if (!config || !config.businessHours?.week) {
        console.warn(
          `No business hours configured for clinic ${clinicId}, skipping veterinarian availability setup`,
        );
        return;
      }

      const { week } = config.businessHours;

      // Map day names to day of week (0 = Monday in ISO 8601)
      const dayMap: { [key: string]: number } = {
        mon: 0,
        tue: 1,
        wed: 2,
        thu: 3,
        fri: 4,
        sat: 5,
        sun: 6,
      };

      // Create availability records for each day
      const availabilities: VeterinarianAvailability[] = [];

      for (const [dayName, dayOfWeek] of Object.entries(dayMap)) {
        const dayHours = week[dayName as keyof typeof week];

        if (!dayHours || dayHours.length === 0) {
          // No hours for this day - create inactive entry
          const availability = queryRunner.manager.create(VeterinarianAvailability, {
            veterinarianId,
            dayOfWeek,
            startTime: '09:00',
            endTime: '09:00',
            isActive: false,
          });
          availabilities.push(availability);
        } else {
          // Use first time slot (most clinics have single slot per day)
          const slot = dayHours[0];
          const availability = queryRunner.manager.create(VeterinarianAvailability, {
            veterinarianId,
            dayOfWeek,
            startTime: slot.start,
            endTime: slot.end,
            isActive: true,
          });
          availabilities.push(availability);

          // Log if there are multiple slots (not typical but good to know)
          if (dayHours.length > 1) {
            console.warn(
              `Clinic ${clinicId} has multiple time slots for ${dayName} - using first slot only for veterinarian ${veterinarianId}`,
            );
          }
        }
      }

      // Save all availabilities in transaction
      await queryRunner.manager.save(VeterinarianAvailability, availabilities);

      console.log(
        `✅ Copied clinic business hours to veterinarian ${veterinarianId}`,
      );
    } catch (error) {
      console.error(
        `Error copying business hours to veterinarian: ${error}`,
      );
      // Don't throw - log and continue (non-critical operation)
    }
  }

  private mapToResponse(
    user: User,
    roles: Role[],
    stylist: Stylist | null,
    veterinarian: Veterinarian | null = null,
  ): ClinicUserResponseDto {
    const roleResponses: RoleResponseDto[] = roles.map((r) => ({
      code: r.code,
      name: r.name,
    }));

    let stylistResponse: StylistResponseDto | null = null;
    if (stylist) {
      stylistResponse = {
        id: stylist.id,
        displayName: stylist.displayName,
        isBookable: stylist.isBookable,
        calendarColor: stylist.calendarColor,
      };
    }

    let veterinarianResponse: VeterinarianResponseDto | null = null;
    if (veterinarian) {
      veterinarianResponse = {
        id: veterinarian.id,
        displayName: veterinarian.displayName,
        isBookable: veterinarian.isBookable,
        calendarColor: veterinarian.calendarColor,
      };
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      roles: roleResponses,
      isStylist: stylist !== null,
      stylistProfile: stylistResponse,
      isVeterinarian: veterinarian !== null,
      veterinarianProfile: veterinarianResponse,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }
}
