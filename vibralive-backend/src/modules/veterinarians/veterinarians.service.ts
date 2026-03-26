import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Veterinarian,
  User,
  VeterinarianAvailability,
  VeterinarianUnavailablePeriod,
  VeterinarianCapacity,
} from '@/database/entities';
import {
  CreateVeterinarianDto,
  UpdateVeterinarianDto,
  VeterinarianListResponseDto,
  CreateVeterinarianAvailabilityDto,
  UpdateVeterinarianAvailabilityDto,
  VeterinarianAvailabilityResponseDto,
  CreateVeterinarianUnavailablePeriodDto,
  UpdateVeterinarianUnavailablePeriodDto,
  VeterinarianUnavailablePeriodResponseDto,
  CreateVeterinarianCapacityDto,
  UpdateVeterinarianCapacityDto,
  VeterinarianCapacityResponseDto,
} from './veterinarians.dto';

@Injectable()
export class VeterinariansService {
  constructor(
    @InjectRepository(Veterinarian)
    private veterinarianRepository: Repository<Veterinarian>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VeterinarianAvailability)
    private availabilityRepository: Repository<VeterinarianAvailability>,
    @InjectRepository(VeterinarianUnavailablePeriod)
    private unavailablePeriodRepository: Repository<VeterinarianUnavailablePeriod>,
    @InjectRepository(VeterinarianCapacity)
    private capacityRepository: Repository<VeterinarianCapacity>,
  ) {}

  async createVeterinarian(
    clinicId: string,
    dto: CreateVeterinarianDto,
  ): Promise<VeterinarianListResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Check if user already has a veterinarian record
    const existing = await this.veterinarianRepository.findOne({
      where: { userId: dto.userId, clinicId },
    });

    if (existing) {
      throw new BadRequestException('Este usuario ya está registrado como veterinario');
    }

    const veterinarian = this.veterinarianRepository.create({
      clinicId,
      userId: dto.userId,
      displayName: dto.displayName || null,
      specialty: dto.specialty || 'GENERAL',
      isBookable: dto.isBookable ?? true,
      calendarColor: dto.calendarColor || null,
      licenseNumber: dto.licenseNumber || null,
    });

    const saved = await this.veterinarianRepository.save(veterinarian);

    // Reload with user relation
    const result = await this.veterinarianRepository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });

    return this.mapToResponse(result!);
  }

  async listClinicVeterinarians(clinicId: string): Promise<VeterinarianListResponseDto[]> {
    const veterinarians = await this.veterinarianRepository.find({
      where: { clinicId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return veterinarians.map((vet) => this.mapToResponse(vet));
  }

  async listBookableVeterinarians(clinicId: string): Promise<VeterinarianListResponseDto[]> {
    const veterinarians = await this.veterinarianRepository.find({
      where: { clinicId, isBookable: true },
      relations: ['user'],
      order: { displayName: 'ASC' },
    });

    // Filter out veterinarians whose users are not active
    return veterinarians
      .filter((v) => v.user && v.user.status === 'ACTIVE')
      .map((vet) => this.mapToResponse(vet));
  }

  async getVeterinarianById(
    clinicId: string,
    veterinarianId: string,
  ): Promise<VeterinarianListResponseDto> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
      relations: ['user'],
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    return this.mapToResponse(veterinarian);
  }

  async getVeterinarianByUserId(
    clinicId: string,
    userId: string,
  ): Promise<VeterinarianListResponseDto> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { userId, clinicId },
      relations: ['user'],
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    return this.mapToResponse(veterinarian);
  }

  async updateVeterinarian(
    clinicId: string,
    veterinarianId: string,
    dto: UpdateVeterinarianDto,
  ): Promise<VeterinarianListResponseDto> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
      relations: ['user'],
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    if (dto.displayName !== undefined) {
      veterinarian.displayName = dto.displayName;
    }
    if (dto.specialty !== undefined) {
      veterinarian.specialty = dto.specialty;
    }
    if (dto.calendarColor !== undefined) {
      veterinarian.calendarColor = dto.calendarColor;
    }
    if (dto.isBookable !== undefined) {
      veterinarian.isBookable = dto.isBookable;
    }
    if (dto.licenseNumber !== undefined) {
      veterinarian.licenseNumber = dto.licenseNumber;
    }

    const updated = await this.veterinarianRepository.save(veterinarian);

    return this.mapToResponse(updated);
  }

  async deleteVeterinarian(
    clinicId: string,
    veterinarianId: string,
  ): Promise<void> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });

    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    await this.veterinarianRepository.remove(veterinarian);
  }

  private mapToResponse(veterinarian: Veterinarian): VeterinarianListResponseDto {
    return {
      id: veterinarian.id,
      userId: veterinarian.userId,
      displayName: veterinarian.displayName,
      specialty: veterinarian.specialty,
      isBookable: veterinarian.isBookable,
      calendarColor: veterinarian.calendarColor,
      licenseNumber: veterinarian.licenseNumber,
      user: {
        id: veterinarian.user.id,
        name: veterinarian.user.name,
        email: veterinarian.user.email,
        status: veterinarian.user.status,
      },
      createdAt: veterinarian.createdAt,
      updatedAt: veterinarian.updatedAt,
    };
  }

  // ============= AVAILABILITY METHODS =============

  async createAvailability(
    clinicId: string,
    veterinarianId: string,
    dto: CreateVeterinarianAvailabilityDto,
  ): Promise<VeterinarianAvailabilityResponseDto> {
    // Verify veterinarian exists
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    // Check if already has availability for this day
    const existing = await this.availabilityRepository.findOne({
      where: { veterinarianId, dayOfWeek: dto.day_of_week },
    });
    if (existing) {
      throw new BadRequestException(
        'Ya existe un horario para este día de la semana',
      );
    }

    const availability = this.availabilityRepository.create({
      veterinarianId,
      dayOfWeek: dto.day_of_week,
      startTime: dto.start_time,
      endTime: dto.end_time,
      isActive: dto.is_active ?? true,
    });

    const saved = await this.availabilityRepository.save(availability);
    return this.mapAvailabilityToResponse(saved);
  }

  async listAvailabilities(
    clinicId: string,
    veterinarianId: string,
  ): Promise<VeterinarianAvailabilityResponseDto[]> {
    // Verify veterinarian exists
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const availabilities = await this.availabilityRepository.find({
      where: { veterinarianId },
      order: { dayOfWeek: 'ASC' },
    });

    return availabilities.map((a) => this.mapAvailabilityToResponse(a));
  }

  async updateAvailability(
    clinicId: string,
    veterinarianId: string,
    availabilityId: string,
    dto: UpdateVeterinarianAvailabilityDto,
  ): Promise<VeterinarianAvailabilityResponseDto> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const availability = await this.availabilityRepository.findOne({
      where: { id: availabilityId, veterinarianId },
    });
    if (!availability) {
      throw new NotFoundException('Horario no encontrado');
    }

    if (dto.start_time !== undefined) {
      availability.startTime = dto.start_time;
    }
    if (dto.end_time !== undefined) {
      availability.endTime = dto.end_time;
    }
    if (dto.is_active !== undefined) {
      availability.isActive = dto.is_active;
    }

    const updated = await this.availabilityRepository.save(availability);
    return this.mapAvailabilityToResponse(updated);
  }

  async deleteAvailability(
    clinicId: string,
    veterinarianId: string,
    availabilityId: string,
  ): Promise<void> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const availability = await this.availabilityRepository.findOne({
      where: { id: availabilityId, veterinarianId },
    });
    if (!availability) {
      throw new NotFoundException('Horario no encontrado');
    }

    await this.availabilityRepository.remove(availability);
  }

  private mapAvailabilityToResponse(
    availability: VeterinarianAvailability,
  ): VeterinarianAvailabilityResponseDto {
    return {
      id: availability.id,
      veterinarian_id: availability.veterinarianId,
      day_of_week: availability.dayOfWeek,
      start_time: availability.startTime,
      end_time: availability.endTime,
      is_active: availability.isActive,
      created_at: availability.createdAt,
      updated_at: availability.updatedAt,
    };
  }

  // ============= UNAVAILABLE PERIOD METHODS =============

  async createUnavailablePeriod(
    clinicId: string,
    veterinarianId: string,
    dto: CreateVeterinarianUnavailablePeriodDto,
  ): Promise<VeterinarianUnavailablePeriodResponseDto> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const period = this.unavailablePeriodRepository.create({
      veterinarianId,
      reason: dto.reason,
      startDate: new Date(dto.start_date),
      endDate: new Date(dto.end_date),
      isAllDay: dto.is_all_day ?? true,
      startTime: dto.start_time || null,
      endTime: dto.end_time || null,
      notes: dto.notes || null,
    });

    const saved = await this.unavailablePeriodRepository.save(period);
    return this.mapUnavailablePeriodToResponse(saved);
  }

  async listUnavailablePeriods(
    clinicId: string,
    veterinarianId: string,
  ): Promise<VeterinarianUnavailablePeriodResponseDto[]> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const periods = await this.unavailablePeriodRepository.find({
      where: { veterinarianId },
      order: { startDate: 'DESC' },
    });

    return periods.map((p) => this.mapUnavailablePeriodToResponse(p));
  }

  async updateUnavailablePeriod(
    clinicId: string,
    veterinarianId: string,
    periodId: string,
    dto: UpdateVeterinarianUnavailablePeriodDto,
  ): Promise<VeterinarianUnavailablePeriodResponseDto> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const period = await this.unavailablePeriodRepository.findOne({
      where: { id: periodId, veterinarianId },
    });
    if (!period) {
      throw new NotFoundException('Período no encontrado');
    }

    if (dto.reason !== undefined) {
      period.reason = dto.reason;
    }
    if (dto.start_date !== undefined) {
      period.startDate = new Date(dto.start_date);
    }
    if (dto.end_date !== undefined) {
      period.endDate = new Date(dto.end_date);
    }
    if (dto.is_all_day !== undefined) {
      period.isAllDay = dto.is_all_day;
    }
    if (dto.start_time !== undefined) {
      period.startTime = dto.start_time;
    }
    if (dto.end_time !== undefined) {
      period.endTime = dto.end_time;
    }
    if (dto.notes !== undefined) {
      period.notes = dto.notes;
    }

    const updated = await this.unavailablePeriodRepository.save(period);
    return this.mapUnavailablePeriodToResponse(updated);
  }

  async deleteUnavailablePeriod(
    clinicId: string,
    veterinarianId: string,
    periodId: string,
  ): Promise<void> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const period = await this.unavailablePeriodRepository.findOne({
      where: { id: periodId, veterinarianId },
    });
    if (!period) {
      throw new NotFoundException('Período no encontrado');
    }

    await this.unavailablePeriodRepository.remove(period);
  }

  private mapUnavailablePeriodToResponse(
    period: VeterinarianUnavailablePeriod,
  ): VeterinarianUnavailablePeriodResponseDto {
    return {
      id: period.id,
      veterinarian_id: period.veterinarianId,
      reason: period.reason,
      start_date: period.startDate,
      end_date: period.endDate,
      is_all_day: period.isAllDay,
      start_time: period.startTime,
      end_time: period.endTime,
      notes: period.notes,
      created_at: period.createdAt,
      updated_at: period.updatedAt,
    };
  }

  // ============= CAPACITY METHODS =============

  async createCapacity(
    clinicId: string,
    veterinarianId: string,
    dto: CreateVeterinarianCapacityDto,
  ): Promise<VeterinarianCapacityResponseDto> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    // Check if already has capacity for this date
    const existing = await this.capacityRepository.findOne({
      where: { veterinarianId, date: new Date(dto.date) },
    });
    if (existing) {
      throw new BadRequestException(
        'Ya existe una capacidad definida para esta fecha',
      );
    }

    const capacity = this.capacityRepository.create({
      veterinarianId,
      date: new Date(dto.date),
      maxAppointments: dto.max_appointments,
      notes: dto.notes || null,
    });

    const saved = await this.capacityRepository.save(capacity);
    return this.mapCapacityToResponse(saved);
  }

  async listCapacities(
    clinicId: string,
    veterinarianId: string,
  ): Promise<VeterinarianCapacityResponseDto[]> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const capacities = await this.capacityRepository.find({
      where: { veterinarianId },
      order: { date: 'DESC' },
    });

    return capacities.map((c) => this.mapCapacityToResponse(c));
  }

  async updateCapacity(
    clinicId: string,
    veterinarianId: string,
    capacityId: string,
    dto: UpdateVeterinarianCapacityDto,
  ): Promise<VeterinarianCapacityResponseDto> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const capacity = await this.capacityRepository.findOne({
      where: { id: capacityId, veterinarianId },
    });
    if (!capacity) {
      throw new NotFoundException('Capacidad no encontrada');
    }

    if (dto.max_appointments !== undefined) {
      capacity.maxAppointments = dto.max_appointments;
    }
    if (dto.notes !== undefined) {
      capacity.notes = dto.notes;
    }

    const updated = await this.capacityRepository.save(capacity);
    return this.mapCapacityToResponse(updated);
  }

  async deleteCapacity(
    clinicId: string,
    veterinarianId: string,
    capacityId: string,
  ): Promise<void> {
    const veterinarian = await this.veterinarianRepository.findOne({
      where: { id: veterinarianId, clinicId },
    });
    if (!veterinarian) {
      throw new NotFoundException('Veterinario no encontrado');
    }

    const capacity = await this.capacityRepository.findOne({
      where: { id: capacityId, veterinarianId },
    });
    if (!capacity) {
      throw new NotFoundException('Capacidad no encontrada');
    }

    await this.capacityRepository.remove(capacity);
  }

  private mapCapacityToResponse(
    capacity: VeterinarianCapacity,
  ): VeterinarianCapacityResponseDto {
    return {
      id: capacity.id,
      veterinarian_id: capacity.veterinarianId,
      date: capacity.date,
      max_appointments: capacity.maxAppointments,
      notes: capacity.notes,
      created_at: capacity.createdAt,
      updated_at: capacity.updatedAt,
    };
  }
}
