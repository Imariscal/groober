import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Stylist,
  User,
  StylistAvailability,
  StylistUnavailablePeriod,
  StylistCapacity,
} from '@/database/entities';
import {
  UpdateStylistDto,
  StylistListResponseDto,
  CreateStylistAvailabilityDto,
  UpdateStylistAvailabilityDto,
  StylistAvailabilityResponseDto,
  CreateStylistUnavailablePeriodDto,
  UpdateStylistUnavailablePeriodDto,
  StylistUnavailablePeriodResponseDto,
  CreateStylistCapacityDto,
  UpdateStylistCapacityDto,
  StylistCapacityResponseDto,
  UnavailablePeriodReason,
} from './stylists.dto';

@Injectable()
export class StylistsService {
  constructor(
    @InjectRepository(Stylist)
    private stylistRepository: Repository<Stylist>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(StylistAvailability)
    private availabilityRepository: Repository<StylistAvailability>,
    @InjectRepository(StylistUnavailablePeriod)
    private unavailablePeriodRepository: Repository<StylistUnavailablePeriod>,
    @InjectRepository(StylistCapacity)
    private capacityRepository: Repository<StylistCapacity>,
  ) {}

  async listClinicStylists(clinicId: string): Promise<StylistListResponseDto[]> {
    const stylists = await this.stylistRepository.find({
      where: { clinicId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return stylists.map((stylist) => this.mapToResponse(stylist));
  }

  async listBookableStylists(clinicId: string): Promise<StylistListResponseDto[]> {
    const stylists = await this.stylistRepository.find({
      where: { clinicId, isBookable: true },
      relations: ['user'],
      order: { displayName: 'ASC' },
    });

    // Filter out stylists whose users are not active
    return stylists
      .filter((s) => s.user && s.user.status === 'ACTIVE')
      .map((stylist) => this.mapToResponse(stylist));
  }

  async getStylistById(
    clinicId: string,
    stylistId: string,
  ): Promise<StylistListResponseDto> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
      relations: ['user'],
    });

    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    return this.mapToResponse(stylist);
  }

  async getStylistByUserId(
    clinicId: string,
    userId: string,
  ): Promise<StylistListResponseDto> {
    const stylist = await this.stylistRepository.findOne({
      where: { userId, clinicId },
      relations: ['user'],
    });

    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    return this.mapToResponse(stylist);
  }

  async updateStylist(
    clinicId: string,
    stylistId: string,
    dto: UpdateStylistDto,
  ): Promise<StylistListResponseDto> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
      relations: ['user'],
    });

    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    if (dto.displayName !== undefined) {
      stylist.displayName = dto.displayName;
    }
    if (dto.calendarColor !== undefined) {
      stylist.calendarColor = dto.calendarColor;
    }
    if (dto.isBookable !== undefined) {
      stylist.isBookable = dto.isBookable;
    }

    if (dto.type !== undefined) {
      stylist.type = dto.type;
    }

    const updatedStylist = await this.stylistRepository.save(stylist);

    return this.mapToResponse(updatedStylist);
  }

  private mapToResponse(stylist: Stylist): StylistListResponseDto {
    return {
      id: stylist.id,
      userId: stylist.userId,
      displayName: stylist.displayName,
      type: stylist.type,
      isBookable: stylist.isBookable,
      calendarColor: stylist.calendarColor,
      user: {
        id: stylist.user.id,
        name: stylist.user.name,
        email: stylist.user.email,
        status: stylist.user.status,
      },
      createdAt: stylist.createdAt,
      updatedAt: stylist.updatedAt,
    };
  }

  // ============= AVAILABILITY METHODS =============

  /**
   * Crear horario de trabajo para un estilista en un día específico
   */
  async createAvailability(
    clinicId: string,
    stylistId: string,
    dto: CreateStylistAvailabilityDto,
  ): Promise<StylistAvailabilityResponseDto> {
    // Verificar que el estilista existe
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    // Verificar que no exista ya un registro para ese día
    const existing = await this.availabilityRepository.findOne({
      where: { stylistId, dayOfWeek: dto.day_of_week },
    });
    if (existing) {
      throw new BadRequestException(
        'Ya existe un horario para este día de la semana',
      );
    }

    const availability = this.availabilityRepository.create({
      stylistId,
      dayOfWeek: dto.day_of_week,
      startTime: dto.start_time,
      endTime: dto.end_time,
      isActive: dto.is_active ?? true,
    });

    const saved = await this.availabilityRepository.save(availability);
    return this.mapAvailabilityToResponse(saved);
  }

  /**
   * Listar horarios de un estilista
   */
  async listAvailabilities(
    clinicId: string,
    stylistId: string,
  ): Promise<StylistAvailabilityResponseDto[]> {
    // Verificar que el estilista existe
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const availabilities = await this.availabilityRepository.find({
      where: { stylistId },
      order: { dayOfWeek: 'ASC' },
    });

    return availabilities.map((a) => this.mapAvailabilityToResponse(a));
  }

  /**
   * Actualizar horario de un estilista
   */
  async updateAvailability(
    clinicId: string,
    stylistId: string,
    availabilityId: string,
    dto: UpdateStylistAvailabilityDto,
  ): Promise<StylistAvailabilityResponseDto> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const availability = await this.availabilityRepository.findOne({
      where: { id: availabilityId, stylistId },
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

  /**
   * Eliminar horario de un estilista
   */
  async deleteAvailability(
    clinicId: string,
    stylistId: string,
    availabilityId: string,
  ): Promise<void> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const availability = await this.availabilityRepository.findOne({
      where: { id: availabilityId, stylistId },
    });
    if (!availability) {
      throw new NotFoundException('Horario no encontrado');
    }

    await this.availabilityRepository.remove(availability);
  }

  // ============= UNAVAILABLE PERIOD METHODS =============

  /**
   * Crear un período de no disponibilidad (vacaciones, enfermedad, etc.)
   */
  async createUnavailablePeriod(
    clinicId: string,
    stylistId: string,
    dto: CreateStylistUnavailablePeriodDto,
  ): Promise<StylistUnavailablePeriodResponseDto> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (startDate > endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    const period = this.unavailablePeriodRepository.create({
      stylistId,
      reason: dto.reason,
      startDate,
      endDate,
      isAllDay: dto.is_all_day ?? true,
      startTime: dto.start_time,
      endTime: dto.end_time,
      notes: dto.notes,
    });

    const saved = await this.unavailablePeriodRepository.save(period);
    return this.mapUnavailablePeriodToResponse(saved);
  }

  /**
   * Listar períodos de no disponibilidad de un estilista
   */
  async listUnavailablePeriods(
    clinicId: string,
    stylistId: string,
  ): Promise<StylistUnavailablePeriodResponseDto[]> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const periods = await this.unavailablePeriodRepository.find({
      where: { stylistId },
      order: { startDate: 'DESC' },
    });

    return periods.map((p) => this.mapUnavailablePeriodToResponse(p));
  }

  /**
   * Actualizar período de no disponibilidad
   */
  async updateUnavailablePeriod(
    clinicId: string,
    stylistId: string,
    periodId: string,
    dto: UpdateStylistUnavailablePeriodDto,
  ): Promise<StylistUnavailablePeriodResponseDto> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const period = await this.unavailablePeriodRepository.findOne({
      where: { id: periodId, stylistId },
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

  /**
   * Eliminar período de no disponibilidad
   */
  async deleteUnavailablePeriod(
    clinicId: string,
    stylistId: string,
    periodId: string,
  ): Promise<void> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const period = await this.unavailablePeriodRepository.findOne({
      where: { id: periodId, stylistId },
    });
    if (!period) {
      throw new NotFoundException('Período no encontrado');
    }

    await this.unavailablePeriodRepository.remove(period);
  }

  // ============= CAPACITY METHODS =============

  /**
   * Crear capacidad específica para un día
   */
  async createCapacity(
    clinicId: string,
    stylistId: string,
    dto: CreateStylistCapacityDto,
  ): Promise<StylistCapacityResponseDto> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const date = new Date(dto.date);

    // Verificar que no exista ya
    const existing = await this.capacityRepository.findOne({
      where: { stylistId, date },
    });
    if (existing) {
      throw new BadRequestException(
        'Ya existe una capacidad definida para este día',
      );
    }

    const capacity = this.capacityRepository.create({
      stylistId,
      date,
      maxAppointments: dto.max_appointments,
      notes: dto.notes,
    });

    const saved = await this.capacityRepository.save(capacity);
    return this.mapCapacityToResponse(saved);
  }

  /**
   * Listar capacidades de un estilista
   */
  async listCapacities(
    clinicId: string,
    stylistId: string,
  ): Promise<StylistCapacityResponseDto[]> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const capacities = await this.capacityRepository.find({
      where: { stylistId },
      order: { date: 'DESC' },
    });

    return capacities.map((c) => this.mapCapacityToResponse(c));
  }

  /**
   * Actualizar capacidad
   */
  async updateCapacity(
    clinicId: string,
    stylistId: string,
    capacityId: string,
    dto: UpdateStylistCapacityDto,
  ): Promise<StylistCapacityResponseDto> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const capacity = await this.capacityRepository.findOne({
      where: { id: capacityId, stylistId },
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

  /**
   * Eliminar capacidad específica
   */
  async deleteCapacity(
    clinicId: string,
    stylistId: string,
    capacityId: string,
  ): Promise<void> {
    const stylist = await this.stylistRepository.findOne({
      where: { id: stylistId, clinicId },
    });
    if (!stylist) {
      throw new NotFoundException('Estilista no encontrado');
    }

    const capacity = await this.capacityRepository.findOne({
      where: { id: capacityId, stylistId },
    });
    if (!capacity) {
      throw new NotFoundException('Capacidad no encontrada');
    }

    await this.capacityRepository.remove(capacity);
  }

  // ============= PRIVATE HELPERS =============

  private mapAvailabilityToResponse(
    availability: StylistAvailability,
  ): StylistAvailabilityResponseDto {
    return {
      id: availability.id,
      stylist_id: availability.stylistId,
      day_of_week: availability.dayOfWeek,
      start_time: availability.startTime,
      end_time: availability.endTime,
      is_active: availability.isActive,
      created_at: availability.createdAt,
      updated_at: availability.updatedAt,
    };
  }

  private mapUnavailablePeriodToResponse(
    period: StylistUnavailablePeriod,
  ): StylistUnavailablePeriodResponseDto {
    return {
      id: period.id,
      stylist_id: period.stylistId,
      reason: period.reason as UnavailablePeriodReason,
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

  private mapCapacityToResponse(
    capacity: StylistCapacity,
  ): StylistCapacityResponseDto {
    return {
      id: capacity.id,
      stylist_id: capacity.stylistId,
      date: capacity.date,
      max_appointments: capacity.maxAppointments,
      notes: capacity.notes,
      created_at: capacity.createdAt,
      updated_at: capacity.updatedAt,
    };
  }
}
