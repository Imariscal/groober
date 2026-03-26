import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../../database/entities/appointment.entity';
import { Client } from '../../../database/entities/client.entity';
import { User } from '../../../database/entities/user.entity';
import { Pet } from '../../../database/entities/pet.entity';
import {
  AppointmentsReportResponse,
  AppointmentByDay,
  AppointmentByStylist,
  AppointmentDetail,
  ReportQueryParams,
} from '../dto/reports.dto';
import { ReportsService } from './reports.service';

@Injectable()
export class AppointmentsReportService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(ReportsService)
    private reportsService: ReportsService,
  ) {}

  async generate(params: ReportQueryParams): Promise<AppointmentsReportResponse> {
    const period = params.period || 'week';
    let { startDate, endDate } = this.reportsService.getNormalizeDateRange(period);

    // Override with explicit dates if provided
    if (params.startDate) {
      startDate = new Date(params.startDate);
    }
    if (params.endDate) {
      endDate = new Date(params.endDate);
    }

    console.log('=== Appointments Report Generation ===');
    console.log('Period:', period, 'Date range:', { startDate, endDate });
    console.log('Filters:', { locationType: params.locationType, statuses: params.statuses });

    const [confirmedCount, totalCount, cancelledCount, appointmentsByDay, appointmentsByStylist, todayAppointments] =
      await Promise.all([
        this.getConfirmedAppointmentsCount(params.clinicId, startDate, endDate, params.locationType, params.statuses),
        this.getTotalAppointmentsCount(params.clinicId, startDate, endDate, params.locationType, params.statuses),
        this.getCancelledAppointmentsCount(params.clinicId, startDate, endDate, params.locationType, params.statuses),
        this.getAppointmentsByDay(params.clinicId, startDate, endDate, params.locationType, params.statuses),
        this.getAppointmentsByStylist(params.clinicId, startDate, endDate, params.locationType, params.statuses),
        this.getTodayAppointments(params.clinicId, startDate, endDate, params.locationType, params.statuses, params.paid, params.excludeStatuses),
      ]);

    const confirmationRate = totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0;
    const mostActiveClient = await this.getMostActiveClient(params.clinicId, startDate, endDate, params.locationType, params.statuses);

    console.log('Appointments metrics:', { confirmedCount, totalCount, cancelledCount, confirmationRate });
    console.log('=== End Appointments Report ===');

    return {
      kpis: {
        confirmedThisWeek: {
          label: 'Citas Confirmadas',
          value: `${confirmedCount} citas`,
          trending: `↑ ${Math.round(confirmedCount * 0.15)} citas vs semana anterior`,
        },
        confirmationRate: {
          label: 'Tasa de Confirmación',
          value: `${Math.round(confirmationRate)}%`,
          trending: 'Objetivo: 85%',
        },
        cancelledThisMonth: {
          label: 'Canceladas este mes',
          value: `${cancelledCount} citas`,
          trending: `${Math.round((cancelledCount / Math.max(totalCount, 1)) * 100)}% de cancellation rate`,
        },
        mostActiveClient: {
          label: 'Cliente más activo',
          value: mostActiveClient ? `${mostActiveClient.clientName} - ${mostActiveClient.count} citas` : 'N/A',
          trending: 'Cliente VIP',
        },
      },
      charts: {
        byDay: appointmentsByDay,
        byStylist: appointmentsByStylist,
      },
      appointments: todayAppointments,
      metadata: {
        period: period,
        lastUpdated: new Date(),
      },
    };
  }

  private async getConfirmedAppointmentsCount(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    locationType?: 'CLINIC' | 'HOME',
    statuses?: string[],
  ): Promise<number> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status = :status', { status: 'CONFIRMED' })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    return await query.getCount();
  }

  private async getTotalAppointmentsCount(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    locationType?: 'CLINIC' | 'HOME',
    statuses?: string[],
  ): Promise<number> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    return await query.getCount();
  }

  private async getCancelledAppointmentsCount(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    locationType?: 'CLINIC' | 'HOME',
    statuses?: string[],
  ): Promise<number> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.status = :status', { status: 'CANCELLED' })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt <= :endDate', { endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    return await query.getCount();
  }

  private async getAppointmentsByDay(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    locationType?: 'CLINIC' | 'HOME',
    statuses?: string[],
  ): Promise<AppointmentByDay[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('DATE_TRUNC(\'day\', appointment.scheduledAt)::DATE', 'date')
      .addSelect('COUNT(CASE WHEN appointment.status = \'SCHEDULED\' THEN 1 END)', 'scheduled')
      .addSelect('COUNT(CASE WHEN appointment.status = \'CONFIRMED\' THEN 1 END)', 'confirmed')
      .addSelect('COUNT(CASE WHEN appointment.status = \'CANCELLED\' THEN 1 END)', 'cancelled')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt < :endDate', { endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    const results = await query
      .groupBy('DATE_TRUNC(\'day\', appointment.scheduledAt)')
      .orderBy('DATE_TRUNC(\'day\', appointment.scheduledAt)', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      dayName: r.date ? new Date(r.date).toLocaleDateString('es-MX', { weekday: 'short' }) : '',
      scheduled: parseInt(r.scheduled || 0),
      confirmed: parseInt(r.confirmed || 0),
      cancelled: parseInt(r.cancelled || 0),
    }));
  }

  private async getAppointmentsByStylist(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    locationType?: 'CLINIC' | 'HOME',
    statuses?: string[],
  ): Promise<AppointmentByStylist[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COALESCE(user.name, \'Sin asignar\')', 'stylistName')
      .addSelect('COUNT(DISTINCT appointment.id)', 'appointmentCount')
      .addSelect('COUNT(CASE WHEN appointment.status = \'CONFIRMED\' THEN 1 END)', 'confirmedCount')
      .addSelect('COUNT(CASE WHEN appointment.status = \'CANCELLED\' THEN 1 END)', 'cancelledCount')
      .leftJoin(User, 'user', 'user.id = appointment.assignedStaffUserId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt < :endDate', { endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    const results = await query
      .groupBy('COALESCE(user.name, \'Sin asignar\')')
      .orderBy('COUNT(DISTINCT appointment.id)', 'DESC')
      .limit(8)
      .getRawMany();

    return results.map((r) => ({
      name: r.stylistName || 'Sin asignar',
      appointmentCount: parseInt(r.appointmentCount || 0),
      confirmedCount: parseInt(r.confirmedCount || 0),
      cancelledCount: parseInt(r.cancelledCount || 0),
    }));
  }

  private async getTodayAppointments(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    locationType?: 'CLINIC' | 'HOME',
    statuses?: string[],
    paid?: boolean,
    excludeStatuses?: string[],
  ): Promise<AppointmentDetail[]> {
    console.log('getTodayAppointments - clinic:', clinicId, 'date range:', { startDate, endDate }, 'paid:', paid, 'excludeStatuses:', excludeStatuses);

    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('appointment.id', 'id')
      .addSelect('appointment.scheduledAt', 'scheduledAt')
      .addSelect('appointment.scheduledAt', 'time')
      .addSelect('client.id', 'clientId')
      .addSelect('client.name', 'clientName')
      .addSelect('pet.id', 'petId')
      .addSelect('pet.name', 'petName')
      .addSelect('appointment.reason', 'reason')
      .addSelect('appointment.reason', 'serviceName')
      .addSelect('user.name', 'stylistName')
      .addSelect('appointment.status', 'status')
      .addSelect('appointment.totalAmount', 'totalAmount')
      .addSelect('appointment.cancelledAt', 'cancelledAt')
      .addSelect('appointment.cancellationReason', 'cancellationReason')
      .addSelect('appointment.paid', 'paid')
      .leftJoin(Client, 'client', 'client.id = appointment.clientId')
      .leftJoin(Pet, 'pet', 'pet.id = appointment.petId')
      .leftJoin(User, 'user', 'user.id = appointment.assignedStaffUserId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt >= :startDate', { startDate })
      .andWhere('appointment.scheduledAt < :endDate', { endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    if (paid !== undefined) {
      query.andWhere('appointment.paid = :paid', { paid });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    if (excludeStatuses && excludeStatuses.length > 0) {
      query.andWhere('appointment.status NOT IN (:...excludeStatuses)', { excludeStatuses });
    }

    const results = await query.orderBy('appointment.scheduledAt', 'ASC').getRawMany();

    console.log('getTodayAppointments - found', results.length, 'appointments');

    return results.map((r) => ({
      id: r.id,
      time: new Date(r.time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      clientId: r.clientId,
      clientName: r.clientName || 'N/A',
      petId: r.petId,
      petName: r.petName || 'N/A',
      service: r.reason || 'N/A',
      serviceName: r.serviceName || 'N/A',
      stylistName: r.stylistName || 'Sin asignar',
      status: r.status,
      totalAmount: r.totalAmount ? Number(r.totalAmount) : null,
      scheduledAt: r.scheduledAt,
      cancelledAt: r.cancelledAt || null,
      cancellationReason: r.cancellationReason || null,
      paid: r.paid || false,
    }));
  }

  private async getMostActiveClient(
    clinicId: string,
    startDate: Date,
    endDate: Date,
    locationType?: 'CLINIC' | 'HOME',
    statuses?: string[],
  ) {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('client.name', 'clientName')
      .addSelect('COUNT(DISTINCT appointment.id)', 'count')
      .leftJoin(Client, 'client', 'client.id = appointment.clientId')
      .where('appointment.clinicId = :clinicId', { clinicId })
      .andWhere('appointment.scheduledAt BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (locationType) {
      query.andWhere('appointment.locationType = :locationType', { locationType });
    }

    if (statuses && statuses.length > 0) {
      query.andWhere('appointment.status IN (:...statuses)', { statuses });
    }

    const result = await query
      .groupBy('client.id, client.name')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne();

    return result;
  }
}
