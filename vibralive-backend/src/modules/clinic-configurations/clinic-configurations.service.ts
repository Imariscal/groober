import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ClinicConfiguration, ClinicCalendarException, CalendarExceptionType, BusinessHours } from '@/database/entities';
import { TimezoneService } from '@/shared/timezone/timezone.service';
import { UpdateClinicConfigurationDto } from './dtos/update-clinic-configuration.dto';
import { CreateClinicCalendarExceptionDto, UpdateClinicCalendarExceptionDto } from './dtos/clinic-calendar-exception.dto';

const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  week: {
    mon: [{ start: '09:00', end: '19:00' }],
    tue: [{ start: '09:00', end: '19:00' }],
    wed: [{ start: '09:00', end: '19:00' }],
    thu: [{ start: '09:00', end: '19:00' }],
    fri: [{ start: '09:00', end: '19:00' }],
    sat: [{ start: '09:00', end: '14:00' }],
    sun: [],
  },
};

@Injectable()
export class ClinicConfigurationsService {
  constructor(
    @InjectRepository(ClinicConfiguration)
    private readonly configRepo: Repository<ClinicConfiguration>,
    @InjectRepository(ClinicCalendarException)
    private readonly exceptionRepo: Repository<ClinicCalendarException>,
    private readonly timezoneService: TimezoneService,
  ) {}

  /**
   * Get clinic configuration (lazy create if not exists)
   */
  async getConfiguration(clinicId: string): Promise<ClinicConfiguration> {
    let config = await this.configRepo.findOne({
      where: { clinicId },
    });

    if (!config) {
      // Lazy create default configuration
      config = this.configRepo.create({
        clinicId,
        timezone: 'America/Monterrey',
        businessHours: DEFAULT_BUSINESS_HOURS,
        clinicGroomingCapacity: 1,
        homeGroomingCapacity: 1,
        homeTravelBufferMinutes: 20,
        preventSamePetSameDay: true,
        maxClinicOverlappingAppointments: 5,
        allowAppointmentOverlap: false,
      });
      await this.configRepo.save(config);
    }

    return config;
  }

  /**
   * Update clinic configuration (upsert)
   */
  async updateConfiguration(clinicId: string, dto: UpdateClinicConfigurationDto): Promise<ClinicConfiguration> {
    // Validate ranges
    if (dto.clinicGroomingCapacity !== undefined && dto.clinicGroomingCapacity < 1) {
      throw new BadRequestException('Clinic grooming capacity must be >= 1');
    }
    if (dto.homeGroomingCapacity !== undefined && dto.homeGroomingCapacity < 1) {
      throw new BadRequestException('Home grooming capacity must be >= 1');
    }
    if (dto.homeTravelBufferMinutes !== undefined && dto.homeTravelBufferMinutes < 0) {
      throw new BadRequestException('Home travel buffer minutes must be >= 0');
    }
    if (dto.clinicMedicalCapacity !== undefined && dto.clinicMedicalCapacity < 1) {
      throw new BadRequestException('Clinic medical capacity must be >= 1');
    }
    if (dto.homeMedicalCapacity !== undefined && dto.homeMedicalCapacity < 1) {
      throw new BadRequestException('Home medical capacity must be >= 1');
    }
    if (dto.medicalTravelBufferMinutes !== undefined && dto.medicalTravelBufferMinutes < 0) {
      throw new BadRequestException('Medical travel buffer minutes must be >= 0');
    }

    // Check exists, if not, lazy create default
    let config = await this.configRepo.findOne({
      where: { clinicId },
    });

    if (!config) {
      config = this.configRepo.create({
        clinicId,
        timezone: dto.timezone || 'America/Monterrey',
        businessHours: dto.businessHours || DEFAULT_BUSINESS_HOURS,
        clinicGroomingCapacity: dto.clinicGroomingCapacity || 1,
        homeGroomingCapacity: dto.homeGroomingCapacity || 1,
        homeTravelBufferMinutes: dto.homeTravelBufferMinutes || 20,
        preventSamePetSameDay: dto.preventSamePetSameDay !== undefined ? dto.preventSamePetSameDay : true,
        maxClinicOverlappingAppointments: dto.maxClinicOverlappingAppointments || 5,
        allowAppointmentOverlap: dto.allowAppointmentOverlap !== undefined ? dto.allowAppointmentOverlap : false,
        clinicMedicalCapacity: dto.clinicMedicalCapacity || 1,
        homeMedicalCapacity: dto.homeMedicalCapacity || 1,
        medicalTravelBufferMinutes: dto.medicalTravelBufferMinutes || 20,
        maxClinicMedicalOverlappingAppointments: dto.maxClinicMedicalOverlappingAppointments || 5,
        allowMedicalAppointmentOverlap: dto.allowMedicalAppointmentOverlap !== undefined ? dto.allowMedicalAppointmentOverlap : false,
        baseLat: dto.baseLat ?? null,
        baseLng: dto.baseLng ?? null,
      });
    } else {
      // Update fields
      if (dto.timezone) config.timezone = dto.timezone;
      if (dto.businessHours !== undefined) config.businessHours = dto.businessHours;
      if (dto.clinicGroomingCapacity !== undefined) config.clinicGroomingCapacity = dto.clinicGroomingCapacity;
      if (dto.homeGroomingCapacity !== undefined) config.homeGroomingCapacity = dto.homeGroomingCapacity;
      if (dto.homeTravelBufferMinutes !== undefined) config.homeTravelBufferMinutes = dto.homeTravelBufferMinutes;
      if (dto.preventSamePetSameDay !== undefined) config.preventSamePetSameDay = dto.preventSamePetSameDay;
      if (dto.maxClinicOverlappingAppointments !== undefined) config.maxClinicOverlappingAppointments = dto.maxClinicOverlappingAppointments;
      if (dto.allowAppointmentOverlap !== undefined) config.allowAppointmentOverlap = dto.allowAppointmentOverlap;
      if (dto.clinicMedicalCapacity !== undefined) config.clinicMedicalCapacity = dto.clinicMedicalCapacity;
      if (dto.homeMedicalCapacity !== undefined) config.homeMedicalCapacity = dto.homeMedicalCapacity;
      if (dto.medicalTravelBufferMinutes !== undefined) config.medicalTravelBufferMinutes = dto.medicalTravelBufferMinutes;
      if (dto.maxClinicMedicalOverlappingAppointments !== undefined) config.maxClinicMedicalOverlappingAppointments = dto.maxClinicMedicalOverlappingAppointments;
      if (dto.allowMedicalAppointmentOverlap !== undefined) config.allowMedicalAppointmentOverlap = dto.allowMedicalAppointmentOverlap;
      if (dto.baseLat !== undefined) config.baseLat = dto.baseLat;
      if (dto.baseLng !== undefined) config.baseLng = dto.baseLng;
    }

    return this.configRepo.save(config);
  }

  /**
   * Get calendar exceptions for a date range
   * Interprets from/to in clinic timezone
   */
  async getExceptions(clinicId: string, from: string, to: string): Promise<ClinicCalendarException[]> {
    const tz = await this.timezoneService.getClinicTimezone(clinicId);
    const { fromUtc, toUtc } = this.timezoneService.getClinicRangeUtc(tz, from, to);

    return this.exceptionRepo.find({
      where: {
        clinicId,
        date: Between(this.timezoneService.toClinicDateKey(tz, fromUtc), this.timezoneService.toClinicDateKey(tz, toUtc)),
      },
      order: { date: 'ASC' },
    });
  }

  /**
   * Create calendar exception
   */
  async createException(clinicId: string, dto: CreateClinicCalendarExceptionDto): Promise<ClinicCalendarException> {
    const type = dto.type as CalendarExceptionType;

    // Validation
    if (type === CalendarExceptionType.CLOSED) {
      if (dto.startTime || dto.endTime) {
        throw new BadRequestException('CLOSED exceptions must not have start/end times');
      }
    } else if (type === CalendarExceptionType.SPECIAL_HOURS) {
      if (!dto.startTime || !dto.endTime) {
        throw new BadRequestException('SPECIAL_HOURS exceptions must have start and end times');
      }
      if (dto.startTime >= dto.endTime) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    // Check unique constraint
    const existing = await this.exceptionRepo.findOne({
      where: { clinicId, date: dto.date },
    });
    if (existing) {
      throw new BadRequestException(`Exception already exists for ${dto.date}`);
    }

    const exception = this.exceptionRepo.create({
      clinicId,
      date: dto.date,
      type,
      startTime: dto.startTime,
      endTime: dto.endTime,
      reason: dto.reason,
    });

    return this.exceptionRepo.save(exception);
  }

  /**
   * Update calendar exception
   */
  async updateException(clinicId: string, exceptionId: string, dto: UpdateClinicCalendarExceptionDto): Promise<ClinicCalendarException> {
    const exception = await this.exceptionRepo.findOne({
      where: { id: exceptionId, clinicId },
    });

    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    // Validation if type changed
    const type = (dto.type as CalendarExceptionType) || exception.type;
    if (type === CalendarExceptionType.CLOSED) {
      if (dto.startTime !== undefined || dto.endTime !== undefined) {
        throw new BadRequestException('CLOSED exceptions must not have start/end times');
      }
    } else if (type === CalendarExceptionType.SPECIAL_HOURS) {
      const startTime = dto.startTime || exception.startTime;
      const endTime = dto.endTime || exception.endTime;
      if (!startTime || !endTime) {
        throw new BadRequestException('SPECIAL_HOURS exceptions must have start and end times');
      }
      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    // Update fields
    if (dto.date) exception.date = dto.date;
    if (dto.type) exception.type = dto.type as CalendarExceptionType;
    if (dto.startTime !== undefined) exception.startTime = dto.startTime;
    if (dto.endTime !== undefined) exception.endTime = dto.endTime;
    if (dto.reason !== undefined) exception.reason = dto.reason;

    return this.exceptionRepo.save(exception);
  }

  /**
   * Delete calendar exception
   */
  async deleteException(clinicId: string, exceptionId: string): Promise<void> {
    const exception = await this.exceptionRepo.findOne({
      where: { id: exceptionId, clinicId },
    });

    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    await this.exceptionRepo.remove(exception);
  }
}
