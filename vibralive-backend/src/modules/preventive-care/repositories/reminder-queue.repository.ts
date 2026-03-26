import { Injectable } from '@nestjs/common';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ReminderQueue } from '../../../database/entities/reminder-queue.entity';

@Injectable()
export class ReminderQueueRepository {
  constructor(
    @InjectRepository(ReminderQueue)
    private readonly repo: Repository<ReminderQueue>,
  ) {}

  async create(data: Partial<ReminderQueue>): Promise<ReminderQueue> {
    return this.repo.save(this.repo.create(data));
  }

  async bulkCreate(data: Partial<ReminderQueue>[]): Promise<ReminderQueue[]> {
    return this.repo.save(data.map(item => this.repo.create(item)));
  }

  async findById(reminderId: string): Promise<ReminderQueue | null> {
    return this.repo
      .createQueryBuilder('r')
      .where('r.id = :reminderId', { reminderId })
      .leftJoinAndSelect('r.appointment', 'appointment')
      .leftJoinAndSelect('r.petPreventiveEvent', 'event')
      .leftJoinAndSelect('r.client', 'client')
      .getOne();
  }

  async findPendingReminders(
    clinicId?: string,
    limit: number = 100,
  ): Promise<ReminderQueue[]> {
    const query = this.repo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: 'PENDING' })
      .andWhere('r.scheduledFor <= :now', { now: new Date() })
      .leftJoinAndSelect('r.appointment', 'appointment')
      .leftJoinAndSelect('r.petPreventiveEvent', 'event')
      .leftJoinAndSelect('r.client', 'client')
      .orderBy('r.scheduledFor', 'ASC')
      .limit(limit);

    if (clinicId) {
      query.andWhere(
        `(appointment.clinicId = :clinicId OR event.pet.clinicId = :clinicId)`,
        { clinicId },
      );
    }

    return query.getMany();
  }

  async findScheduledReminders(until: Date, limit: number = 100): Promise<ReminderQueue[]> {
    return this.repo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: 'PENDING' })
      .andWhere('r.scheduledFor <= :until', { until })
      .leftJoinAndSelect('r.appointment', 'appointment')
      .leftJoinAndSelect('r.petPreventiveEvent', 'event')
      .leftJoinAndSelect('r.client', 'client')
      .orderBy('r.scheduledFor', 'ASC')
      .limit(limit)
      .getMany();
  }

  async findReminderHistory(
    clinicId: string,
    filters: {
      reminderType?: string;
      channel?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<[ReminderQueue[], number]> {
    const query = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.appointment', 'appointment')
      .leftJoinAndSelect('r.petPreventiveEvent', 'event')
      .leftJoinAndSelect('r.client', 'client')
      .where(
        '(appointment.clinicId = :clinicId OR event.pet.clinicId = :clinicId)',
        { clinicId },
      );

    if (filters.reminderType) {
      query.andWhere('r.reminderType = :reminderType', {
        reminderType: filters.reminderType,
      });
    }
    if (filters.channel) {
      query.andWhere('r.channel = :channel', { channel: filters.channel });
    }
    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim());
      query.andWhere('r.status IN (:...statuses)', { statuses });
    }
    if (filters.dateFrom) {
      query.andWhere('r.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      query.andWhere('r.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    query
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  async updateStatus(reminderId: string, status: string, sentAt?: Date): Promise<void> {
    const update: any = { status };
    if (sentAt) {
      update.sentAt = sentAt;
    }
    await this.repo.update({ id: reminderId }, update);
  }

  async bulkUpdateStatus(reminderIds: string[], status: string): Promise<void> {
    await this.repo.update({ id: In(reminderIds) }, { status: status as 'CANCELLED' | 'PENDING' | 'SENT' | 'FAILED' });
  }

  async incrementRetryCount(reminderId: string): Promise<void> {
    await this.repo.increment({ id: reminderId }, 'retryCount', 1);
  }

  async findFailedReminders(
    maxRetries: number = 3,
    limit: number = 50,
  ): Promise<ReminderQueue[]> {
    return this.repo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: 'FAILED' })
      .andWhere('r.retryCount < :maxRetries', { maxRetries })
      .andWhere('r.lastRetryAt IS NULL OR r.lastRetryAt < DATE_SUB(NOW(), INTERVAL 1 HOUR)')
      .leftJoinAndSelect('r.appointment', 'appointment')
      .leftJoinAndSelect('r.petPreventiveEvent', 'event')
      .leftJoinAndSelect('r.client', 'client')
      .orderBy('r.lastRetryAt', 'ASC')
      .limit(limit)
      .getMany();
  }

  async save(reminder: ReminderQueue): Promise<ReminderQueue> {
    return this.repo.save(reminder);
  }

  async delete(reminderId: string): Promise<void> {
    await this.repo.delete({ id: reminderId });
  }

  async findByAppointment(appointmentId: string): Promise<ReminderQueue[]> {
    return this.repo
      .createQueryBuilder('r')
      .where('r.appointmentId = :appointmentId', { appointmentId })
      .getMany();
  }

  async findByPreventiveEvent(preventiveEventId: string): Promise<ReminderQueue[]> {
    return this.repo
      .createQueryBuilder('r')
      .where('r.petPreventiveEventId = :preventiveEventId', { preventiveEventId })
      .getMany();
  }
}
