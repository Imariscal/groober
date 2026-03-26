import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull } from 'typeorm';
import { MedicalVisit } from '@/database/entities';

@Injectable()
export class MedicalVisitsRepository extends Repository<MedicalVisit> {
  constructor(private dataSource: DataSource) {
    super(MedicalVisit, dataSource.createEntityManager());
  }

  /**
   * Obtener una visita médica por clinic y ID
   */
  async findOneByClinic(
    clinicId: string,
    medicalVisitId: string,
  ): Promise<MedicalVisit | null> {
    return this.findOne({
      where: {
        id: medicalVisitId,
        clinicId,
      },
      relations: [
        'pet',
        'veterinarian',
        'appointment',
        'exams',
        'diagnoses',
        'prescriptions',
        'diagnosticOrders',
        'procedures',
        'followUpNotes',
        'attachments',
      ],
    });
  }

  /**
   * Obtener visitas médicas por clinic y pet
   */
  async findByClinicAndPet(
    clinicId: string,
    petId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<[MedicalVisit[], number]> {
    return this.findAndCount({
      where: {
        clinicId,
        petId,
      },
      relations: [
        'veterinarian',
        'appointment',
        'exams',
        'diagnoses',
        'prescriptions',
        'diagnosticOrders',
        'procedures',
        'followUpNotes',
        'attachments',
      ],
      order: {
        visitDate: 'DESC',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Obtener visitas médicas por clinic y estado
   */
  async findByClinicAndStatus(
    clinicId: string,
    status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED',
    limit: number = 50,
  ) {
    return this.findAndCount({
      where: {
        clinicId,
        status,
      },
      relations: ['pet', 'veterinarian'],
      order: {
        visitDate: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Obtener visitas médicas por clinic y veterinario
   */
  async findByClinicAndVeterinarian(
    clinicId: string,
    veterinarianId: string,
    limit: number = 50,
  ) {
    return this.find({
      where: {
        clinicId,
        veterinarianId,
      },
      relations: ['pet'],
      order: {
        visitDate: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Obtener visitas sin firmar (para auditoría)
   */
  async findUnsignedByClinic(
    clinicId: string,
  ): Promise<MedicalVisit[]> {
    return this.find({
      where: {
        clinicId,
        status: 'COMPLETED',
        signedAt: IsNull(),
      },
      relations: ['pet', 'veterinarian'],
      order: {
        visitDate: 'ASC',
      },
    });
  }
}
