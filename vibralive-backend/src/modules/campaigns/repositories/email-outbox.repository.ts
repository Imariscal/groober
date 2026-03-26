import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailOutbox, EmailStatus } from '@/database/entities/email-outbox.entity';

export interface EmailQueryOptions {
  status?: EmailStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class EmailOutboxRepository {
  constructor(
    @InjectRepository(EmailOutbox)
    private repo: Repository<EmailOutbox>,
  ) {}

  async findById(id: string): Promise<EmailOutbox | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['clinic', 'client', 'campaignRecipient'],
    });
  }

  async findByClinic(
    clinicId: string,
    options?: EmailQueryOptions,
  ): Promise<[EmailOutbox[], number]> {
    const query = this.repo
      .createQueryBuilder('e')
      .where('e.clinicId = :clinicId', { clinicId });

    if (options?.status) {
      query.andWhere('e.status = :status', { status: options.status });
    }

    query.orderBy('e.createdAt', 'DESC');

    const page = options?.page || 1;
    const limit = options?.limit || 50;

    query.skip((page - 1) * limit).take(limit);

    return query.getManyAndCount();
  }

  async findPendingEmails(limit: number = 100): Promise<EmailOutbox[]> {
    return this.repo
      .createQueryBuilder('e')
      .where('e.status IN (:...statuses)', {
        statuses: [EmailStatus.PENDING, EmailStatus.QUEUED],
      })
      .andWhere(
        '(e.scheduledAt IS NULL OR e.scheduledAt <= CURRENT_TIMESTAMP)',
      )
      .orderBy('e.createdAt', 'ASC')
      .take(limit)
      .getMany();
  }

  async findRetryableEmails(limit: number = 100): Promise<EmailOutbox[]> {
    return this.repo
      .createQueryBuilder('e')
      .where('e.status = :status', { status: EmailStatus.FAILED })
      .andWhere('e.retryCount < e.maxRetries')
      .andWhere(
        '(e.lastRetryAt IS NULL OR e.lastRetryAt <= NOW() - INTERVAL \'1 hour\')',
      )
      .orderBy('e.createdAt', 'ASC')
      .take(limit)
      .getMany();
  }

  async findByCampaignRecipient(
    campaignRecipientId: string,
  ): Promise<EmailOutbox | null> {
    return this.repo.findOne({
      where: { campaignRecipientId },
    });
  }

  async countByStatus(clinicId: string, status: EmailStatus): Promise<number> {
    return this.repo.count({
      where: { clinicId, status },
    });
  }

  async create(email: Partial<EmailOutbox>): Promise<EmailOutbox> {
    return this.repo.save(this.repo.create(email));
  }

  async createMany(emails: Partial<EmailOutbox>[]): Promise<EmailOutbox[]> {
    return this.repo.save(emails.map((e) => this.repo.create(e)));
  }

  async update(id: string, updates: Partial<EmailOutbox>): Promise<EmailOutbox> {
    await this.repo.update(id, updates);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Email not found after update');
    return updated;
  }

  async updateStatus(
    id: string,
    status: EmailStatus,
    metadata?: Record<string, any>,
  ): Promise<EmailOutbox> {
    const updates: Partial<EmailOutbox> = { status } as Partial<EmailOutbox>;

    if (status === EmailStatus.SENT) {
      updates.sentAt = new Date();
    }

    if (metadata) {
      if (metadata.errorCode) {
        updates.errorCode = metadata.errorCode as string;
      }
      if (metadata.errorMessage) {
        updates.errorMessage = metadata.errorMessage as string;
      }
      if (metadata.providerMessageId) {
        updates.providerMessageId = metadata.providerMessageId as string;
      }
    }

    return this.update(id, updates);
  }

  async incrementRetryCount(id: string): Promise<EmailOutbox> {
    const email = await this.findById(id);
    if (!email) throw new Error('Email not found');
    return this.update(id, {
      retryCount: email.retryCount + 1,
      lastRetryAt: new Date(),
    } as Partial<EmailOutbox>);
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.repo.createQueryBuilder()
      .delete()
      .from(EmailOutbox)
      .where('created_at < :cutoff', { cutoff: cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
