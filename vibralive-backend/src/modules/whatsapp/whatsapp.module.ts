import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsAppOutbox, Clinic } from '@/database/entities';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppOutboxRepository } from './repositories/whatsapp-outbox.repository';
import { WhatsAppWorkerService } from './workers/whatsapp-worker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsAppOutbox, Clinic]),
    ScheduleModule.forRoot(),
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppOutboxRepository, WhatsAppWorkerService],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
