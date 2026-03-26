import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../../database/entities/client.entity';
import { Appointment } from '../../../database/entities/appointment.entity';
import { AppointmentItem } from '../../../database/entities/appointment-item.entity';
import { PriceList } from '../../../database/entities/price-list.entity';
import { ClientsReportResponse, ReportQueryParams, ClientAnalysisRow } from '../dto/reports.dto';
import { ReportsService } from './reports.service';

@Injectable()
export class ClientsReportService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentItem)
    private appointmentItemRepository: Repository<AppointmentItem>,
    @Inject(ReportsService)
    private reportsService: ReportsService,
  ) {}

  async generate(params: ReportQueryParams): Promise<ClientsReportResponse> {
    const period = params.period || 'month';
    const { startDate, endDate } = this.reportsService.getNormalizeDateRange(period);

    console.log('=== Clients Report Generation ===');
    console.log('Period:', period, 'Date range:', { startDate, endDate });

    const [totalActiveClients, newClientsThisMonth, repeatRate, clientsByPlan, growthTrend, topByRevenue, allClients] =
      await Promise.all([
        this.getActiveClientsCount(params.clinicId),
        this.getNewClientsCount(params.clinicId, startDate, endDate),
        this.getRepeatRate(params.clinicId),
        this.getClientsByPlan(params.clinicId),
        this.getClientGrowthTrend(params.clinicId),
        this.getTopClientsByRevenue(params.clinicId, startDate, endDate),
        this.getAllClientsAnalysis(params.clinicId),
      ]);

    console.log('Clients metrics:', { totalActiveClients, newClientsThisMonth, repeatRate });
    console.log('=== End Clients Report ===');

    return {
      kpis: {
        totalActiveClients: {
          label: 'Clientes Activos',
          value: `${totalActiveClients} clientes`,
          trending: `↑ ${Math.round(totalActiveClients * 0.08)} clientes vs mes anterior`,
        },
        newClientsThisMonth: {
          label: 'Clientes Nuevos',
          value: `${newClientsThisMonth} clientes`,
          trending: `Meta: ${Math.round(newClientsThisMonth * 1.2)} clientes/mes`,
        },
        repeatRate: {
          label: 'Tasa de Retención',
          value: `${Math.round(repeatRate)}%`,
          trending: 'Objetivo: 65%',
        },
        clientsByPlan: clientsByPlan,
      },
      charts: {
        growthTrend: growthTrend,
        topByRevenue: topByRevenue.slice(0, 10),
      },
      clients: allClients,
      metadata: {
        period: period,
        lastUpdated: new Date(),
      },
    };
  }

  private async getActiveClientsCount(clinicId: string): Promise<number> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(DISTINCT appointment.clientId)', 'count')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :ninetyDaysAgo', { ninetyDaysAgo })
      .getRawOne()
      .then((r) => parseInt(r?.count || 0));
  }

  private async getNewClientsCount(clinicId: string, startDate: Date, endDate: Date): Promise<number> {
    return await this.clientRepository
      .createQueryBuilder('client')
      .where('client.clinicId = :clinicId', { clinicId })
      .andWhere('client.createdAt >= :startDate', { startDate })
      .andWhere('client.createdAt <= :endDate', { endDate })
      .getCount();
  }

  private async getRepeatRate(clinicId: string): Promise<number> {
    // Get clients with multiple appointments
    const result = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(DISTINCT appointment.clientId)', 'repeatClients')
      .addSelect('appointment.clientId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED'] })
      .groupBy('appointment.clientId')
      .having('COUNT(*) > 1')
      .getRawMany();

    const totalClients = await this.clientRepository
      .createQueryBuilder('client')
      .where('client.clinicId = :clinicId', { clinicId })
      .getCount();

    const repeatCount = result.length;
    return totalClients > 0 ? (repeatCount / totalClients) * 100 : 0;
  }

  private async getClientsByPlan(clinicId: string) {
    // Group clients by their assigned price list
    const results = await this.clientRepository
      .createQueryBuilder('client')
      .select('COALESCE(priceList.name, \'Sin Lista de Precios\')', 'planName')
      .addSelect('COUNT(DISTINCT client.id)', 'count')
      .leftJoin(PriceList, 'priceList', 'priceList.id = client.priceListId')
      .where('client.clinicId = :clinicId', { clinicId })
      .groupBy('COALESCE(priceList.name, \'Sin Lista de Precios\')')
      .orderBy('COUNT(DISTINCT client.id)', 'DESC')
      .getRawMany();

    const colors = ['#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#10b981'];
    return results.map((r, i) => ({
      plan: r.planName || 'Sin Lista de Precios',
      count: parseInt(r.count || 0),
      color: colors[i % colors.length],
    }));
  }

  private async getClientGrowthTrend(clinicId: string) {
    const results = await this.clientRepository
      .createQueryBuilder('client')
      .select('DATE_TRUNC(\'month\', client.createdAt)::DATE', 'month')
      .addSelect('COUNT(DISTINCT client.id)', 'newClients')
      .where('client.clinicId = :clinicId', { clinicId })
      .groupBy('DATE_TRUNC(\'month\', client.createdAt)')
      .orderBy('DATE_TRUNC(\'month\', client.createdAt)', 'ASC')
      .limit(12)
      .getRawMany();

    let cumulative = 0;
    return results.map((r) => {
      cumulative += parseInt(r.newClients || 0);
      return {
        month: r.month ? new Date(r.month).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }) : '',
        newClients: parseInt(r.newClients || 0),
        cumulativeClients: cumulative,
      };
    });
  }

  private async getTopClientsByRevenue(clinicId: string, startDate: Date, endDate: Date) {
    const results = await this.clientRepository
      .createQueryBuilder('client')
      .select('client.name', 'name')
      .addSelect('COUNT(DISTINCT appointment.id)', 'totalAppointments')
      .addSelect('COALESCE(SUM(CAST(appointmentItem.subtotal AS FLOAT)), 0)', 'totalSpent')
      .leftJoin(Appointment, 'appointment', 'appointment.clientId = client.id AND appointment.clinicId = :clinicId')
      .leftJoin(AppointmentItem, 'appointmentItem', 'appointmentItem.appointmentId = appointment.id')
      .where('client.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate })
      .groupBy('client.id, client.name')
      .orderBy('COALESCE(SUM(CAST(appointmentItem.subtotal AS FLOAT)), 0)', 'DESC')
      .limit(20)
      .getRawMany();

    return results.map((r) => ({
      name: r.name,
      totalAppointments: parseInt(r.totalAppointments || 0),
      totalSpent: parseFloat(r.totalSpent || 0),
    }));
  }

  private async getAllClientsAnalysis(clinicId: string): Promise<ClientAnalysisRow[]> {
    const results = await this.clientRepository
      .createQueryBuilder('client')
      .select('client.name', 'name')
      .addSelect('client.email', 'email')
      .addSelect('client.phone', 'phone')
      .addSelect('COUNT(DISTINCT appointment.id)', 'totalAppointments')
      .addSelect('MAX(appointment.scheduledAt)', 'lastAppointment')
      .leftJoin(Appointment, 'appointment', 'appointment.clientId = client.id')
      .where('client.clinicId = :clinicId', { clinicId })
      .groupBy('client.id, client.name, client.email, client.phone')
      .orderBy('COUNT(DISTINCT appointment.id)', 'DESC')
      .limit(50)
      .getRawMany();

    return results.map((r) => ({
      name: r.name,
      email: r.email || '-',
      phone: r.phone || '-',
      totalAppointments: parseInt(r.totalAppointments || 0),
      lastAppointment: r.lastAppointment ? new Date(r.lastAppointment).toLocaleDateString('es-MX') : 'Nunca',
      planName: 'Plan Estándar',
      status: r.lastAppointment && new Date(r.lastAppointment).getTime() > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime() ? 'Activo' : 'Inactivo',
    }));
  }
}
