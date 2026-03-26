import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { WhatsAppService } from './whatsapp.service';
import { SendWhatsAppMessageDto, RetryWhatsAppMessageDto } from './dtos';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('whatsapp')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post('send')
  @HttpCode(202) // Accepted - async processing
  @RequirePermission('notifications:create')
  async sendMessage(
    @CurrentClinicId() clinicId: string,
    @Body() dto: SendWhatsAppMessageDto,
  ) {
    const message = await this.whatsAppService.enqueueMessage(clinicId, dto);
    return {
      id: message.id,
      status: message.status,
      phoneNumber: message.phoneNumber,
      messageType: message.messageType,
      idempotencyKey: message.idempotencyKey,
      createdAt: message.createdAt,
    };
  }

  @Get('outbox')
  @RequirePermission('notifications:read')
  async getOutbox(
    @CurrentClinicId() clinicId: string,
    @Query('status') status?: string,
    @Query('message_type') message_type?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const { messages, total } = await this.whatsAppService.findByClinic(
      clinicId,
      {
        status,
        message_type,
        page,
        limit,
      },
    );

    return {
      data: messages.map((msg) => ({
        id: msg.id,
        phoneNumber: msg.phoneNumber,
        messageBody: msg.messageBody,
        status: msg.status,
        messageType: msg.messageType,
        retryCount: msg.retryCount,
        maxRetries: msg.maxRetries,
        providerMessageId: msg.providerMessageId,
        sentAt: msg.sentAt,
        createdAt: msg.createdAt,
        clientId: msg.clientId,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / (limit || 20)),
      },
    };
  }

  @Get('outbox/:id')
  @RequirePermission('notifications:read')
  async getMessage(
    @CurrentClinicId() clinicId: string,
    @Param('id') messageId: string,
  ) {
    const message = await this.whatsAppService.findOne(clinicId, messageId);

    return {
      id: message.id,
      phoneNumber: message.phoneNumber,
      messageBody: message.messageBody,
      clientId: message.clientId,
      status: message.status,
      messageType: message.messageType,
      idempotencyKey: message.idempotencyKey,
      retryCount: message.retryCount,
      maxRetries: message.maxRetries,
      providerMessageId: message.providerMessageId,
      providerError: message.providerError,
      lastRetryAt: message.lastRetryAt,
      sentAt: message.sentAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  @Patch('outbox/:id/retry')
  @HttpCode(202) // Accepted - async processing
  @RequirePermission('notifications:create')
  async retryMessage(
    @CurrentClinicId() clinicId: string,
    @Param('id') messageId: string,
    @Body() dto?: RetryWhatsAppMessageDto,
  ) {
    const message = await this.whatsAppService.retryMessage(clinicId, messageId);

    return {
      id: message.id,
      status: message.status,
      retryCount: message.retryCount,
      maxRetries: message.maxRetries,
      message: 'Message queued for retry',
    };
  }
}
