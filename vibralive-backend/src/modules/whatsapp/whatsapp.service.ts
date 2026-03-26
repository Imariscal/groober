import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WhatsAppOutbox } from '@/database/entities';
import { WhatsAppOutboxRepository } from './repositories/whatsapp-outbox.repository';
import { SendWhatsAppMessageDto } from './dtos';

@Injectable()
export class WhatsAppService {
  constructor(
    private readonly outboxRepository: WhatsAppOutboxRepository,
  ) {}

  async enqueueMessage(
    clinicId: string,
    dto: SendWhatsAppMessageDto,
  ): Promise<WhatsAppOutbox> {
    // Validate clinic exists and is active
    // TODO: Add clinic validation if needed

    // Handle idempotency: use provided or generate new one
    const idempotencyKey = dto.idempotency_key || crypto.randomUUID();

    // Check for duplicate (idempotency check)
    const existingMessage = await this.outboxRepository.findByIdempotencyKey(
      clinicId,
      idempotencyKey,
    );
    if (existingMessage) {
      // Return existing instead of creating duplicate
      return existingMessage;
      // OR throw ConflictException for strict idempotency
      // throw new ConflictException(
      //   'Message with this idempotency_key already exists',
      // );
    }

    // Create outbox message (queued by default)
    const message = await this.outboxRepository.create({
      clinic_id: clinicId,
      phone_number: dto.phone_number,
      message_body: dto.message_body,
      client_id: dto.client_id || null,
      message_type: dto.message_type || 'custom',
      idempotency_key: idempotencyKey,
      status: 'queued',
      retry_count: 0,
      max_retries: 5,
      channel: 'whatsapp',
    } as Partial<WhatsAppOutbox>);

    return message;
  }

  async findByClinic(
    clinicId: string,
    filters?: {
      status?: string;
      message_type?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ messages: WhatsAppOutbox[]; total: number }> {
    const [messages, total] = await this.outboxRepository.findByClinic(
      clinicId,
      {
        status: filters?.status as 'queued' | 'sent' | 'failed' | 'delivered' | undefined,
        message_type: filters?.message_type,
        page: filters?.page,
        limit: filters?.limit,
      },
    );
    return { messages, total };
  }

  async findOne(clinicId: string, messageId: string): Promise<WhatsAppOutbox> {
    const message = await this.outboxRepository.findByClinicAndId(
      clinicId,
      messageId,
    );
    if (!message) {
      throw new NotFoundException(
        `WhatsApp message ${messageId} not found in clinic ${clinicId}`,
      );
    }
    return message;
  }

  async retryMessage(
    clinicId: string,
    messageId: string,
  ): Promise<WhatsAppOutbox> {
    const message = await this.findOne(clinicId, messageId);

    if (message.status === 'sent' || message.status === 'delivered') {
      throw new ConflictException(
        `Cannot retry a ${message.status} message`,
      );
    }

    if (message.retryCount >= message.maxRetries) {
      throw new ConflictException(
        `Message has exceeded max retries (${message.maxRetries})`,
      );
    }

    // Reset status to queued, NestJS scheduler will pick it up
    message.status = 'queued';
    message.lastRetryAt = new Date();

    return this.outboxRepository.save(message);
  }

  // Internal method: used by WorkerService to mark sent/failed
  async markAsSent(messageId: string, provider_message_id: string): Promise<void> {
    await this.outboxRepository.markAsSent(messageId, provider_message_id);
  }

  async markAsFailed(messageId: string, provider_error: string): Promise<void> {
    await this.outboxRepository.markAsFailed(messageId, provider_error);
  }

  async incrementRetryCount(messageId: string): Promise<void> {
    await this.outboxRepository.incrementRetryCount(messageId);
  }

  async getQueuedMessages(
    clinicId: string,
    limit: number = 50,
  ): Promise<WhatsAppOutbox[]> {
    return this.outboxRepository.findQueued(clinicId, limit);
  }
}
