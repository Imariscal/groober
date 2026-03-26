import { Injectable } from '@nestjs/common';
import { Repository, LessThanOrEqual, Between, In, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../../../database/entities/appointment.entity';
import { User } from '../../../database/entities/user.entity';

@Injectable()
export class AppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(data: Partial<Appointment>): Promise<Appointment> {
    return this.repo.save(this.repo.create(data));
  }

  async findByClinic(
    clinicId: string,
    filters: {
      status?: string;
      client_id?: string;
      pet_id?: string;
      date_from?: string;
      date_to?: string;
      location_type?: string;
      serviceType?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<[Appointment[], number]> {
    const query = this.repo
      .createQueryBuilder('a')
      .where('a.clinicId = :clinicId', { clinicId })
      .leftJoinAndSelect('a.pet', 'pet')
      .leftJoinAndSelect('a.client', 'client')
      .leftJoinAndSelect('a.address', 'address')
      .leftJoinAndSelect('a.appointmentItems', 'appointmentItems')
      .leftJoinAndSelect('appointmentItems.service', 'service')
      .leftJoinAndSelect('a.sales', 'sales');

    if (filters.status) {
      // Support comma-separated status values
      const statuses = filters.status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        query.andWhere('a.status = :status', { status: statuses[0] });
      } else {
        query.andWhere('a.status IN (:...statuses)', { statuses });
      }
    }
    if (filters.location_type) {
      query.andWhere('a.locationType = :locationType', { locationType: filters.location_type });
    }
    if (filters.serviceType) {
      query.andWhere('a.serviceType = :serviceType', { serviceType: filters.serviceType });
    }
    if (filters.client_id) {
      query.andWhere('a.clientId = :clientId', { clientId: filters.client_id });
    }
    if (filters.pet_id) {
      query.andWhere('a.petId = :petId', { petId: filters.pet_id });
    }
    if (filters.date_from) {
      query.andWhere('a.scheduledAt >= :dateFrom', {
        dateFrom: new Date(filters.date_from),
      });
    }
    if (filters.date_to) {
      query.andWhere('a.scheduledAt <= :dateTo', {
        dateTo: new Date(filters.date_to),
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('a.scheduledAt', 'ASC');

    return query.getManyAndCount();
  }

  async findByClinicAndId(
    clinicId: string,
    appointmentId: string,
  ): Promise<Appointment | null> {
    return this.repo.findOne({
      where: { clinicId, id: appointmentId },
      relations: ['pet', 'client'],
    });
  }

  async save(appointment: Appointment): Promise<Appointment> {
    return this.repo.save(appointment);
  }

  async findById(appointmentId: string): Promise<Appointment | null> {
    return this.repo.findOne({ where: { id: appointmentId } });
  }

  async findHomeGroomingForRoute(
    clinicId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]> {
    return this.repo.find({
      where: {
        clinicId,
        locationType: 'HOME',
        requiresRoutePlanning: true,
        scheduledAt: Between(startDate, endDate),
        status: 'SCHEDULED', // or CONFIRMED
      },
      relations: ['pet', 'client', 'assignedStaffUser'],
    });
  }

  async getAvailableStylists(clinicId: string): Promise<User[]> {
    // Get all active users in clinic (can be improved to check role/status)
    return this.userRepo.find({
      where: {
        clinicId,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Find appointments that were SCHEDULED or CONFIRMED but not attended
   * (scheduled before cutoffDate and still in pending status)
   */
  async findUnattendedAppointments(cutoffDate: Date): Promise<Appointment[]> {
    return this.repo.find({
      where: {
        scheduledAt: LessThan(cutoffDate),
        status: In(['SCHEDULED', 'CONFIRMED']),
      },
      relations: ['pet', 'client', 'clinic'],
    });
  }

  /**
   * Bulk update appointments to UNATTENDED status
   */
  async markAsUnattended(appointmentIds: string[]): Promise<number> {
    if (appointmentIds.length === 0) return 0;
    
    const result = await this.repo.update(
      { id: In(appointmentIds) },
      { status: 'UNATTENDED' }
    );
    
    return result.affected || 0;
  }

  /**
   * Get count of unattended appointments per clinic for reporting
   */
  async getUnattendedCountByClinic(): Promise<{ clinicId: string; count: number }[]> {
    const results = await this.repo
      .createQueryBuilder('a')
      .select('a.clinicId', 'clinicId')
      .addSelect('COUNT(*)', 'count')
      .where('a.status = :status', { status: 'UNATTENDED' })
      .groupBy('a.clinicId')
      .getRawMany();
    
    return results.map(r => ({ clinicId: r.clinicId, count: parseInt(r.count) }));
  }
}
