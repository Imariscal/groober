import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from '../../database/entities';
import { SubscriptionPlan } from '../../database/entities/subscription-plan.entity';

@Injectable()
export class PlatformReportsService {
  constructor(
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
  ) {}

  /**
   * Get platform reports data:
   * - KPI metrics (total clinics, new this month, growth rate, retention)
   * - Clinics created per month (last 6 months)
   * - Revenue estimates per month based on plan prices
   * - Summary by subscription plan
   */
  async getReports(period: string = 'month') {
    const now = new Date();

    // ---- KPI Metrics ----
    const totalClinics = await this.clinicRepository
      .createQueryBuilder('clinic')
      .where('clinic.status IN (:...statuses)', { statuses: ['ACTIVE', 'SUSPENDED'] })
      .getCount();

    const activeClinics = await this.clinicRepository.count({
      where: { status: 'ACTIVE' },
    });

    const suspendedClinics = await this.clinicRepository.count({
      where: { status: 'SUSPENDED' },
    });

    // New clinics this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = await this.clinicRepository
      .createQueryBuilder('clinic')
      .where('clinic.createdAt >= :start', { start: startOfMonth })
      .andWhere('clinic.status IN (:...statuses)', { statuses: ['ACTIVE', 'SUSPENDED'] })
      .getCount();

    // New clinics last month (for growth rate calculation)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const newLastMonth = await this.clinicRepository
      .createQueryBuilder('clinic')
      .where('clinic.createdAt >= :start AND clinic.createdAt <= :end', {
        start: startOfLastMonth,
        end: endOfLastMonth,
      })
      .andWhere('clinic.status IN (:...statuses)', { statuses: ['ACTIVE', 'SUSPENDED'] })
      .getCount();

    // Growth rate: percentage change from last month
    const growthRate = newLastMonth > 0
      ? ((newThisMonth - newLastMonth) / newLastMonth) * 100
      : newThisMonth > 0 ? 100 : 0;

    // Retention: active / total (non-deleted)
    const retentionRate = totalClinics > 0
      ? Math.round((activeClinics / totalClinics) * 100)
      : 0;

    // ---- Monthly Chart Data (last 6 months) ----
    const monthlyData = await this.getMonthlyData(6);

    // ---- Summary by Plan ----
    const planSummary = await this.getPlanSummary();

    // ---- Statistics ----
    const sumActiveStaff = await this.clinicRepository
      .createQueryBuilder('clinic')
      .select('COALESCE(SUM(clinic.active_staff_count), 0)', 'total')
      .getRawOne();

    const sumActiveClients = await this.clinicRepository
      .createQueryBuilder('clinic')
      .select('COALESCE(SUM(clinic.active_clients_count), 0)', 'total')
      .getRawOne();

    const sumActivePets = await this.clinicRepository
      .createQueryBuilder('clinic')
      .select('COALESCE(SUM(clinic.active_pets_count), 0)', 'total')
      .getRawOne();

    return {
      timestamp: new Date().toISOString(),
      period,
      metrics: {
        total_clinics: totalClinics,
        active_clinics: activeClinics,
        suspended_clinics: suspendedClinics,
        new_this_month: newThisMonth,
        growth_rate: parseFloat(growthRate.toFixed(1)),
        retention_rate: retentionRate,
        total_staff: parseInt(sumActiveStaff?.total || '0'),
        total_clients: parseInt(sumActiveClients?.total || '0'),
        total_pets: parseInt(sumActivePets?.total || '0'),
      },
      monthly_data: monthlyData,
      plan_summary: planSummary,
    };
  }

  /**
   * Get clinics created per month with estimated revenue
   */
  private async getMonthlyData(months: number) {
    const now = new Date();
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const result: { month: string; month_year: string; clinics: number; revenue: number }[] = [];

    // Get all active plans for price lookup
    const plans = await this.planRepository.find();
    const planPrices: Record<string, number> = {};
    plans.forEach(p => {
      planPrices[p.code] = Number(p.price) || 0;
    });

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const clinicsCreated = await this.clinicRepository
        .createQueryBuilder('clinic')
        .where('clinic.createdAt >= :start AND clinic.createdAt <= :end', {
          start: startOfMonth,
          end: endOfMonth,
        })
        .andWhere('clinic.status IN (:...statuses)', { statuses: ['ACTIVE', 'SUSPENDED'] })
        .getCount();

      // Estimate revenue: count active clinics by plan at end of that month, multiply by plan price
      const clinicsByPlan = await this.clinicRepository
        .createQueryBuilder('clinic')
        .select('clinic.subscription_plan', 'plan')
        .addSelect('COUNT(*)', 'count')
        .where('clinic.createdAt <= :end', { end: endOfMonth })
        .andWhere('clinic.status IN (:...statuses)', { statuses: ['ACTIVE', 'SUSPENDED'] })
        .groupBy('clinic.subscription_plan')
        .getRawMany();

      let monthRevenue = 0;
      clinicsByPlan.forEach(row => {
        const price = planPrices[row.plan] || 0;
        monthRevenue += price * parseInt(row.count);
      });

      result.push({
        month: monthNames[date.getMonth()],
        month_year: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        clinics: clinicsCreated,
        revenue: Math.round(monthRevenue),
      });
    }

    return result;
  }

  /**
   * Get clinic counts and revenue grouped by subscription plan
   */
  private async getPlanSummary() {
    const plans = await this.planRepository.find({ order: { sortOrder: 'ASC' } });

    const summary: {
      plan_name: string;
      plan_code: string;
      clinics: number;
      revenue: number;
      avg_per_clinic: number;
      price: number;
    }[] = [];

    let totalClinicsInPlans = 0;

    for (const plan of plans) {
      const count = await this.clinicRepository
        .createQueryBuilder('clinic')
        .where('clinic.subscription_plan = :code', { code: plan.code })
        .andWhere('clinic.status IN (:...statuses)', { statuses: ['ACTIVE', 'SUSPENDED'] })
        .getCount();

      const price = Number(plan.price) || 0;
      const revenue = count * price;

      summary.push({
        plan_name: plan.name,
        plan_code: plan.code,
        clinics: count,
        revenue: Math.round(revenue),
        avg_per_clinic: Math.round(price),
        price,
      });

      totalClinicsInPlans += count;
    }

    // Add percentage
    return summary.map(s => ({
      ...s,
      percentage: totalClinicsInPlans > 0
        ? Math.round((s.clinics / totalClinicsInPlans) * 100)
        : 0,
    }));
  }
}
