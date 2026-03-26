import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { ClinicWhatsAppConfigEntity } from './entities/clinic-whatsapp-config.entity';
import { WhatsAppConfigEntity } from './entities/whatsapp-config.entity';
import { WhatsAppMonthlyBillingEntity } from './entities/whatsapp-monthly-billing.entity';

@Injectable()
export class WhatsAppConfigService {
  private readonly CACHE_TTL = 3600; // 1 hora

  constructor(
    @InjectRepository(WhatsAppConfigEntity)
    private whatsappConfigRepo: Repository<WhatsAppConfigEntity>,

    @InjectRepository(ClinicWhatsAppConfigEntity)
    private clinicWhatsappConfigRepo: Repository<ClinicWhatsAppConfigEntity>,

    @InjectRepository(WhatsAppMonthlyBillingEntity)
    private billingRepo: Repository<WhatsAppMonthlyBillingEntity>,

    private configService: ConfigService,
    private cacheService: CacheService,
    private dataSource: DataSource,
  ) {}

  /**
   * 📱 Obtener configuración global de Twilio
   */
  async getGlobalConfig(): Promise<WhatsAppConfigEntity> {
    const cacheKey = 'whatsapp:global-config';
    let config = await this.cacheService.get<WhatsAppConfigEntity>(cacheKey);

    if (!config) {
      config = await this.whatsappConfigRepo.findOne({
        where: { is_active: true },
      });

      if (!config) {
        throw new NotFoundException('WhatsApp global configuration not found');
      }

      await this.cacheService.set(cacheKey, config, this.CACHE_TTL);
    }

    return config;
  }

  /**
   * 🏥 Obtener configuración por clínica
   */
  async getClinicConfig(clinicId: string): Promise<ClinicWhatsAppConfigEntity> {
    const cacheKey = `whatsapp:clinic:${clinicId}`;
    let config = await this.cacheService.get<ClinicWhatsAppConfigEntity>(
      cacheKey,
    );

    if (!config) {
      config = await this.clinicWhatsappConfigRepo.findOne({
        where: { clinic_id: clinicId },
        relations: ['whatsapp_config'],
      });

      if (!config) {
        throw new NotFoundException(
          `WhatsApp config not found for clinic ${clinicId}`,
        );
      }

      await this.cacheService.set(cacheKey, config, this.CACHE_TTL);
    }

    return config;
  }

  /**
   * ✅ Verificar si clínica CAN enviar mensajes
   * Returns: { can_send: boolean, reason: string, messages_remaining: number }
   */
  async canSendMessage(
    clinicId: string,
  ): Promise<{
    can_send: boolean;
    reason?: string;
    messages_remaining?: number;
  }> {
    try {
      const config = await this.getClinicConfig(clinicId);

      // 🔴 Clínica disabled
      if (!config.is_active) {
        return { can_send: false, reason: 'Clinic WhatsApp is disabled' };
      }

      // 🔴 Verficar límite mensual
      const messagesRemaining =
        config.monthly_message_limit - config.monthly_messages_used;

      if (messagesRemaining <= 0 && !config.allows_overage) {
        return {
          can_send: false,
          reason: 'Monthly message limit reached',
          messages_remaining: 0,
        };
      }

      // 🟡 Alerta si está cerca del límite
      const usagePercent =
        (config.monthly_messages_used / config.monthly_message_limit) * 100;

      if (
        usagePercent >= config.alert_threshold_percentage &&
        !config.is_alert_sent
      ) {
        console.warn(
          `[WhatsApp] Clinic ${clinicId} reached ${usagePercent}% of monthly limit`,
        );
        // TODO: Enviar notificación a clínica
      }

      // ✅ Pode enviar
      return {
        can_send: true,
        messages_remaining: Math.max(messagesRemaining, 0),
      };
    } catch (error) {
      console.error('Error validating message limit:', error);
      return {
        can_send: false,
        reason: `Configuration error: ${error.message}`,
      };
    }
  }

  /**
   * 📊 Incrementar contador de mensajes usados
   */
  async incrementMessageUsage(
    clinicId: string,
    count: number = 1,
  ): Promise<ClinicWhatsAppConfigEntity> {
    const clinic = await this.getClinicConfig(clinicId);

    clinic.monthly_messages_used += count;
    clinic.updated_at = new Date();

    const updated = await this.clinicWhatsappConfigRepo.save(clinic);

    // 🔄 Invalidar cache
    await this.cacheService.delete(`whatsapp:clinic:${clinicId}`);

    return updated;
  }

  /**
   * 🔄 Reset mensajería: 1ro de cada mes
   */
  async resetMonthlyUsage(clinicId: string): Promise<void> {
    const clinic = await this.getClinicConfig(clinicId);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    clinic.monthly_messages_used = 0;
    clinic.monthly_reset_date = firstOfMonth;
    clinic.is_alert_sent = false;
    clinic.updated_at = new Date();

    await this.clinicWhatsappConfigRepo.save(clinic);

    // 🔄 Invalidar cache
    await this.cacheService.delete(`whatsapp:clinic:${clinicId}`);

    console.log(`✅ Reset monthly usage for clinic ${clinicId}`);
  }

  /**
   * 📝 Crear registro de facturación mensual
   */
  async createMonthlyBilling(clinicId: string): Promise<WhatsAppMonthlyBillingEntity> {
    const clinic = await this.getClinicConfig(clinicId);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const billing = this.billingRepo.create({
      clinic_id: clinicId,
      billing_year: year,
      billing_month: month,
      message_limit: clinic.monthly_message_limit,
      messages_sent: clinic.monthly_messages_used,
      messages_overage: Math.max(
        clinic.monthly_messages_used - clinic.monthly_message_limit,
        0,
      ),
      base_price: this.getPriceByTier(clinic.subscription_tier),
      overage_cost:
        Math.max(
          clinic.monthly_messages_used - clinic.monthly_message_limit,
          0,
        ) * clinic.overage_cost_per_message,
      status: 'pending',
    });

    // Calcular total
    billing.total_cost = billing.base_price + billing.overage_cost;

    return this.billingRepo.save(billing);
  }

  /**
   * 💰 Obtener precio base según plan
   */
  private getPriceByTier(tier: string): number {
    const prices = {
      free: 0,
      basic: 5.0,
      pro: 15.0,
      enterprise: 50.0,
    };
    return prices[tier] || 5.0;
  }

  /**
   * 📋 Obtener uso actual del mes
   */
  async getCurrentMonthUsage(clinicId: string): Promise<{
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  }> {
    const clinic = await this.getClinicConfig(clinicId);

    const used = clinic.monthly_messages_used;
    const limit = clinic.monthly_message_limit;
    const remaining = Math.max(limit - used, 0);
    const percentage = (used / limit) * 100;

    return { used, limit, remaining, percentage };
  }

  /**
   * 🔧 Actualizar configuración de clínica
   */
  async updateClinicConfig(
    clinicId: string,
    updates: Partial<ClinicWhatsAppConfigEntity>,
  ): Promise<ClinicWhatsAppConfigEntity> {
    const clinic = await this.getClinicConfig(clinicId);

    Object.assign(clinic, updates);
    clinic.updated_at = new Date();

    const updated = await this.clinicWhatsappConfigRepo.save(clinic);

    // 🔄 Invalidar cache
    await this.cacheService.delete(`whatsapp:clinic:${clinicId}`);

    return updated;
  }

  /**
   * 🧪 Validar credenciales Twilio (ping)
   */
  async validateTwilioCredentials(): Promise<boolean> {
    try {
      const config = await this.getGlobalConfig();

      // TODO: Implementar ping a Twilio API
      // Por ahora solo validamos que existan credenciales
      if (!config.account_sid || !config.auth_token) {
        throw new BadRequestException('Twilio credentials incomplete');
      }

      config.is_verified = true;
      config.last_verified_at = new Date();
      await this.whatsappConfigRepo.save(config);

      // 🔄 Invalidar cache
      await this.cacheService.delete('whatsapp:global-config');

      return true;
    } catch (error) {
      console.error('Twilio verification failed:', error);
      return false;
    }
  }

  /**
   * 📊 Estadísticas mensuales (admin view)
   */
  async getMonthlyStatistics(): Promise<
    Array<{
      clinic_id: string;
      clinic_name: string;
      messages_sent: number;
      messages_overage: number;
      total_cost: number;
    }>
  > {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return this.dataSource.query(
      `
      SELECT 
        cwc.clinic_id,
        c.name AS clinic_name,
        cwc.monthly_messages_used AS messages_sent,
        COALESCE(wmb.messages_overage, 0) AS messages_overage,
        COALESCE(wmb.total_cost, 0) AS total_cost
      FROM clinic_whatsapp_config cwc
      LEFT JOIN clinics c ON cwc.clinic_id = c.id
      LEFT JOIN whatsapp_monthly_billing wmb 
        ON cwc.clinic_id = wmb.clinic_id 
        AND wmb.billing_year = $1 
        AND wmb.billing_month = $2
      ORDER BY messages_sent DESC;
    `,
      [year, month],
    );
  }

  /**
   * 🔍 Debug mode: listar todas las clínicas con config active
   */
  async listActiveClinicConfigs() {
    return this.clinicWhatsappConfigRepo.find({
      where: { is_active: true },
      relations: ['whatsapp_config'],
      order: { created_at: 'DESC' },
    });
  }
}
