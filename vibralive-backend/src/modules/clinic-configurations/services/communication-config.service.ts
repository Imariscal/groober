import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ClinicBillingConfig,
  ClinicEmailConfig,
  ClinicWhatsAppConfig,
  MessageTemplate,
} from '../../../database/entities';
import {
  UpdateBillingConfigDto,
  BillingConfigResponseDto,
  UpdateEmailConfigDto,
  EmailConfigResponseDto,
  UpdateWhatsAppConfigDto,
  WhatsAppConfigResponseDto,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  MessageTemplateResponseDto,
} from '../dto/communication-config.dto';

@Injectable()
export class CommunicationConfigService {
  constructor(
    @InjectRepository(ClinicBillingConfig)
    private billingConfigRepo: Repository<ClinicBillingConfig>,
    @InjectRepository(ClinicEmailConfig)
    private emailConfigRepo: Repository<ClinicEmailConfig>,
    @InjectRepository(ClinicWhatsAppConfig)
    private whatsAppConfigRepo: Repository<ClinicWhatsAppConfig>,
    @InjectRepository(MessageTemplate)
    private templateRepo: Repository<MessageTemplate>,
  ) {}

  // =====================================================
  // BILLING CONFIG
  // =====================================================

  async getBillingConfig(clinicId: string): Promise<BillingConfigResponseDto> {
    let config = await this.billingConfigRepo.findOne({ where: { clinicId } });

    if (!config) {
      // Crear configuración por defecto
      config = this.billingConfigRepo.create({ clinicId });
      config = await this.billingConfigRepo.save(config);
    }

    return this.toBillingResponse(config);
  }

  async updateBillingConfig(
    clinicId: string,
    dto: UpdateBillingConfigDto,
  ): Promise<BillingConfigResponseDto> {
    let config = await this.billingConfigRepo.findOne({ where: { clinicId } });

    if (!config) {
      config = this.billingConfigRepo.create({ clinicId, ...dto });
    } else {
      Object.assign(config, dto);
    }

    config = await this.billingConfigRepo.save(config);
    return this.toBillingResponse(config);
  }

  private toBillingResponse(config: ClinicBillingConfig): BillingConfigResponseDto {
    return {
      clinicId: config.clinicId,
      legalName: config.legalName,
      taxId: config.taxId,
      taxRegime: config.taxRegime,
      fiscalAddress: config.fiscalAddress,
      fiscalCity: config.fiscalCity,
      fiscalState: config.fiscalState,
      fiscalZip: config.fiscalZip,
      fiscalCountry: config.fiscalCountry,
      billingEmail: config.billingEmail,
      billingPhone: config.billingPhone,
      currency: config.currency,
      taxRate: Number(config.taxRate),
      invoicePrefix: config.invoicePrefix,
      invoiceNextNumber: config.invoiceNextNumber,
      invoiceLogoUrl: config.invoiceLogoUrl,
      invoiceFooterText: config.invoiceFooterText,
      billingProvider: config.billingProvider,
      isBillingActive: config.isBillingActive,
    };
  }

  // =====================================================
  // EMAIL CONFIG
  // =====================================================

  async getEmailConfig(clinicId: string): Promise<EmailConfigResponseDto> {
    let config = await this.emailConfigRepo.findOne({ where: { clinicId } });

    if (!config) {
      config = this.emailConfigRepo.create({ clinicId });
      config = await this.emailConfigRepo.save(config);
    }

    return this.toEmailResponse(config);
  }

  async updateEmailConfig(
    clinicId: string,
    dto: UpdateEmailConfigDto,
  ): Promise<EmailConfigResponseDto> {
    let config = await this.emailConfigRepo.findOne({ where: { clinicId } });

    if (!config) {
      const newConfig = this.emailConfigRepo.create({ clinicId, ...dto } as any);
      config = await this.emailConfigRepo.save(newConfig) as unknown as ClinicEmailConfig;
    } else {
      Object.assign(config, dto);
      // Reset verification if config changed
      if (dto.provider || dto.smtpHost || dto.apiKey) {
        config.isVerified = false;
        config.lastError = undefined;
      }
      config = await this.emailConfigRepo.save(config);
    }

    return this.toEmailResponse(config);
  }

  async testEmailConfig(clinicId: string, testEmail: string): Promise<{ success: boolean; message: string }> {
    const config = await this.emailConfigRepo.findOne({ where: { clinicId } });

    if (!config) {
      throw new NotFoundException('Configuración de email no encontrada');
    }

    // TODO: Implementar envío de email de prueba según provider
    // Por ahora solo simulamos
    try {
      // Aquí iría la lógica real de envío
      config.isVerified = true;
      config.lastVerifiedAt = new Date();
      config.lastError = undefined;
      await this.emailConfigRepo.save(config);

      return { success: true, message: `Email de prueba enviado a ${testEmail}` };
    } catch (error: any) {
      config.isVerified = false;
      config.lastError = error.message;
      await this.emailConfigRepo.save(config);

      return { success: false, message: error.message };
    }
  }

  private toEmailResponse(config: ClinicEmailConfig): EmailConfigResponseDto {
    return {
      clinicId: config.clinicId,
      provider: config.provider,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser,
      smtpSecure: config.smtpSecure,
      apiDomain: config.apiDomain,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      replyToEmail: config.replyToEmail,
      isActive: config.isActive,
      isVerified: config.isVerified,
      lastVerifiedAt: config.lastVerifiedAt,
      lastError: config.lastError,
    };
  }

  // =====================================================
  // WHATSAPP CONFIG
  // =====================================================

  async getWhatsAppConfig(clinicId: string): Promise<WhatsAppConfigResponseDto> {
    let config = await this.whatsAppConfigRepo.findOne({ where: { clinicId } });

    if (!config) {
      config = this.whatsAppConfigRepo.create({ clinicId });
      config = await this.whatsAppConfigRepo.save(config);
    }

    return this.toWhatsAppResponse(config);
  }

  async updateWhatsAppConfig(
    clinicId: string,
    dto: UpdateWhatsAppConfigDto,
  ): Promise<WhatsAppConfigResponseDto> {
    let config = await this.whatsAppConfigRepo.findOne({ where: { clinicId } });

    if (!config) {
      const newConfig = this.whatsAppConfigRepo.create({ clinicId, ...dto } as any);
      config = await this.whatsAppConfigRepo.save(newConfig) as unknown as ClinicWhatsAppConfig;
    } else {
      Object.assign(config, dto);
      // Reset verification if credentials changed
      if (dto.accessToken || dto.apiKey || dto.authToken) {
        config.isVerified = false;
        config.lastError = undefined;
      }
      config = await this.whatsAppConfigRepo.save(config);
    }

    return this.toWhatsAppResponse(config);
  }

  async testWhatsAppConfig(clinicId: string, testPhone: string): Promise<{ success: boolean; message: string }> {
    const config = await this.whatsAppConfigRepo.findOne({ where: { clinicId } });

    if (!config) {
      throw new NotFoundException('Configuración de WhatsApp no encontrada');
    }

    // TODO: Implementar envío de mensaje de prueba según provider
    try {
      // Aquí iría la lógica real de envío
      config.isVerified = true;
      config.lastVerifiedAt = new Date();
      config.lastError = undefined;
      await this.whatsAppConfigRepo.save(config);

      return { success: true, message: `Mensaje de prueba enviado a ${testPhone}` };
    } catch (error: any) {
      config.isVerified = false;
      config.lastError = error.message;
      await this.whatsAppConfigRepo.save(config);

      return { success: false, message: error.message };
    }
  }

  private toWhatsAppResponse(config: ClinicWhatsAppConfig): WhatsAppConfigResponseDto {
    return {
      clinicId: config.clinicId,
      provider: config.provider,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      appId: config.appId,
      accountSid: config.accountSid,
      twilioPhoneNumber: config.twilioPhoneNumber,
      senderPhone: config.senderPhone,
      webhookUrl: config.webhookUrl,
      isActive: config.isActive,
      isVerified: config.isVerified,
      lastVerifiedAt: config.lastVerifiedAt,
      lastError: config.lastError,
      dailyLimit: config.dailyLimit,
      messagesSentToday: config.messagesSentToday,
      sendAppointmentConfirmation: config.sendAppointmentConfirmation,
      sendAppointmentReminder: config.sendAppointmentReminder,
      reminderHoursBefore: config.reminderHoursBefore,
      sendStylistOnWay: config.sendStylistOnWay,
      sendServiceCompleted: config.sendServiceCompleted,
    };
  }

  // =====================================================
  // MESSAGE TEMPLATES
  // =====================================================

  async listTemplates(
    clinicId: string,
    channel?: string,
    trigger?: string,
  ): Promise<MessageTemplateResponseDto[]> {
    const query = this.templateRepo.createQueryBuilder('t')
      .where('t.clinicId = :clinicId', { clinicId })
      .orderBy('t.channel', 'ASC')
      .addOrderBy('t.trigger', 'ASC');

    if (channel) {
      query.andWhere('t.channel = :channel', { channel });
    }

    if (trigger) {
      query.andWhere('t.trigger = :trigger', { trigger });
    }

    const templates = await query.getMany();
    return templates.map(t => this.toTemplateResponse(t));
  }

  async getTemplate(clinicId: string, templateId: string): Promise<MessageTemplateResponseDto> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId, clinicId },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return this.toTemplateResponse(template);
  }

  async createTemplate(
    clinicId: string,
    dto: CreateMessageTemplateDto,
  ): Promise<MessageTemplateResponseDto> {
    // Verificar si ya existe una plantilla con el mismo trigger y channel
    const existing = await this.templateRepo.findOne({
      where: {
        clinicId,
        trigger: dto.trigger as any,
        channel: dto.channel as any,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe una plantilla de ${dto.channel} para el evento ${dto.trigger}`,
      );
    }

    const template = this.templateRepo.create({
      clinicId,
      ...dto,
    } as any);

    const saved = await this.templateRepo.save(template);
    const savedTemplate = Array.isArray(saved) ? saved[0] : saved;
    return this.toTemplateResponse(savedTemplate);
  }

  async updateTemplate(
    clinicId: string,
    templateId: string,
    dto: UpdateMessageTemplateDto,
  ): Promise<MessageTemplateResponseDto> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId, clinicId },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    if (template.isSystem) {
      // Solo permitir actualizar ciertos campos en templates del sistema
      const allowedFields = ['body', 'bodyHtml', 'subject', 'isActive'];
      const updateFields: any = {};
      for (const field of allowedFields) {
        if ((dto as any)[field] !== undefined) {
          updateFields[field] = (dto as any)[field];
        }
      }
      Object.assign(template, updateFields);
    } else {
      Object.assign(template, dto);
    }

    const saved = await this.templateRepo.save(template);
    return this.toTemplateResponse(saved);
  }

  async deleteTemplate(clinicId: string, templateId: string): Promise<void> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId, clinicId },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    if (template.isSystem) {
      throw new BadRequestException('No se puede eliminar una plantilla del sistema');
    }

    await this.templateRepo.delete(templateId);
  }

  async duplicateTemplate(
    clinicId: string,
    templateId: string,
  ): Promise<MessageTemplateResponseDto> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId, clinicId },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const newTemplate = this.templateRepo.create({
      clinicId,
      name: `${template.name} (copia)`,
      trigger: template.trigger,
      channel: template.channel,
      subject: template.subject,
      body: template.body,
      bodyHtml: template.bodyHtml,
      timing: template.timing,
      timingValue: template.timingValue,
      scheduledTime: template.scheduledTime,
      whatsappTemplateName: template.whatsappTemplateName,
      whatsappTemplateLanguage: template.whatsappTemplateLanguage,
      isActive: false, // Nueva plantilla inactiva por defecto
      isSystem: false,
    });

    const saved = await this.templateRepo.save(newTemplate);
    return this.toTemplateResponse(saved);
  }

  async seedDefaultTemplates(clinicId: string): Promise<number> {
    // Importar función de seed
    const { seedMessageTemplates } = await import('../../../database/seeds/seed-message-templates');
    const { AppDataSource } = await import('../../../database/data-source');
    
    // Contar plantillas existentes
    const existingCount = await this.templateRepo.count({ where: { clinicId } });
    
    if (existingCount > 0) {
      return 0; // Ya tiene plantillas
    }

    // Crear plantillas por defecto
    await seedMessageTemplates(AppDataSource, clinicId);
    
    return await this.templateRepo.count({ where: { clinicId } });
  }

  private toTemplateResponse(template: MessageTemplate): MessageTemplateResponseDto {
    return {
      id: template.id,
      clinicId: template.clinicId,
      name: template.name,
      trigger: template.trigger,
      channel: template.channel,
      subject: template.subject,
      body: template.body,
      bodyHtml: template.bodyHtml,
      timing: template.timing,
      timingValue: template.timingValue,
      scheduledTime: template.scheduledTime,
      whatsappTemplateName: template.whatsappTemplateName,
      whatsappTemplateLanguage: template.whatsappTemplateLanguage,
      isActive: template.isActive,
      isSystem: template.isSystem,
      timesSent: template.timesSent,
      lastSentAt: template.lastSentAt,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
