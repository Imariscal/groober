import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentGroup } from '@/database/entities/appointment-group.entity';

@Injectable()
export class AppointmentGroupRepository {
  constructor(
    @InjectRepository(AppointmentGroup)
    private repository: Repository<AppointmentGroup>,
  ) {}

  async create(data: Partial<AppointmentGroup>): Promise<AppointmentGroup> {
    const group = this.repository.create(data);
    return this.repository.save(group);
  }

  async findById(id: string): Promise<AppointmentGroup | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['clinic', 'client', 'appointments'],
    });
  }

  async findByClinic(
    clinicId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<{
    data: AppointmentGroup[];
    total: number;
  }> {
    const [data, total] = await this.repository.findAndCount({
      where: { clinicId },
      relations: ['client', 'appointments'],
      order: { scheduledAt: 'DESC' },
      skip,
      take,
    });

    return { data, total };
  }

  async findByClient(
    clinicId: string,
    clientId: string,
  ): Promise<AppointmentGroup[]> {
    return this.repository.find({
      where: { clinicId, clientId },
      relations: ['appointments'],
      order: { scheduledAt: 'DESC' },
    });
  }

  async update(
    id: string,
    data: Partial<AppointmentGroup>,
  ): Promise<AppointmentGroup | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
