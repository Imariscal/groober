import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vaccine } from '@/database/entities';

@Injectable()
export class VaccineRepository {
  constructor(
    @InjectRepository(Vaccine)
    private readonly repository: Repository<Vaccine>,
  ) {}

  async findByClinic(clinicId: string, includeInactive: boolean = false) {
    const query = this.repository.createQueryBuilder('vaccine')
      .where('vaccine.clinicId = :clinicId', { clinicId });
    
    if (!includeInactive) {
      query.andWhere('vaccine.isActive = true');
    }

    return query.orderBy('vaccine.name', 'ASC').getMany();
  }

  async findById(id: string, clinicId: string) {
    return this.repository.findOne({
      where: { id, clinicId },
    });
  }

  async create(clinicId: string, data: any) {
    const vaccine = this.repository.create({
      ...data,
      clinicId,
    });
    return this.repository.save(vaccine);
  }

  async update(id: string, clinicId: string, data: any) {
    await this.repository.update(
      { id, clinicId },
      data,
    );
    return this.findById(id, clinicId);
  }

  async delete(id: string, clinicId: string) {
    return this.repository.delete({ id, clinicId });
  }
}
