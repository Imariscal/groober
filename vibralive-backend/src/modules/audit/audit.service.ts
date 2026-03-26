import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities';

interface AuditActionInput {
  actorId: string;
  action: 'CREATE_CLINIC' | 'UPDATE_CLINIC' | 'SUSPEND_CLINIC' | 'ACTIVATE_CLINIC' | 'CREATE_CLINIC_OWNER' | string;
  entityType: 'clinic' | 'user' | 'client' | 'pet' | 'appointment' | string;
  entityId: string;
  metadata?: Record<string, any>;
  status?: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an action to the audit trail
   * MVP: Mandatory audit log for CREATE_CLINIC, SUSPEND_CLINIC, ACTIVATE_CLINIC, CREATE_OWNER
   */
  async logAction(input: AuditActionInput): Promise<AuditLog> {
    const auditLog = new AuditLog();
    auditLog.actorId = input.actorId;
    auditLog.actorType = 'platform_user';
    auditLog.action = input.action as any;
    auditLog.entityType = input.entityType as any;
    auditLog.entityId = input.entityId;
    auditLog.resourceType = 'platform';
    auditLog.resourceId = null;
    auditLog.metadata = input.metadata || {};
    auditLog.status = input.status || 'SUCCESS';
    auditLog.errorMessage = input.errorMessage || null;

    return this.auditLogRepository.save(auditLog);
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters: {
    actionFilter?: string;
    actorId?: string;
    entityId?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = this.auditLogRepository.createQueryBuilder('audit');

    if (filters.actionFilter) {
      query = query.where('audit.action = :action', {
        action: filters.actionFilter,
      });
    }

    if (filters.actorId) {
      query = query.andWhere('audit.actor_id = :actorId', {
        actorId: filters.actorId,
      });
    }

    if (filters.entityId) {
      query = query.andWhere('audit.entity_id = :entityId', {
        entityId: filters.entityId,
      });
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const [data, total] = await query
      .orderBy('audit.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      pagination: {
        limit,
        offset,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
