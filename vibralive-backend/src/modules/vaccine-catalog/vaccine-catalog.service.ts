import { Injectable, NotFoundException } from '@nestjs/common';
import { VaccineRepository } from './repositories/vaccine.repository';
import { CreateVaccineDto } from './dtos/create-vaccine.dto';

@Injectable()
export class VaccineCatalogService {
  constructor(private readonly vaccineRepository: VaccineRepository) {}

  /**
   * Obtener todas las vacunas activas de una clínica
   */
  async getVaccines(clinicId: string) {
    return this.vaccineRepository.findByClinic(clinicId, false);
  }

  /**
   * Obtener todas las vacunas (incluyendo inactivas)
   */
  async getAllVaccines(clinicId: string) {
    return this.vaccineRepository.findByClinic(clinicId, true);
  }

  /**
   * Obtener una vacuna por ID
   */
  async getVaccineById(clinicId: string, vaccineId: string) {
    const vaccine = await this.vaccineRepository.findById(vaccineId, clinicId);
    if (!vaccine) {
      throw new NotFoundException(`Vacuna no encontrada`);
    }
    return vaccine;
  }

  /**
   * Crear una nueva vacuna
   */
  async createVaccine(clinicId: string, dto: CreateVaccineDto) {
    return this.vaccineRepository.create(clinicId, {
      name: dto.name,
      description: dto.description,
      diseasesCovered: dto.diseasesCovered,
      isSingleDose: dto.isSingleDose ?? false,
      boosterDays: dto.isSingleDose ? undefined : (dto.boosterDays || 0),
      isActive: dto.isActive !== false,
    });
  }

  /**
   * Actualizar vacuna
   */
  async updateVaccine(
    clinicId: string,
    vaccineId: string,
    dto: Partial<CreateVaccineDto>,
  ) {
    const vaccine = await this.getVaccineById(clinicId, vaccineId);
    const isSingleDose = dto.isSingleDose !== undefined ? dto.isSingleDose : vaccine.isSingleDose;
    return this.vaccineRepository.update(vaccineId, clinicId, {
      name: dto.name ?? vaccine.name,
      description: dto.description ?? vaccine.description,
      diseasesCovered: dto.diseasesCovered ?? vaccine.diseasesCovered,
      isSingleDose,
      boosterDays: isSingleDose ? undefined : (dto.boosterDays ?? vaccine.boosterDays),
      isActive: dto.isActive !== undefined ? dto.isActive : vaccine.isActive,
    });
  }

  /**
   * Desactivar vacuna
   */
  async deactivateVaccine(clinicId: string, vaccineId: string) {
    return this.vaccineRepository.update(vaccineId, clinicId, {
      isActive: false,
    });
  }

  /**
   * Activar vacuna
   */
  async activateVaccine(clinicId: string, vaccineId: string) {
    return this.vaccineRepository.update(vaccineId, clinicId, {
      isActive: true,
    });
  }

  /**
   * Eliminar vacuna
   */
  async deleteVaccine(clinicId: string, vaccineId: string) {
    const vaccine = await this.getVaccineById(clinicId, vaccineId);
    await this.vaccineRepository.delete(vaccineId, clinicId);
  }
}
