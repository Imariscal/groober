import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../../database/entities/subscription-plan.entity';
import { AuditService } from '../audit/audit.service';

export interface CreatePlanDto {
  code: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingPeriod?: 'monthly' | 'yearly';
  maxStaffUsers: number;
  maxClients: number;
  maxPets: number;
  features?: string[];
  sortOrder?: number;
  isPopular?: boolean;
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  billingPeriod?: 'monthly' | 'yearly';
  maxStaffUsers?: number;
  maxClients?: number;
  maxPets?: number;
  features?: string[];
  status?: 'active' | 'inactive';
  sortOrder?: number;
  isPopular?: boolean;
}

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    private auditService: AuditService,
  ) {}

  /**
   * List all subscription plans
   */
  async listPlans(filters?: { status?: string }) {
    const query = this.planRepository.createQueryBuilder('plan');

    if (filters?.status) {
      query.where('plan.status = :status', { status: filters.status });
    }

    const plans = await query.orderBy('plan.sortOrder', 'ASC').getMany();

    return {
      data: plans,
      total: plans.length,
    };
  }

  /**
   * Get plan by ID
   */
  async getPlanById(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });

    if (!plan) {
      throw new NotFoundException(`Plan con ID ${id} no encontrado`);
    }

    return plan;
  }

  /**
   * Get plan by code
   */
  async getPlanByCode(code: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { code } });

    if (!plan) {
      throw new NotFoundException(`Plan con código ${code} no encontrado`);
    }

    return plan;
  }

  /**
   * Create a new subscription plan
   */
  async createPlan(dto: CreatePlanDto, actorId: string): Promise<SubscriptionPlan> {
    // Check if code already exists
    const existingPlan = await this.planRepository.findOne({
      where: { code: dto.code.toLowerCase() },
    });

    if (existingPlan) {
      throw new ConflictException(`Ya existe un plan con el código ${dto.code}`);
    }

    const plan = this.planRepository.create({
      code: dto.code.toLowerCase(),
      name: dto.name,
      description: dto.description || null,
      price: dto.price,
      currency: dto.currency || 'MXN',
      billingPeriod: dto.billingPeriod || 'monthly',
      maxStaffUsers: dto.maxStaffUsers,
      maxClients: dto.maxClients,
      maxPets: dto.maxPets,
      features: dto.features || [],
      sortOrder: dto.sortOrder || 0,
      isPopular: dto.isPopular || false,
      status: 'active',
    });

    const savedPlan = await this.planRepository.save(plan);

    // Log audit
    await this.auditService.logAction({
      action: 'PLAN_CREATED',
      actorId,
      entityType: 'subscription_plan',
      entityId: savedPlan.id,
      metadata: { planCode: savedPlan.code, planName: savedPlan.name },
    });

    return savedPlan;
  }

  /**
   * Update a subscription plan
   */
  async updatePlan(
    id: string,
    dto: UpdatePlanDto,
    actorId: string,
  ): Promise<SubscriptionPlan> {
    const plan = await this.getPlanById(id);

    // Update fields
    if (dto.name !== undefined) plan.name = dto.name;
    if (dto.description !== undefined) plan.description = dto.description;
    if (dto.price !== undefined) plan.price = dto.price;
    if (dto.currency !== undefined) plan.currency = dto.currency;
    if (dto.billingPeriod !== undefined) plan.billingPeriod = dto.billingPeriod;
    if (dto.maxStaffUsers !== undefined) plan.maxStaffUsers = dto.maxStaffUsers;
    if (dto.maxClients !== undefined) plan.maxClients = dto.maxClients;
    if (dto.maxPets !== undefined) plan.maxPets = dto.maxPets;
    if (dto.features !== undefined) plan.features = dto.features;
    if (dto.status !== undefined) plan.status = dto.status;
    if (dto.sortOrder !== undefined) plan.sortOrder = dto.sortOrder;
    if (dto.isPopular !== undefined) plan.isPopular = dto.isPopular;

    const updatedPlan = await this.planRepository.save(plan);

    // Log audit
    await this.auditService.logAction({
      action: 'PLAN_UPDATED',
      actorId,
      entityType: 'subscription_plan',
      entityId: updatedPlan.id,
      metadata: { planCode: updatedPlan.code, changes: dto },
    });

    return updatedPlan;
  }

  /**
   * Delete (soft) a subscription plan
   */
  async deletePlan(id: string, actorId: string): Promise<void> {
    const plan = await this.getPlanById(id);

    // Instead of hard delete, set status to inactive
    plan.status = 'inactive';
    await this.planRepository.save(plan);

    // Log audit
    await this.auditService.logAction({
      action: 'PLAN_DELETED',
      actorId,
      entityType: 'subscription_plan',
      entityId: plan.id,
      metadata: { planCode: plan.code },
    });
  }

  /**
   * Toggle plan status
   */
  async togglePlanStatus(id: string, actorId: string): Promise<SubscriptionPlan> {
    const plan = await this.getPlanById(id);

    plan.status = plan.status === 'active' ? 'inactive' : 'active';
    const updatedPlan = await this.planRepository.save(plan);

    // Log audit
    await this.auditService.logAction({
      action: 'PLAN_STATUS_CHANGED',
      actorId,
      entityType: 'subscription_plan',
      entityId: plan.id,
      metadata: { planCode: plan.code, newStatus: plan.status },
    });

    return updatedPlan;
  }
}
