import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { Appointment } from '../../../database/entities/appointment.entity';
import { AppointmentItem } from '../../../database/entities/appointment-item.entity';
import { PerformanceReportResponse, ReportQueryParams } from '../dto/reports.dto';
import { ReportsService } from './reports.service';

interface StylistRow {
  id: string;
  name: string;
  totalAppointments: number;
  confirmedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  avgRating: number;
}

interface UtilizationRow {
  name: string;
  utilizationPercentage: number;
}

@Injectable()
export class PerformanceReportService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentItem)
    private appointmentItemRepository: Repository<AppointmentItem>,
    @Inject(ReportsService)
    private reportsService: ReportsService,
  ) {}

  async generate(params: ReportQueryParams): Promise<PerformanceReportResponse> {
    const period = params.period || 'month';
    const { startDate, endDate } = this.reportsService.getNormalizeDateRange(period);
    const clinicId = params.clinicId;

    console.log('=== Performance Report Generation ===');
    console.log('Period:', period, 'Date range:', { startDate, endDate });

    try {
      const [
        activeStylistsCount,
        avgAppointmentsPerWeek,
        occupancyRate,
        revenuePerStylist,
        utilizationData,
        revenueComparisonData,
        stylistsData,
      ] = await Promise.all([
        this.getActiveStylistsCount(clinicId, startDate, endDate),
        this.getAvgAppointmentsPerWeek(clinicId, startDate, endDate),
        this.getOccupancyRate(clinicId, startDate, endDate),
        this.getRevenuePerStylist(clinicId, startDate, endDate),
        this.getUtilizationByDay(clinicId, startDate, endDate),
        this.getRevenueComparison(clinicId, startDate, endDate),
        this.getAllStylistsAnalysis(clinicId, startDate, endDate),
      ]);

      return {
        kpis: {
          activeStylistsCount: {
            label: 'Estilistas Activos',
            value: activeStylistsCount > 0 ? `${activeStylistsCount} estilistas` : '0 estilistas',
            trending: 'Periodo actual',
          },
          avgAppointmentsPerWeek: {
            label: 'Citas promedio/semana',
            value: `${Math.round(avgAppointmentsPerWeek)} citas`,
            trending: 'Por estilista',
          },
          occupancyRate: {
            label: 'Tasa de ocupación',
            value: `${Math.round(occupancyRate)}%`,
            trending: 'Uso de capacidad',
          },
          revenuePerStylist: {
            label: 'Ingresos/estilista/semana',
            value: `$${revenuePerStylist.toLocaleString('es-MX', { maximumFractionDigits: 0 })} MXN`,
            trending: 'Promedio semanal',
          },
        },
        charts: {
          utilization: utilizationData,
          revenueComparison: revenueComparisonData,
        },
        stylists: stylistsData,
        metadata: {
          period: period,
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  private async getActiveStylistsCount(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(DISTINCT appointment.assignedStaffUserId)', 'count')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .getRawOne();

    return parseInt(result?.count || 0, 10);
  }

  private async getAvgAppointmentsPerWeek(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(appointment.id)', 'totalAppointments')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .getRawOne();

    const totalAppointments = parseInt(result?.totalAppointments || 0, 10);
    const activeStylistsCount = await this.getActiveStylistsCount(clinicId, startDate, endDate);

    if (activeStylistsCount === 0) return 0;

    // Calculate number of weeks
    const weeks = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)));

    return totalAppointments / activeStylistsCount / weeks;
  }

  private async getOccupancyRate(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    // Get total appointment slots in the period
    const appointmentCount = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(appointment.id)', 'count')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .getRawOne();

    const totalAppointments = parseInt(appointmentCount?.count || 0, 10);

    // Estimate total available slots: assume 10 slots per stylist per day, 6 days a week
    const activeStylistsCount = await this.getActiveStylistsCount(clinicId, startDate, endDate);
    if (activeStylistsCount === 0) return 0;

    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000));
    const weeks = Math.ceil(days / 7);
    const availableSlots = activeStylistsCount * 10 * weeks * 6; // 10 slots per stylist per day, 6 days per week

    return Math.round((totalAppointments / availableSlots) * 100);
  }

  private async getRevenuePerStylist(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.appointmentItemRepository
      .createQueryBuilder('item')
      .select('COALESCE(SUM(CAST(item.subtotal AS FLOAT)), 0)', 'totalRevenue')
      .leftJoin(Appointment, 'appointment', 'appointment.id = item.appointmentId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .getRawOne();

    const totalRevenue = parseFloat(result?.totalRevenue || 0);
    const activeStylistsCount = await this.getActiveStylistsCount(clinicId, startDate, endDate);

    if (activeStylistsCount === 0) return 0;

    // Calculate weeks
    const weeks = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)));

    return totalRevenue / activeStylistsCount / weeks;
  }

  private async getUtilizationByDay(clinicId: string, startDate: Date, endDate: Date): Promise<UtilizationRow[]> {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('EXTRACT(DOW FROM appointment.scheduled_at)::int', 'dayOfWeek')
      .addSelect('COUNT(appointment.id)', 'appointmentCount')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .groupBy('EXTRACT(DOW FROM appointment.scheduled_at)::int')
      .orderBy('EXTRACT(DOW FROM appointment.scheduled_at)::int', 'ASC')
      .getRawMany();

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const activeStylistsCount = await this.getActiveStylistsCount(clinicId, startDate, endDate);

    // Assume each stylist can do 10 appointments per day
    const maxAppointmentsPerDay = activeStylistsCount * 10;

    return result.map((r) => {
      const dayIndex = parseInt(r.dayOfWeek, 10);
      const appointmentCount = parseInt(r.appointmentCount, 10);
      const utilizationPercentage = maxAppointmentsPerDay > 0 ? Math.round((appointmentCount / maxAppointmentsPerDay) * 100) : 0;

      return {
        name: dayNames[dayIndex],
        utilizationPercentage: Math.min(utilizationPercentage, 100),
      };
    });
  }

  private async getRevenueComparison(clinicId: string, startDate: Date, endDate: Date): Promise<Array<any>> {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('user.id', 'id')
      .addSelect('user.name', 'name')
      .addSelect('COALESCE(SUM(CAST(item.subtotal AS FLOAT)), 0)', 'revenue')
      .leftJoin(User, 'user', 'user.id = appointment.assignedStaffUserId')
      .leftJoin(AppointmentItem, 'item', 'item.appointmentId = appointment.id')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .andWhere('appointment.assignedStaffUserId IS NOT NULL')
      .groupBy('user.id, user.name')
      .orderBy('COALESCE(SUM(CAST(item.subtotal AS FLOAT)), 0)', 'DESC')
      .limit(10)
      .getRawMany();

    // Target is average revenue per stylist
    const avgRevenue = result.length > 0 ? result.reduce((acc, r) => acc + parseFloat(r.revenue || 0), 0) / result.length : 0;

    return result.map((r) => ({
      name: r.name || 'Sin nombre',
      current: Math.round(parseFloat(r.revenue || 0)),
      target: Math.round(avgRevenue),
    }));
  }

  private async getAllStylistsAnalysis(clinicId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('user.id', 'id')
      .addSelect('user.name', 'name')
      .addSelect("COUNT(CASE WHEN appointment.status = 'CONFIRMED' THEN 1 END)", 'confirmedCount')
      .addSelect("COUNT(CASE WHEN appointment.status = 'CANCELLED' THEN 1 END)", 'cancelledCount')
      .addSelect('COUNT(appointment.id)', 'totalAppointments')
      .addSelect('COALESCE(SUM(CAST(item.subtotal AS FLOAT)), 0)', 'totalRevenue')
      .leftJoin(User, 'user', 'user.id = appointment.assignedStaffUserId')
      .leftJoin(AppointmentItem, 'item', 'item.appointmentId = appointment.id')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .andWhere('appointment.assignedStaffUserId IS NOT NULL')
      .groupBy('user.id, user.name')
      .orderBy('COUNT(appointment.id)', 'DESC')
      .limit(50)
      .getRawMany();

    return result.map((r) => ({
      name: r.name || 'Sin nombre',
      totalAppointments: parseInt(r.totalAppointments, 10),
      confirmedCount: parseInt(r.confirmedCount, 10),
      cancelledCount: parseInt(r.cancelledCount, 10),
      rating: '4.5', // Default rating - no feedback table available
      weeklyRevenue: Math.round(parseFloat(r.totalRevenue || 0)).toString(),
    }));
  }
}
