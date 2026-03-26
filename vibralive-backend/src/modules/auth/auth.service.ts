import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Clinic } from '@/database/entities';
import { LoginDto, RegisterDto, AcceptInvitationDto, AuthResponseDto } from './dtos/auth.dto';
import {
  getPermissionsByRole,
  FEATURES_BY_ROLE,
  UserRole,
} from './constants/roles-permissions.const';
import { PermissionService } from './services/permission.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
    private jwtService: JwtService,
    private permissionService: PermissionService,
  ) {}

  /**
   * Get user by ID - Retorna datos completos del usuario desde la BD
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id: userId });
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOneBy({
      email: loginDto.email,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive');
    }

    return await this.generateTokens(user);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if clinic phone already exists
    const existingClinic = await this.clinicRepository.findOne({
      where: { phone: registerDto.clinic_phone },
    });

    if (existingClinic) {
      throw new ConflictException('Clinic with this phone already exists');
    }

    // Create clinic
    const clinic = this.clinicRepository.create({
      name: registerDto.clinic_name,
      phone: registerDto.clinic_phone,
      city: registerDto.city,
      country: 'MX',
      subscriptionPlan: 'starter',
      status: 'ACTIVE',
    });

    const savedClinic = await this.clinicRepository.save(clinic);

    // Create owner user
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      clinicId: savedClinic.id,
      name: registerDto.owner_name,
      email: registerDto.owner_email,
      hashedPassword: hashedPassword,
      role: 'CLINIC_OWNER',
      status: 'ACTIVE',
    });

    const savedUser = await this.userRepository.save(user);


    return await this.generateTokens(savedUser);
  }

  async registerSuperAdmin(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Verificar si el correo ya está registrado
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.owner_email },
    });

    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    // Crear superadministrador
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const superAdmin = this.userRepository.create({
      name: registerDto.owner_name,
      email: registerDto.owner_email,
      hashedPassword: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });

    const savedSuperAdmin = await this.userRepository.save(superAdmin);

    return await this.generateTokens(savedSuperAdmin);
  }

  /**
   * Accept an invitation token, set password, activate user, and return JWT
   */
  async acceptInvitation(dto: AcceptInvitationDto): Promise<AuthResponseDto> {
    // Step 1: Find user by invitation token
    const user = await this.userRepository.findOne({
      where: { invitationToken: dto.invitation_token },
    });

    if (!user) {
      throw new NotFoundException('Token de invitación inválido o no encontrado');
    }

    // Step 2: Verify token hasn't expired
    if (user.invitationTokenExpiresAt && user.invitationTokenExpiresAt < new Date()) {
      throw new BadRequestException('El token de invitación ha expirado. Solicita una nueva invitación.');
    }

    // Step 3: Verify user is in INVITED status
    if (user.status !== 'INVITED') {
      throw new BadRequestException('Esta invitación ya fue aceptada o el usuario está inactivo');
    }

    // Step 4: Hash password and activate user
    user.hashedPassword = await bcrypt.hash(dto.password, 10);
    user.status = 'ACTIVE';
    user.invitationToken = null;
    user.invitationTokenExpiresAt = null;

    const savedUser = await this.userRepository.save(user);

    // Step 5: Generate and return JWT tokens
    return await this.generateTokens(savedUser);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOneBy({
      email,
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.hashedPassword,
    );

    return isPasswordValid ? user : null;
  }

  /**
   * Update user's own profile
   */
  async updateUserProfile(userId: string, updateDto: any): Promise<any> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validate email uniqueness if email is being changed
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.userRepository.findOneBy({
        email: updateDto.email,
      });
      if (existingUser) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Update fields
    if (updateDto.name) user.name = updateDto.name;
    if (updateDto.email) user.email = updateDto.email;
    if (updateDto.phone !== undefined) user.phone = updateDto.phone;
    if (updateDto.address !== undefined) user.address = updateDto.address;
    if (updateDto.city !== undefined) user.city = updateDto.city;
    if (updateDto.postal_code !== undefined) user.postalCode = updateDto.postal_code;
    if (updateDto.country !== undefined) user.country = updateDto.country;
    user.updatedAt = new Date();

    const updatedUser = await this.userRepository.save(user);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      city: updatedUser.city,
      postal_code: updatedUser.postalCode,
      country: updatedUser.country,
    };
  }

  /**
   * Change user password
   */
  async changeUserPassword(
    userId: string,
    passwordDto: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validate current password
    const isPasswordValid = await bcrypt.compare(
      passwordDto.currentPassword,
      user.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordDto.newPassword, 10);

    // Update password
    user.hashedPassword = hashedPassword;
    user.updatedAt = new Date();

    try {
      await this.userRepository.save(user);
      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      throw new BadRequestException('Error al cambiar la contraseña');
    }
  }

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    console.log(`[AuthService] Generating tokens for user: ${user.email}, role: ${user.role}`);
    
    // Load permissions from database based on user's role
    const dbPermissions = await this.permissionService.getPermissionsByUserRole(user.role);
    
    console.log(`[AuthService] DB permissions count: ${dbPermissions.length}`);
    
    // Fall back to static permissions if database doesn't have any
    const permissions = dbPermissions.length > 0
      ? dbPermissions
      : getPermissionsByRole(user.role as UserRole);
    
    console.log(`[AuthService] Final permissions count: ${permissions.length}`);
    
    const features = FEATURES_BY_ROLE[user.role as UserRole];
    
    // Fallback para roles desconocidos
    const availableFeatures = features?.modules || [];
    const availableMenu = features?.menu || [];

    const payload = {
      sub: user.id,
      email: user.email,
      clinic_id: user.clinicId,
      role: user.role,
      permissions,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        clinic_id: user.clinicId,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        permissions,
        available_features: availableFeatures,
        available_menu: availableMenu,
      },
    };
  }
}
