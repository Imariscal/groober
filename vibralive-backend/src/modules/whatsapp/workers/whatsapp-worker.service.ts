import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic, WhatsAppOutbox } from '@/database/entities';
import { WhatsAppService } from '../whatsapp.service';

@Injectable()
export class WhatsAppWorkerService {
  private readonly logger = new Logger(WhatsAppWorkerService.name);

  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processQueuedMessages(): Promise<void> {
    try {
      // Get all active clinics
      const clinics = await this.clinicRepository.find({
        where: { status: 'ACTIVE' },
      });

      // Process queued messages for each clinic
      for (const clinic of clinics) {
        await this.processClinicQueue(clinic.id);
      }
    } catch (error) {
      this.logger.error('Failed to process WhatsApp queue', error);
    }
  }

  private async processClinicQueue(clinicId: string): Promise<void> {
    try {
      const messages =
        await this.whatsAppService.getQueuedMessages(clinicId, 10);

      for (const message of messages) {
        await this.processMessage(message);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process queue for clinic ${clinicId}`,
        error,
      );
    }
  }

  private async processMessage(message: WhatsAppOutbox): Promise<void> {
    try {
      const startTime = Date.now();

      // MOCK PROVIDER: Simulate WhatsApp API call
      const providerResult = await this.simulateWhatsAppProviderCall(message);

      if (providerResult.success) {
        // Mark as sent
        await this.whatsAppService.markAsSent(
          message.id,
          providerResult.provider_message_id || '',
        );

        const duration = Date.now() - startTime;
        this.logger.log(
          `✓ WhatsApp message ${message.id} sent (${duration}ms)`,
        );
      } else {
        // Mark as failed, will retry next cycle
        await this.whatsAppService.markAsFailed(
          message.id,
          providerResult.error || 'Unknown error',
        );
        await this.whatsAppService.incrementRetryCount(message.id);

        this.logger.warn(
          `✗ WhatsApp message ${message.id} failed: ${providerResult.error}. Retry count: ${message.retryCount + 1}/${message.maxRetries}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to process message ${message.id}`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.whatsAppService.markAsFailed(
        message.id,
        errorMessage,
      );
    }
  }

  // MOCK: Simulates WhatsApp provider API (Twilio / Meta Graphs API)
  // In production, replace with actual Twilio/Meta SDK calls
  private async simulateWhatsAppProviderCall(
    message: WhatsAppOutbox,
  ): Promise<{ success: boolean; provider_message_id?: string; error?: string }> {
    // Simulate API latency (100-200ms)
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 100 + 100),
    );

    // Mock: 90% success rate, 10% failure
    const isSuccess = Math.random() < 0.9;

    if (isSuccess) {
      // Mock provider message ID (Twilio format)
      const provider_message_id = `wamid_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        success: true,
        provider_message_id,
      };
    } else {
      // Mock failure scenarios
      const errors = [
        'Rate limit exceeded',
        'Invalid phone number format',
        'Provider temporarily unavailable',
        'Account suspended',
      ];
      const randomError = errors[Math.floor(Math.random() * errors.length)];
      return {
        success: false,
        error: randomError,
      };
    }
  }

  // Optional: Cleanup old failed messages (not in MVP scope, but useful for production)
  @Cron('0 0 1 * *') // Every month at 1:00 AM
  async cleanupOldMessages(): Promise<void> {
    this.logger.log('Running monthly cleanup of old WhatsApp messages');
    // TODO: Implement cleanup logic
    // - Delete messages older than 30 days with status=failed
    // - Keep for audit trail
  }
}
