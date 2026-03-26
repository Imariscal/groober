import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { WhatsAppOutbox } from '@/database/entities';

export interface FindWhatsAppOutboxFiltersDto {
  status?: 'queued' | 'sent' | 'failed' | 'delivered';
  message_type?: string;
  retry_count?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class WhatsAppOutboxRepository {
  constructor(
    @InjectRepository(WhatsAppOutbox)
    private readonly repository: Repository<WhatsAppOutbox>,
  ) {}

  async create(data: Partial<WhatsAppOutbox>): Promise<WhatsAppOutbox> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findByIdempotencyKey(
    clinicId: string,
    idempotencyKey: string,
  ): Promise<WhatsAppOutbox | null> {
    return this.repository.findOne({
      where: {
        clinicId: clinicId,
        idempotencyKey: idempotencyKey,
      },
    });
  }

  async findQueued(
    clinicId: string,
    limit: number = 50,
  ): Promise<WhatsAppOutbox[]> {
    return this.repository.find({
      where: {
        clinicId: clinicId,
        status: 'queued',
        retryCount: LessThan(5), // max_retries default
      },
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });
  }

  async findByClinic(
    clinicId: string,
    filters?: FindWhatsAppOutboxFiltersDto,
  ): Promise<[WhatsAppOutbox[], number]> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.repository
      .createQueryBuilder('w')
      .where('w.clinicId = :clinicId', { clinicId });

    if (filters?.status) {
      query.andWhere('w.status = :status', { status: filters.status });
    }

    if (filters?.message_type) {
      query.andWhere('w.messageType = :message_type', {
        message_type: filters.message_type,
      });
    }

    if (filters?.retry_count !== undefined) {
      query.andWhere('w.retryCount = :retry_count', {
        retry_count: filters.retry_count,
      });
    }

    query.orderBy('w.createdAt', 'DESC').skip(skip).take(limit);

    return query.getManyAndCount();
  }

  async findByClinicAndId(
    clinicId: string,
    messageId: string,
  ): Promise<WhatsAppOutbox | null> {
    return this.repository.findOne({
      where: {
        clinicId: clinicId,
        id: messageId,
      },
      relations: ['client'],
    });
  }

  async save(message: WhatsAppOutbox): Promise<WhatsAppOutbox> {
    return this.repository.save(message);
  }

  async markAsSent(
    messageId: string,
    provider_message_id: string,
  ): Promise<void> {
    await this.repository.update(
      { id: messageId },
      {
        status: 'sent',
        providerMessageId: provider_message_id,
        sentAt: new Date(),
      },
    );
  }

  async markAsFailed(messageId: string, provider_error: string): Promise<void> {
    await this.repository.update(
      { id: messageId },
      {
        status: 'failed',
        providerError: provider_error,
        lastRetryAt: new Date(),
      },
    );
  }

  async incrementRetryCount(messageId: string): Promise<void> {
    await this.repository.increment({ id: messageId }, 'retryCount', 1);
  }

  async findExpiredMessages(ageInMinutes: number = 1440): Promise<WhatsAppOutbox[]> {
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() - ageInMinutes);

    return this.repository.find({
      where: {
        status: In(['queued']),
        createdAt: LessThan(expiryDate),
      },
    });
  }
}
