import { Injectable } from '@nestjs/common';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PetPreventiveCareEvent } from '../../../database/entities/pet-preventive-care-event.entity';

@Injectable()
export class PreventiveCareEventRepository {
  constructor(
    @InjectRepository(PetPreventiveCareEvent)
    private readonly repo: Repository<PetPreventiveCareEvent>,
  ) {}

  async create(data: Partial<PetPreventiveCareEvent>): Promise<PetPreventiveCareEvent> {
    return this.repo.save(this.repo.create(data));
  }

  async findById(
    eventId: string,
    clinicId?: string,
  ): Promise<PetPreventiveCareEvent | null> {
    const query = this.repo
      .createQueryBuilder('e')
      .where('e.id = :eventId', { eventId })
      .leftJoinAndSelect('e.pet', 'pet')
      .leftJoinAndSelect('e.service', 'service')
      .leftJoinAndSelect('e.appointment', 'appointment');

    if (clinicId) {
      query.andWhere('pet.clinicId = :clinicId', { clinicId });
    }

    return query.getOne();
  }

  async findActiveForPet(petId: string): Promise<PetPreventiveCareEvent[]> {
    return this.repo
      .createQueryBuilder('e')
      .where('e.petId = :petId', { petId })
      .andWhere("e.status IN ('UPCOMING', 'OVERDUE')")
      .leftJoinAndSelect('e.service', 'service')
      .orderBy('e.nextDueAt', 'ASC')
      .getMany();
  }

  async findUpcomingEvents(
    clinicId: string,
    daysUntil: number = 30,
  ): Promise<PetPreventiveCareEvent[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysUntil);

    return this.repo
      .createQueryBuilder('e')
      .innerJoin('e.pet', 'pet')
      .where('pet.clinicId = :clinicId', { clinicId })
      .andWhere("e.status = 'UPCOMING'")
      .andWhere('e.nextDueAt <= :targetDate', { targetDate })
      .leftJoinAndSelect('e.pet', 'petData')
      .leftJoinAndSelect('e.service', 'service')
      .orderBy('e.nextDueAt', 'ASC')
      .getMany();
  }

  async findOverdueEvents(clinicId: string): Promise<PetPreventiveCareEvent[]> {
    const now = new Date();

    return this.repo
      .createQueryBuilder('e')
      .innerJoin('e.pet', 'pet')
      .where('pet.clinicId = :clinicId', { clinicId })
      .andWhere("e.status = 'OVERDUE'")
      .andWhere('e.nextDueAt < :now', { now })
      .leftJoinAndSelect('e.pet', 'petData')
      .leftJoinAndSelect('e.service', 'service')
      .orderBy('e.nextDueAt', 'ASC')
      .getMany();
  }

  async findByPetAndService(
    petId: string,
    serviceId: string,
  ): Promise<PetPreventiveCareEvent | null> {
    return this.repo
      .createQueryBuilder('e')
      .where('e.petId = :petId', { petId })
      .andWhere('e.serviceId = :serviceId', { serviceId })
      .orderBy('e.appliedAt', 'DESC')
      .limit(1)
      .getOne();
  }

  async findByClinic(
    clinicId: string,
    filters: {
      petId?: string;
      serviceId?: string;
      eventType?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<[PetPreventiveCareEvent[], number]> {
    const query = this.repo
      .createQueryBuilder('e')
      .innerJoin('e.pet', 'pet')
      .where('pet.clinicId = :clinicId', { clinicId })
      .leftJoinAndSelect('e.pet', 'petData')
      .leftJoinAndSelect('e.service', 'service')
      .leftJoinAndSelect('e.appointment', 'appointment');

    if (filters.petId) {
      query.andWhere('e.petId = :petId', { petId: filters.petId });
    }
    if (filters.serviceId) {
      query.andWhere('e.serviceId = :serviceId', { serviceId: filters.serviceId });
    }
    if (filters.eventType) {
      query.andWhere('e.eventType = :eventType', { eventType: filters.eventType });
    }
    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim());
      query.andWhere('e.status IN (:...statuses)', { statuses });
    }
    if (filters.dateFrom) {
      query.andWhere('e.appliedAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      query.andWhere('e.appliedAt <= :dateTo', { dateTo: filters.dateTo });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    query
      .orderBy('e.appliedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  async updateStatus(eventId: string, status: string): Promise<void> {
    await this.repo.update({ id: eventId }, { status: status as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' });
  }

  async save(event: PetPreventiveCareEvent): Promise<PetPreventiveCareEvent> {
    return this.repo.save(event);
  }

  async delete(eventId: string): Promise<void> {
    await this.repo.delete({ id: eventId });
  }

  async findByAppointment(appointmentId: string): Promise<PetPreventiveCareEvent[]> {
    return this.repo
      .createQueryBuilder('e')
      .where('e.appointmentId = :appointmentId', { appointmentId })
      .leftJoinAndSelect('e.pet', 'pet')
      .leftJoinAndSelect('e.service', 'service')
      .getMany();
  }
}
