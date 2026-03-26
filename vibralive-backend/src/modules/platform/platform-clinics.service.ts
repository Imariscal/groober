import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';
import { Clinic, User, AuditLog } from '../../database/entities';
import {
  CreateClinicDto,
  SuspendClinicDto,
  UpdateClinicDto,
  CreateClinicOwnerDto,
} from './dtos';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class PlatformClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private auditService: AuditService,
    private emailService: EmailService,
  ) {}

  // List clinics with filters
  async listClinics(filters: {
    limit?: number;
    offset?: number;
    status?: string;
    plan?: string;
    city?: string;
    search?: string;
  }) {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query = this.clinicRepository.createQueryBuilder('clinic');

    // Por defecto, mostrar ACTIVE y SUSPENDED, excluir DELETED
    if (!filters.status) {
      query = query.where('clinic.status IN (:...statuses)', {
        statuses: ['ACTIVE', 'SUSPENDED'],
      });
    } else {
      query = query.where('clinic.status = :status', {
        status: filters.status,
      });
    }

    if (filters.plan) {
      query = query.andWhere('clinic.plan = :plan', { plan: filters.plan });
    }

    if (filters.city) {
      query = query.andWhere('clinic.city = :city', { city: filters.city });
    }

    if (filters.search) {
      query = query.andWhere(
        '(clinic.name ILIKE :search OR clinic.city ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [data, total] = await query
      .orderBy('clinic.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    // Get total counts for all statuses
    const totalActive = await this.clinicRepository.count({
      where: { status: 'ACTIVE' },
    });

    const totalSuspended = await this.clinicRepository.count({
      where: { status: 'SUSPENDED' },
    });

    return {
      data,
      pagination: {
        limit,
        offset,
        total,
        page: Math.floor(offset / limit) + 1,
        pages: Math.ceil(total / limit),
      },
      counts: {
        total: totalActive + totalSuspended,
        active: totalActive,
        suspended: totalSuspended,
      },
    };
  }

  // Get clinic by ID
  async getClinicById(clinicId: string): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new NotFoundException(
        `Clínica con ID ${clinicId} no encontrada`,
      );
    }

    return clinic;
  }

  // Create clinic
  async createClinic(dto: CreateClinicDto, actorId: string): Promise<Clinic> {
    // Validation: phone uniqueness (R-CL-001)
    const existingPhone = await this.clinicRepository.findOne({
      where: { phone: dto.phone },
    });

    if (existingPhone) {
      throw new ConflictException(
        'El teléfono de la clínica ya existe en el sistema',
      );
    }

    // Create clinic with defaults
    const clinic = new Clinic();
    clinic.name = dto.name;
    clinic.phone = dto.phone;
    if (dto.email) clinic.email = dto.email;
    if (dto.responsable) clinic.responsable = dto.responsable;
    if (dto.city) clinic.city = dto.city;
    clinic.country = dto.country || 'MX';
    clinic.plan = dto.plan || 'STARTER';
    clinic.subscriptionPlan = (
      dto.subscription_plan || 'starter'
    ).toLowerCase();
    clinic.status = 'ACTIVE';
    if (dto.whatsapp_account_id) clinic.whatsappAccountId = dto.whatsapp_account_id;
    if (dto.whatsapp_phone_id) clinic.whatsappPhoneId = dto.whatsapp_phone_id;
    clinic.maxStaffUsers = dto.max_staff_users || 100;
    clinic.maxClients = dto.max_clients || 1000;
    clinic.maxPets = dto.max_pets || 5000;
    clinic.activeStaffCount = 0;
    clinic.activeClientsCount = 0;
    clinic.activePetsCount = 0;

    // Si se especifica subscription_plan, buscar el plan y aplicar límites
    if (dto.subscription_plan) {
      const planRepo = this.clinicRepository.manager.getRepository('SubscriptionPlan');
      const plan = await planRepo.findOne({ where: { code: dto.subscription_plan } });
      if (plan) {
        clinic.subscriptionPlanId = plan.id;
        clinic.maxStaffUsers = plan.maxStaffUsers;
        clinic.maxClients = plan.maxClients;
        clinic.maxPets = plan.maxPets;
      }
    }

    const savedClinic = await this.clinicRepository.save(clinic);

    // Audit log (R-CL-006)
    await this.auditService.logAction({
      actorId,
      action: 'CREATE_CLINIC',
      entityType: 'clinic',
      entityId: savedClinic.id,
      metadata: {
        clinic_name: clinic.name,
        phone: clinic.phone,
        city: clinic.city,
        plan: clinic.plan,
      },
    });

    return savedClinic;
  }

  // Update clinic
  async updateClinic(
    clinicId: string,
    dto: UpdateClinicDto,
    actorId: string,
  ): Promise<Clinic> {
    const clinic = await this.getClinicById(clinicId);
    const before = { ...clinic };

    // Only allow specific fields to be updated
    if (dto.name) clinic.name = dto.name;
    if (dto.city) clinic.city = dto.city;
    if (dto.plan) clinic.plan = dto.plan;
    if (dto.subscription_plan) {
      const planRepo = this.clinicRepository.manager.getRepository('SubscriptionPlan');
      const plan = await planRepo.findOne({ where: { code: dto.subscription_plan } });
      if (plan) {
        clinic.subscriptionPlanId = plan.id;
        clinic.maxStaffUsers = plan.maxStaffUsers;
        clinic.maxClients = plan.maxClients;
        clinic.maxPets = plan.maxPets;
      }
    }

    const updated = await this.clinicRepository.save(clinic);

    await this.auditService.logAction({
      actorId,
      action: 'UPDATE_CLINIC',
      entityType: 'clinic',
      entityId: clinicId,
      metadata: {
        before: { name: before.name, city: before.city, plan: before.plan },
        after: {
          name: updated.name,
          city: updated.city,
          plan: updated.plan,
        },
      },
    });

    return updated;
  }

  // Suspend clinic
  async suspendClinic(
    clinicId: string,
    dto: SuspendClinicDto,
    actorId: string,
  ): Promise<Clinic> {
    const clinic = await this.getClinicById(clinicId);

    if (clinic.status === 'SUSPENDED') {
      throw new BadRequestException(
        'La clínica ya está suspendida',
      );
    }

    clinic.status = 'SUSPENDED';
    clinic.suspendedAt = new Date();
    clinic.suspendedBy = actorId;
    clinic.suspensionReason = dto.reason;

    const updated = await this.clinicRepository.save(clinic);

    await this.auditService.logAction({
      actorId,
      action: 'SUSPEND_CLINIC',
      entityType: 'clinic',
      entityId: clinicId,
      metadata: {
        reason: dto.reason,
        suspended_at: updated.suspendedAt,
      },
    });

    return updated;
  }

  // Activate clinic
  async activateClinic(
    clinicId: string,
    actorId: string,
  ): Promise<Clinic> {
    const clinic = await this.getClinicById(clinicId);

    if (clinic.status === 'ACTIVE') {
      throw new BadRequestException(
        'La clínica ya está activa',
      );
    }

    clinic.status = 'ACTIVE';
    clinic.suspendedAt = null;
    clinic.suspendedBy = null;
    clinic.suspensionReason = null;

    const updated = await this.clinicRepository.save(clinic);

    await this.auditService.logAction({
      actorId,
      action: 'ACTIVATE_CLINIC',
      entityType: 'clinic',
      entityId: clinicId,
      metadata: {
        activated_at: new Date(),
      },
    });

    return updated;
  }

  /**
   * Create clinic owner (first admin user)
   * Strategy: INVITATION with token (24h expiry)
   * Rule R-CL-003: Validates clinic has valid owner
   * Rule R-CL-005: Email uniqueness
   * Rule R-CL-006: Audit log
   */
  async createClinicOwner(
    clinicId: string,
    dto: CreateClinicOwnerDto,
    actorId: string,
  ) {
    // Step 1: Verify clinic exists
    const clinic = await this.getClinicById(clinicId);

    // Step 2: Check if clinic already has active owner (R-CL-003)
    const existingOwner = await this.userRepository.findOne({
      where: [
        {
          clinicId,
          role: 'owner',
          status: 'ACTIVE',
        },
        {
          clinicId,
          role: 'owner',
          status: 'INVITED',
        },
      ],
    });

    if (existingOwner && existingOwner.invitationTokenExpiresAt && existingOwner.invitationTokenExpiresAt > new Date()) {
      throw new ConflictException(
        'Esta clínica ya tiene un owner asignado',
      );
    }

    // Step 3: Validate email uniqueness (R-CL-005)
    const existingEmail = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException(
        'El email ya está registrado en el sistema',
      );
    }

    // Step 4: Generate invitation token (24h expiry)
    const invitationToken = uuidv4();
    const invitationExpiresAt = addHours(new Date(), 24);

    // Step 5: Create user with INVITED status
    const user = new User();
    user.clinicId = clinicId;
    user.name = dto.name;
    user.email = dto.email;
    if (dto.phone) user.phone = dto.phone;
    user.role = 'CLINIC_OWNER';
    user.status = 'INVITED';
    user.hashedPassword = ''; // Empty until user accepts invitation
    user.invitationToken = invitationToken;
    user.invitationTokenExpiresAt = invitationExpiresAt;

    const savedUser = await this.userRepository.save(user);

    // Step 6: Audit log (R-CL-006)
    await this.auditService.logAction({
      actorId,
      action: 'CREATE_CLINIC_OWNER',
      entityType: 'user',
      entityId: savedUser.id,
      metadata: {
        clinic_id: clinicId,
        owner_name: dto.name,
        owner_email: dto.email,
        invitation_token: invitationToken,
        expires_at: invitationExpiresAt,
      },
    });

    // Step 7: Send invitation email
    await this.emailService.sendOwnerInvitation({
      ownerName: dto.name,
      ownerEmail: dto.email,
      clinicName: clinic.name,
      invitationToken,
      expiresAt: invitationExpiresAt,
    });

    return {
      id: savedUser.id,
      clinic_id: savedUser.clinicId,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      status: savedUser.status,
      invitation_token: invitationToken,
      invitation_expires_at: invitationExpiresAt,
      message:
        'Invitación enviada. El propietario debe aceptarla antes de que expire.',
    };
  }

  /**
   * Get dashboard KPIs (used by dashboard service)
   */
  async getDashboardKPIs() {
    // Total clinics count (ACTIVE + SUSPENDED, excluyendo DELETED)
    const totalClinics = await this.clinicRepository
      .createQueryBuilder('clinic')
      .where('clinic.status IN (:...statuses)', { statuses: ['ACTIVE', 'SUSPENDED'] })
      .getCount();

    // Active clinics count
    const activeClinics = await this.clinicRepository.count({
      where: { status: 'ACTIVE' },
    });

    // Suspended clinics count
    const suspendedClinics = await this.clinicRepository.count({
      where: { status: 'SUSPENDED' },
    });

    // Sum of active users across all clinics
    const sumActiveStaff = await this.clinicRepository
      .createQueryBuilder('clinic')
      .select('COALESCE(SUM(clinic.active_staff_count), 0)', 'total')
      .getRawOne();

    // Sum of active clients across all clinics
    const sumActiveClients = await this.clinicRepository
      .createQueryBuilder('clinic')
      .select('COALESCE(SUM(clinic.active_clients_count), 0)', 'total')
      .getRawOne();

    // Sum of active pets across all clinics
    const sumActivePets = await this.clinicRepository
      .createQueryBuilder('clinic')
      .select('COALESCE(SUM(clinic.active_pets_count), 0)', 'total')
      .getRawOne();

    // Last 10 clinics for UI
    const last10Clinics = await this.clinicRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      total_clinics: totalClinics,
      active_clinics: activeClinics,
      suspended_clinics: suspendedClinics,
      sum_active_staff: parseInt(sumActiveStaff?.total || 0),
      sum_active_clients: parseInt(sumActiveClients?.total || 0),
      sum_active_pets: parseInt(sumActivePets?.total || 0),
      last_10_clinics: last10Clinics,
    };
  }

  /**
   * Asignar/cambiar plan de suscripción a una clínica
   */
  async assignPlan(clinicId: string, planId: string, actorId: string): Promise<Clinic> {
    const clinic = await this.getClinicById(clinicId);
    const plan = await this.clinicRepository.manager.getRepository('SubscriptionPlan').findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Plan de suscripción no encontrado');
    }
    // Actualiza el plan y los límites
    clinic.subscriptionPlanId = plan.id;
    clinic.subscriptionPlan = plan.code;
    clinic.plan = plan.name.toUpperCase();
    clinic.maxStaffUsers = plan.maxStaffUsers;
    clinic.maxClients = plan.maxClients;
    clinic.maxPets = plan.maxPets;
    const updated = await this.clinicRepository.save(clinic);
    await this.auditService.logAction({
      actorId,
      action: 'ASSIGN_PLAN',
      entityType: 'clinic',
      entityId: clinicId,
      metadata: {
        plan_id: plan.id,
        plan_code: plan.code,
        plan_name: plan.name,
      },
    });
    return updated;
  }
}
