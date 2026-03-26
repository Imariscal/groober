import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  WhatsAppMonthlyBillingEntity,
  WhatsAppMessageRechargesEntity,
  WhatsAppMessageUsageEntity,
  ClinicWhatsAppConfigEntity,
} from '../entities';

@Injectable()
export class WhatsAppBillingService {
  private readonly logger = new Logger(WhatsAppBillingService.name);

  constructor(
    @InjectRepository(WhatsAppMonthlyBillingEntity)
    private billingRepo: Repository<WhatsAppMonthlyBillingEntity>,

    @InjectRepository(WhatsAppMessageRechargesEntity)
    private rechargeRepo: Repository<WhatsAppMessageRechargesEntity>,

    @InjectRepository(WhatsAppMessageUsageEntity)
    private messageUsageRepo: Repository<WhatsAppMessageUsageEntity>,

    @InjectRepository(ClinicWhatsAppConfigEntity)
    private clinicConfigRepo: Repository<ClinicWhatsAppConfigEntity>,

    private dataSource: DataSource,
  ) {}

  /**
   * 📊 Calcular uso mensual y generar billing record
   * (Ejecutar 1ro de mes a las 12:00 UTC)
   */
  async calculateMonthlyUsage(
    year: number,
    month: number,
  ): Promise<{
    clinicsProcessed: number;
    totalCost: number;
    records: WhatsAppMonthlyBillingEntity[];
  }> {
    const records: WhatsAppMonthlyBillingEntity[] = [];
    let totalCost = 0;

    // Obtener todas las clínicas activas
    const clinics = await this.clinicConfigRepo.find({
      where: { is_active: true },
    });

    for (const clinic of clinics) {
      // Calcular fechas para el mes
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      // Contar mensajes enviados en el período (solo outbound billables)
      const messageCount = await this.messageUsageRepo.count({
        where: [
          {
            clinic_id: clinic.clinic_id,
            direction: 'outbound',
            is_billable: true,
            sent_at: { gte: startDate, lt: endDate },
          },
        ],
      });

      // Crear billing record
      const billing = this.billingRepo.create({
        clinic_id: clinic.clinic_id,
        billing_year: year,
        billing_month: month,
        message_limit: clinic.monthly_message_limit,
        messages_sent: messageCount,
        messages_overage: Math.max(
          messageCount - clinic.monthly_message_limit,
          0,
        ),
        base_price: this.getPriceByTier(clinic.subscription_tier),
        overage_cost:
          Math.max(messageCount - clinic.monthly_message_limit, 0) *
          clinic.overage_cost_per_message,
        status: 'pending',
        invoice_date: new Date(),
      });

      billing.total_cost =
        (billing.base_price || 0) + (billing.overage_cost || 0);

      const saved = await this.billingRepo.save(billing);
      records.push(saved);
      totalCost += billing.total_cost || 0;

      this.logger.log(
        `📊 Billing calculated for clinic ${clinic.clinic_id}: ` +
        `${messageCount} messages, $${billing.total_cost}`,
      );
    }

    this.logger.log(
      `✅ Monthly usage calculated for ${records.length} clinics. Total: $${totalCost}`,
    );

    return {
      clinicsProcessed: records.length,
      totalCost,
      records,
    };
  }

  /**
   * 💰 Obtener precio base según plan
   */
  private getPriceByTier(tier: string): number {
    const prices: Record<string, number> = {
      free: 0,
      basic: 5.0,
      pro: 15.0,
      enterprise: 50.0,
    };
    return prices[tier] || 5.0;
  }

  /**
   * 📋 Obtener historial de billing de una clínica
   */
  async getClinicBillingHistory(
    clinicId: string,
    months: number = 12,
  ): Promise<WhatsAppMonthlyBillingEntity[]> {
    const records = await this.billingRepo
      .createQueryBuilder('billing')
      .where('billing.clinic_id = :clinicId', { clinicId })
      .orderBy('billing.billing_year', 'DESC')
      .addOrderBy('billing.billing_month', 'DESC')
      .take(months)
      .getMany();

    return records;
  }

  /**
   * ⚡ Aplicar recharge de mensajes (overage)
   *
   * Plans:
   * - 100 msgs = $5
   * - 500 msgs = $20 (5% discount)
   * - 1000 msgs = $35 (10% discount)
   * - 5000 msgs = $150 (15% discount)
   */
  async processRecharge(
    clinicId: string,
    quantity: number,
  ): Promise<{
    success: boolean;
    recharge?: WhatsAppMessageRechargesEntity;
    error?: string;
  }> {
    try {
      // Validar cantidad
      const validQuantities = [100, 500, 1000, 5000];
      if (!validQuantities.includes(quantity)) {
        return {
          success: false,
          error: `Invalid quantity. Choose from: ${validQuantities.join(', ')}`,
        };
      }

      const unitPrice = this.calculateRechargePrice(quantity);

      // Crear recharge
      const recharge = this.rechargeRepo.create({
        clinic_id: clinicId,
        quantity,
        unit_price: unitPrice,
        total_amount: unitPrice * quantity,
        status: 'pending',
      });

      const saved = await this.rechargeRepo.save(recharge);

      this.logger.log(
        `⚡ Recharge created for clinic ${clinicId}: ${quantity} msgs for $${saved.total_amount}`,
      );

      return { success: true, recharge: saved };
    } catch (error) {
      this.logger.error(`Failed to process recharge:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 💳 Calcular precio de recharge (con descuentos)
   */
  private calculateRechargePrice(quantity: number): number {
    const pricing: Record<number, number> = {
      100: 0.05, // $0.05 por msg
      500: 0.04, // $0.04 por msg (20% discount)
      1000: 0.035, // $0.035 por msg (30% discount)
      5000: 0.03, // $0.03 por msg (40% discount)
    };

    return pricing[quantity] || 0.05;
  }

  /**
   * ✅ Completar recharge (después de pago)
   */
  async completeRecharge(
    rechargeId: string,
    transactionId: string,
  ): Promise<WhatsAppMessageRechargesEntity> {
    const recharge = await this.rechargeRepo.findOne({
      where: { id: rechargeId },
    });

    if (!recharge) {
      throw new Error(`Recharge ${rechargeId} not found`);
    }

    recharge.status = 'completed';
    recharge.transaction_id = transactionId;
    recharge.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 año

    const updated = await this.rechargeRepo.save(recharge);

    // Incrementar límite de la clínica
    const clinic = await this.clinicConfigRepo.findOne({
      where: { clinic_id: recharge.clinic_id },
    });

    if (clinic) {
      clinic.total_overage_messages += recharge.quantity;
      clinic.updated_at = new Date();
      await this.clinicConfigRepo.save(clinic);

      this.logger.log(
        `✅ Recharge ${rechargeId} completed. Clinic now has +${recharge.quantity} messages`,
      );
    }

    return updated;
  }

  /**
   * 📊 Estadísticas de facturación global (solo admin)
   */
  async getGlobalBillingStats(year: number, month: number): Promise<any> {
    const records = await this.billingRepo.find({
      where: { billing_year: year, billing_month: month },
    });

    const stats = {
      total_clinics: records.length,
      total_revenue: records.reduce((sum, r) => sum + (r.total_cost || 0), 0),
      total_messages: records.reduce((sum, r) => sum + r.messages_sent, 0),
      total_overage: records.reduce((sum, r) => sum + r.messages_overage, 0),
      pending_invoices: records.filter(r => r.status === 'pending').length,
      paid_invoices: records.filter(r => r.status === 'paid').length,
    };

    return stats;
  }

  /**
   * 🧮 Simulador de costo (antes de recharge)
   */
  async simulateCost(quantity: number): Promise<{
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    expiresAt: Date;
  }> {
    const unitPrice = this.calculateRechargePrice(quantity);

    return {
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * 🔍 Query: Clínicas cercanas a límite
   */
  async getClinicsNearLimit(): Promise<
    Array<{
      clinic_id: string;
      usage_percent: number;
      messages_used: number;
      messages_limit: number;
    }>
  > {
    return this.dataSource.query(
      `
      SELECT 
        clinic_id,
        ROUND((monthly_messages_used::float / monthly_message_limit::float) * 100, 2) AS usage_percent,
        monthly_messages_used AS messages_used,
        monthly_message_limit AS messages_limit
      FROM clinic_whatsapp_config
      WHERE is_active = true 
        AND allows_overage = false
        AND (monthly_messages_used::float / monthly_message_limit::float) > 0.80
      ORDER BY usage_percent DESC;
    `,
    );
  }
}
