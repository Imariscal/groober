import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { ClientAddress } from '@/database/entities/client-address.entity';
import { User } from '@/database/entities/user.entity';
import { AppointmentItem } from '@/database/entities/appointment-item.entity';
import {
  CreateAppointmentDto,
  UpdateStatusDto,
  UpdateAppointmentDto,
  UpdateAppointmentServicesDto,
  LocationType,
  AssignmentSource,
  CompleteAppointmentDto,
} from './dtos';
import { PricingService } from '@/modules/pricing/pricing.service';
import { StylistAvailabilityService } from '@/modules/stylists/services/stylist-availability.service';
import { GroomingValidationService } from './services/grooming-validation.service';
import { TimezoneService } from '@/shared/timezone/timezone.service';
import { PreventiveCareService } from '@/modules/preventive-care/services/preventive-care.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepo: AppointmentsRepository,
    @InjectRepository(ClientAddress)
    private readonly addressRepository: Repository<ClientAddress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly pricingService: PricingService,
    private readonly stylistAvailabilityService: StylistAvailabilityService,
    private readonly groomingValidationService: GroomingValidationService,
    private readonly timezoneService: TimezoneService,
    private readonly preventiveCareService: PreventiveCareService,
  ) {}

  async create(clinicId: string, dto: CreateAppointmentDto) {
    // 🎯 FIX: Validar que scheduled_at sea en futuro usando timezone de la clínica
    const scheduledDate = new Date(dto.scheduled_at);
    const clinicTz = await this.timezoneService.getClinicTimezone(clinicId);
    const nowInClinicTz = new Date(); // Server time is fine for "now" comparison since scheduled_at is also absolute UTC
    if (scheduledDate <= nowInClinicTz) {
      throw new BadRequestException(
        'scheduled_at debe ser una fecha futura',
      );
    }

    // Determinar location_type (default CLINIC si no se proporciona)
    const locationType = dto.location_type || LocationType.CLINIC;

    // 🔍 NUEVA VALIDACIÓN: Usar GroomingValidationService para todas las reglas de negocio
    const validationResult = await this.groomingValidationService.validateGroomingAppointment({
      clinicId,
      locationType,
      scheduledAt: scheduledDate,
      durationMinutes: dto.duration_minutes || 30,
      petId: dto.pet_id,
      clientId: dto.client_id,
      addressId: dto.address_id,
      appointmentId: undefined, // New appointment, no existing ID
      assignedStaffUserId: dto.assigned_staff_user_id, // Include stylist assignment
    });

    if (!validationResult.valid) {
      throw new BadRequestException(validationResult.errors.join('; '));
    }

    // Validar address si location_type=HOME
    let addressId: string | undefined = undefined;
    if (locationType === LocationType.HOME) {
      if (!dto.address_id) {
        throw new BadRequestException(
          'address_id es requerido para citas a domicilio (HOME)',
        );
      }

      // Verificar que la dirección existe y pertenece al cliente
      const address = await this.addressRepository.findOne({
        where: {
          id: dto.address_id,
          clinicId,
          clientId: dto.client_id,
        },
      });

      if (!address) {
        throw new BadRequestException(
          'La dirección seleccionada no existe o no pertenece a este cliente',
        );
      }

      addressId = address.id;
    }

    // Aplicar reglas de asignación según location_type (grooming)
    let assignedStaffUserId: string | undefined;
    let assignmentSource: 'NONE' | 'AUTO_ROUTE' | 'MANUAL_RECEPTION' | 'COMPLETED_IN_CLINIC' = AssignmentSource.NONE;
    let assignedAt: Date | null = null;

    if (locationType === LocationType.CLINIC) {
      // CLINIC: No asignar al crear, se captura al completar
      assignedStaffUserId = undefined;
      assignmentSource = AssignmentSource.NONE;
    } else if (locationType === LocationType.HOME) {
      // HOME: Puede asignarse manualmente o más tarde por plan-routes
      if (dto.assigned_staff_user_id) {
        // Validar que el usuario sea staff de la clínica
        const staff = await this.userRepository.findOne({
          where: {
            id: dto.assigned_staff_user_id,
            clinicId,
          },
        });

        if (!staff) {
          throw new BadRequestException(
            'El usuario asignado no pertenece a esta clínica',
          );
        }

        // 🚀 NUEVA VALIDACIÓN: Verificar disponibilidad del estilista
        const appointmentEnd = new Date(scheduledDate);
        appointmentEnd.setMinutes(
          appointmentEnd.getMinutes() + (dto.duration_minutes || 30),
        );

        const availabilityCheck =
          await this.stylistAvailabilityService.canStylistAttendAppointment(
            dto.assigned_staff_user_id,
            scheduledDate,
            appointmentEnd,
          );

        if (!availabilityCheck.available) {
          throw new BadRequestException(
            `El estilista no está disponible: ${availabilityCheck.reason}. Detalles: ${JSON.stringify(availabilityCheck.details)}`,
          );
        }

        assignedStaffUserId = dto.assigned_staff_user_id;
        assignmentSource = AssignmentSource.MANUAL_RECEPTION;
        assignedAt = new Date();
      } else {
        // Dejar para plan-routes
        assignedStaffUserId = undefined;
        assignmentSource = AssignmentSource.NONE;
      }
    }

    const appointment = await this.appointmentsRepo.create({
      clinicId,
      petId: dto.pet_id,
      clientId: dto.client_id,
      scheduledAt: scheduledDate,
      reason: dto.reason,
      durationMinutes: dto.duration_minutes || 30,
      veterinarianId: dto.veterinarian_id,
      status: 'SCHEDULED',
      locationType,
      addressId,
      assignedStaffUserId,
      assignmentSource,
      assignedAt,
      requiresRoutePlanning: locationType === LocationType.HOME,
    });

    return {
      id: appointment.id,
      pet_id: appointment.petId,
      client_id: appointment.clientId,
      status: appointment.status,
      scheduled_at: appointment.scheduledAt,
      location_type: appointment.locationType,
      address_id: appointment.addressId,
      assigned_staff_user_id: appointment.assignedStaffUserId,
      assignment_source: appointment.assignmentSource,
      assigned_at: appointment.assignedAt,
      created_at: appointment.createdAt,
    };
  }

  async findByClinic(
    clinicId: string,
    filters: any = {},
  ) {
    // 🎯 FIX: Convert date filters to UTC ranges using clinic timezone
    // This ensures that 'from: 2026-03-06' means start of day 2026-03-06 in clinic timezone
    const processedFilters = { ...filters };
    
    if (filters.from || filters.to || filters.date_from || filters.date_to) {
      const clinicTz = await this.timezoneService.getClinicTimezone(clinicId);
      
      // Support both 'from/to' and 'date_from/date_to' parameter names
      const fromDate = filters.from || filters.date_from;
      const toDate = filters.to || filters.date_to;
      
      if (fromDate) {
        // Get start of day in clinic timezone, converted to UTC
        const { startUtc } = this.timezoneService.getClinicDayRangeUtc(clinicTz, fromDate);
        processedFilters.date_from = startUtc.toISOString();
        delete processedFilters.from; // Remove duplicate
      }
      
      if (toDate) {
        // Get end of day in clinic timezone, converted to UTC
        const { endUtc } = this.timezoneService.getClinicDayRangeUtc(clinicTz, toDate);
        processedFilters.date_to = endUtc.toISOString();
        delete processedFilters.to; // Remove duplicate
      }
    }
    
    const [appointments, total] = await this.appointmentsRepo.findByClinic(
      clinicId,
      processedFilters,
    );

    return {
      data: appointments.map((a) => ({
        id: a.id,
        pet: { 
          id: a.petId, 
          name: a.pet?.name,
          species: a.pet?.species,
          breed: a.pet?.breed,
          size: a.pet?.size,
          sex: a.pet?.sex,
        },
        client: { 
          id: a.clientId, 
          name: a.client?.name,
          phone: a.client?.phone,
          email: a.client?.email,
        },
        status: a.status,
        scheduled_at: a.scheduledAt,
        reason: a.reason,
        duration_minutes: a.durationMinutes,
        location_type: a.locationType,
        service_type: a.serviceType,
        address_id: a.addressId,
        address: a.address ? { 
          id: a.address.id, 
          label: a.address.label, 
          street: a.address.street,
          neighborhood: a.address.neighborhood,
          city: a.address.city,
          state: a.address.state,
          lat: a.address.lat,
          lng: a.address.lng,
        } : null,
        appointmentItems: a.appointmentItems?.map((item) => ({
          id: item.id,
          serviceId: item.serviceId,
          priceAtBooking: item.priceAtBooking,
          quantity: item.quantity,
          subtotal: item.subtotal,
          service: item.service ? {
            id: item.service.id,
            name: item.service.name,
          } : null,
        })) || [],
        paid: a.paid,
        payment_date: a.paymentDate,
        saleId: a.sales && a.sales.length > 0 ? a.sales[0].id : null,
        assigned_staff_user_id: a.assignedStaffUserId,
        created_at: a.createdAt,
      })),
      total,
      page: filters.page || 1,
    };
  }

  async findOne(clinicId: string, appointmentId: string) {
    const appointment = await this.appointmentsRepo.findByClinicAndId(
      clinicId,
      appointmentId,
    );

    if (!appointment) {
      throw new ForbiddenException(
        'Cita no encontrada en esta clínica',
      );
    }

    return {
      id: appointment.id,
      pet: appointment.pet,
      client: appointment.client,
      status: appointment.status,
      scheduled_at: appointment.scheduledAt,
      reason: appointment.reason,
      notes: appointment.notes,
      veterinarian_id: appointment.veterinarianId,
      duration_minutes: appointment.durationMinutes,
      location_type: appointment.locationType,
      service_type: appointment.serviceType,
      address_id: appointment.addressId,
      address: appointment.address,
      assigned_staff_user_id: appointment.assignedStaffUserId,
      assignment_source: appointment.assignmentSource,
      assigned_at: appointment.assignedAt,
      requires_route_planning: appointment.requiresRoutePlanning,
      cancelled_at: appointment.cancelledAt,
      cancellation_reason: appointment.cancellationReason,
      created_at: appointment.createdAt,
    };
  }

  async update(
    clinicId: string,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ) {
    const appointment = await this.appointmentsRepo.findByClinicAndId(
      clinicId,
      appointmentId,
    );

    if (!appointment) {
      throw new ForbiddenException(
        'Cita no encontrada en esta clínica',
      );
    }

    if (dto.scheduled_at) {
      const newDate = new Date(dto.scheduled_at);
      // 🎯 FIX: Validar fecha futura - la comparación de instantes UTC es correcta
      // porque scheduled_at ya viene como UTC absoluto del frontend
      if (newDate <= new Date()) {
        throw new BadRequestException(
          'scheduled_at debe ser una fecha futura',
        );
      }
      appointment.scheduledAt = newDate;
    }

    if (dto.reason) appointment.reason = dto.reason;
    if (dto.duration_minutes)
      appointment.durationMinutes = dto.duration_minutes;
    if (dto.veterinarian_id)
      appointment.veterinarianId = dto.veterinarian_id;
    if (dto.notes) appointment.notes = dto.notes;

    // Manejo de location_type y address_id
    if (dto.location_type) {
      appointment.locationType = dto.location_type;

      // Si cambia a HOME, validar que hay address_id
      if (
        dto.location_type === LocationType.HOME &&
        !dto.address_id &&
        !appointment.addressId
      ) {
        throw new BadRequestException(
          'address_id es requerido para citas a domicilio',
        );
      }

      // Si cambia a HOME con address_id nuevo, validar
      if (
        dto.location_type === LocationType.HOME &&
        dto.address_id &&
        dto.address_id !== appointment.addressId
      ) {
        const address = await this.addressRepository.findOne({
          where: {
            id: dto.address_id,
            clinicId,
            clientId: appointment.clientId,
          },
        });

        if (!address) {
          throw new BadRequestException(
            'La dirección seleccionada no existe o no pertenece a este cliente',
          );
        }

        appointment.addressId = address.id;
      }

      appointment.requiresRoutePlanning =
        dto.location_type === LocationType.HOME;
    }

    if (
      dto.address_id &&
      dto.address_id !== appointment.addressId
    ) {
      const address = await this.addressRepository.findOne({
        where: {
          id: dto.address_id,
          clinicId,
          clientId: appointment.clientId,
        },
      });

      if (!address) {
        throw new BadRequestException(
          'La dirección seleccionada no existe o no pertenece a este cliente',
        );
      }

      appointment.addressId = address.id;
    }

    if (dto.assigned_staff_user_id)
      appointment.assignedStaffUserId = dto.assigned_staff_user_id;

    // Actualizar status si se proporciona (para reprogramación)
    if (dto.status) {
      appointment.status = dto.status;
    }

    // Actualizar rescheduled_at si se proporciona
    if (dto.rescheduled_at) {
      appointment.rescheduledAt = new Date(dto.rescheduled_at);
    }

    const updated = await this.appointmentsRepo.save(appointment);

    return {
      id: updated.id,
      pet: updated.pet,
      client: updated.client,
      status: updated.status,
      scheduled_at: updated.scheduledAt,
      reason: updated.reason,
      notes: updated.notes,
      veterinarian_id: updated.veterinarianId,
      duration_minutes: updated.durationMinutes,
      location_type: updated.locationType,
      address_id: updated.addressId,
      address: updated.address,
      assigned_staff_user_id: updated.assignedStaffUserId,
      assignment_source: updated.assignmentSource,
      assigned_at: updated.assignedAt,
      requires_route_planning: updated.requiresRoutePlanning,
      cancelled_at: updated.cancelledAt,
      cancellation_reason: updated.cancellationReason,
      created_at: updated.createdAt,
    };
  }

  /**
   * Actualizar servicios de una cita existente (modo EDIT)
   * Solo permite en estado SCHEDULED o CONFIRMED
   * Campos readonly: mascota, cliente, fecha, hora, duración, modalidad
   */
  async updateServices(
    clinicId: string,
    appointmentId: string,
    dto: UpdateAppointmentServicesDto,
  ) {
    const appointment = await this.appointmentsRepo.findByClinicAndId(
      clinicId,
      appointmentId,
    );

    if (!appointment) {
      throw new ForbiddenException(
        'Cita no encontrada en esta clínica',
      );
    }

    // ✅ Solo permitir en SCHEDULED y CONFIRMED
    if (!['SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
      throw new BadRequestException(
        `No puedes editar una cita en estado ${appointment.status}. Solo se permite en SCHEDULED o CONFIRMED`,
      );
    }

    // Actualizar dirección si es HOME y se proporciona
    if (
      dto.address_id &&
      dto.address_id !== appointment.addressId &&
      appointment.locationType === 'HOME'
    ) {
      const address = await this.addressRepository.findOne({
        where: {
          id: dto.address_id,
          clinicId,
          clientId: appointment.clientId,
        },
      });

      if (!address) {
        throw new BadRequestException(
          'La dirección seleccionada no existe o no pertenece a este cliente',
        );
      }

      appointment.addressId = address.id;
    }

    // Actualizar stylist asignado (null = desasignar)
    if (dto.assigned_staff_user_id !== undefined) {
      if (dto.assigned_staff_user_id === null) {
        // Desasignar - usar null para que TypeORM guarde el cambio
        appointment.assignedStaffUserId = null as any;
      } else {
        const staff = await this.userRepository.findOne({
          where: {
            id: dto.assigned_staff_user_id,
            clinicId,
          },
        });

        if (!staff) {
          throw new BadRequestException(
            'El usuario asignado no pertenece a esta clínica',
          );
        }

        appointment.assignedStaffUserId = dto.assigned_staff_user_id;
      }
    }

    // Actualizar servicios usando PricingService si se proporcionan
    if (dto.services && dto.services.length > 0) {
      // El PricingService se encarga de actualizar AppointmentItem
      await this.pricingService.updateAppointmentServices(
        clinicId,
        appointmentId,
        appointment.clientId,
        dto.services.map(s => ({
          serviceId: s.serviceId,
          quantity: s.quantity,
        })),
      );
    }

    // 🔄 AUTO-CALCULATE DURATION: Update duration (custom or auto-calculated)
    // Aplica si:
    // 1. El usuario proporciona una duración personalizada, O
    // 2. Los servicios fueron actualizados (recalcular en base a nuevos servicios)
    if (dto.durationMinutes !== undefined && dto.durationMinutes !== null) {
      // User provided custom duration - use it
      console.log('⏱️ [DURATION] Using custom duration from user:', dto.durationMinutes);
      appointment.durationMinutes = dto.durationMinutes;
    } else if (dto.services && dto.services.length > 0) {
      // Services changed, recalculate duration automatically
      const updatedAppointment = await this.appointmentsRepo.findByClinicAndId(
        clinicId,
        appointmentId,
      );

      if (updatedAppointment && updatedAppointment.appointmentItems && updatedAppointment.appointmentItems.length > 0) {
        const petSize = updatedAppointment.pet?.size || 'M'; // Default to M if unknown
        const calculatedDuration = await this.calculateTotalDuration(
          updatedAppointment.appointmentItems,
          petSize,
        );
        console.log('⏱️ [DURATION] Auto-calculated duration:', calculatedDuration);
        appointment.durationMinutes = calculatedDuration;
      }
    }

    // Guardar cambios en appointment (dirección, stylist, duración recalculada)
    const updated = await this.appointmentsRepo.save(appointment);

    return {
      id: updated.id,
      pet: updated.pet,
      client: updated.client,
      status: updated.status,
      scheduled_at: updated.scheduledAt,
      reason: updated.reason,
      notes: updated.notes,
      veterinarian_id: updated.veterinarianId,
      duration_minutes: updated.durationMinutes,
      location_type: updated.locationType,
      address_id: updated.addressId,
      address: updated.address,
      assigned_staff_user_id: updated.assignedStaffUserId,
      assignment_source: updated.assignmentSource,
      assigned_at: updated.assignedAt,
      requires_route_planning: updated.requiresRoutePlanning,
      cancelled_at: updated.cancelledAt,
      cancellation_reason: updated.cancellationReason,
      created_at: updated.createdAt,
    };
  }

  async updateStatus(
    clinicId: string,
    appointmentId: string,
    dto: UpdateStatusDto,
    userId: string,
  ) {
    const appointment = await this.appointmentsRepo.findByClinicAndId(
      clinicId,
      appointmentId,
    );

    if (!appointment) {
      throw new ForbiddenException(
        'Cita no encontrada en esta clínica',
      );
    }

    const oldStatus = appointment.status;

    appointment.status = dto.status;

    if (dto.status === 'CANCELLED') {
      appointment.cancelledAt = new Date();
      appointment.cancelledBy = userId;
      appointment.cancellationReason =
        dto.cancellation_reason || 'Sin especificar';
    }

    const updated = await this.appointmentsRepo.save(appointment);

    return {
      id: updated.id,
      pet: updated.pet,
      client: updated.client,
      status: updated.status,
      scheduled_at: updated.scheduledAt,
      reason: updated.reason,
      notes: updated.notes,
      veterinarian_id: updated.veterinarianId,
      duration_minutes: updated.durationMinutes,
      location_type: updated.locationType,
      address_id: updated.addressId,
      address: updated.address,
      assigned_staff_user_id: updated.assignedStaffUserId,
      assignment_source: updated.assignmentSource,
      assigned_at: updated.assignedAt,
      requires_route_planning: updated.requiresRoutePlanning,
      cancelled_at: updated.cancelledAt,
      cancellation_reason: updated.cancellationReason,
      created_at: updated.createdAt,
    };
  }

  async planHomeGroomingRoutes(
    clinicId: string,
    date?: string,
  ) {
    // Determine date (default to today)
    const targetDate = date
      ? new Date(date)
      : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find HOME grooming appointments for the date with no assignment
    const appointments = await this.appointmentsRepo.findHomeGroomingForRoute(
      clinicId,
      targetDate,
      nextDay,
    );

    if (appointments.length === 0) {
      return {
        success: true,
        data: { plannedCount: 0, assigned: [] },
      };
    }

    // Get available stylist staff (basic: just get first available, can be improved later)
    const stylists = await this.appointmentsRepo.getAvailableStylists(clinicId);

    if (stylists.length === 0) {
      throw new BadRequestException(
        'No hay estilistas disponibles en la clínica',
      );
    }

    const assigned = [];
    let stylistIndex = 0;

    // Assign appointments to stylists (round-robin)
    for (const apt of appointments) {
      if (apt.assignedStaffUserId || apt.assignmentSource !== AssignmentSource.NONE) {
        continue; // Skip already assigned
      }

      const stylist = stylists[stylistIndex % stylists.length];

      apt.assignedStaffUserId = stylist.id;
      apt.assignmentSource = AssignmentSource.AUTO_ROUTE;
      apt.assignedAt = new Date();

      await this.appointmentsRepo.save(apt);

      assigned.push({
        appointmentId: apt.id,
        stylistUserId: stylist.id,
      });

      stylistIndex++;
    }

    return {
      success: true,
      data: { plannedCount: assigned.length, assigned },
    };
  }

  async complete(
    clinicId: string,
    appointmentId: string,
    dto: CompleteAppointmentDto,
  ) {
    const appointment = await this.appointmentsRepo.findByClinicAndId(
      clinicId,
      appointmentId,
    );

    if (!appointment) {
      throw new ForbiddenException(
        'Cita no encontrada en esta clínica',
      );
    }

    // Set status to COMPLETED
    appointment.status = 'COMPLETED';

    // Trigger preventive care event creation for medical appointments
    if (appointment.serviceType === 'MEDICAL') {
      try {
        await this.preventiveCareService.createFromCompletedAppointment(appointment.id);
      } catch (error) {
        // Log error but don't fail the appointment completion
        console.error('Error creating preventive care event:', error);
      }
    }

    /// Grooming CLINIC: require performed_by_user_id and set as assigned
    if (appointment.locationType === LocationType.CLINIC) {
      if (!dto.performed_by_user_id) {
        throw new BadRequestException(
          'performed_by_user_id es requerido para completar citas en clínica',
        );
      }

      // Validate user exists in clinic
      const performer = await this.userRepository.findOne({
        where: {
          id: dto.performed_by_user_id,
          clinicId,
        },
      });

      if (!performer) {
        throw new BadRequestException(
          'El usuario que realizó la cita no pertenece a esta clínica',
        );
      }

      if (!appointment.assignedStaffUserId) {
        appointment.assignedStaffUserId = dto.performed_by_user_id;
        appointment.assignmentSource = AssignmentSource.COMPLETED_IN_CLINIC;
        appointment.assignedAt = new Date();
      }
    } else if (appointment.locationType === LocationType.HOME && dto.performed_by_user_id) {
      // HOME: performer_by_user_id is optional, but if provided, can update
      const performer = await this.userRepository.findOne({
        where: {
          id: dto.performed_by_user_id,
          clinicId,
        },
      });

      if (!performer) {
        throw new BadRequestException(
          'El usuario que realizó la cita no pertenece a esta clínica',
        );
      }

      // Can override if came from different source
      if (appointment.assignedStaffUserId !== dto.performed_by_user_id) {
        appointment.assignedStaffUserId = dto.performed_by_user_id;
      }
    }

    const completed = await this.appointmentsRepo.save(appointment);

    return {
      id: completed.id,
      pet: completed.pet,
      client: completed.client,
      status: completed.status,
      scheduled_at: completed.scheduledAt,
      reason: completed.reason,
      notes: completed.notes,
      veterinarian_id: completed.veterinarianId,
      duration_minutes: completed.durationMinutes,
      location_type: completed.locationType,
      address_id: completed.addressId,
      address: completed.address,
      assigned_staff_user_id: completed.assignedStaffUserId,
      assignment_source: completed.assignmentSource,
      assigned_at: completed.assignedAt,
      requires_route_planning: completed.requiresRoutePlanning,
      cancelled_at: completed.cancelledAt,
      cancellation_reason: completed.cancellationReason,
      created_at: completed.createdAt,
    };
  }

  /**
   * Obtener estilistas disponibles para una cita en un horario específico
   * Útil para el UI cuando se está creando una cita para mostrar opciones disponibles
   */
  async getAvailableStylistsForAppointment(
    clinicId: string,
    appointmentStart: string,
    appointmentEnd: string,
  ) {
    const start = new Date(appointmentStart);
    const end = new Date(appointmentEnd);

    const availableSlots =
      await this.stylistAvailabilityService.getAvailableStylists(
        clinicId,
        start,
        end,
      );

    return {
      appointment_start: appointmentStart,
      appointment_end: appointmentEnd,
      available_stylists: availableSlots.filter((s) => s.available),
      unavailable_stylists: availableSlots.filter((s) => !s.available),
      total_available: availableSlots.filter((s) => s.available).length,
      total_unavailable: availableSlots.filter((s) => !s.available).length,
    };
  }

  /**
   * Calcular duración total de una cita basada en los servicios y tamaño de mascota
   * 
   * LÓGICA:
   * 1. Por cada servicio en la cita, usa defaultDurationMinutes
   * 2. Multiplica por la cantidad del servicio
   * 3. Suma todas las duraciones
   * 
   * NOTA: Para duraciones específicas por tamaño, se necesitaría hacer queries adicionales
   * a ServiceSizePrice. Por ahora usamos el defaultDurationMinutes del servicio.
   * 
   * @param appointmentItems - Items de la cita con servicios
   * @param petSize - Tamaño de la mascota (XS, S, M, L, XL) para logging
   * @returns Duración total en minutos
   * 
   * @example
   * Service 1: Baño (default 15 min) × 1 = 15 min
   * Service 2: Corte (default 20 min) × 1 = 20 min
   * Service 3: Uñas (default 3 min) × 2 = 6 min
   * Total: 41 min
   */
  private async calculateTotalDuration(
    appointmentItems: AppointmentItem[],
    petSize: string,
  ): Promise<number> {
    if (!appointmentItems || appointmentItems.length === 0) {
      return 30; // Default duration if no items
    }

    let totalDuration = 0;

    for (const item of appointmentItems) {
      if (!item.service) {
        // Default to 30 min if service not loaded
        console.warn(`⚠️ Service not loaded for item ${item.id}, using default 30 min`);
        totalDuration += 30;
        continue;
      }

      let itemDuration = item.service.defaultDurationMinutes || 30; // Default to service's default duration
      
      console.log(`✅ Item ${item.id} (${item.service.name}): ${itemDuration} min (petSize: ${petSize})`);

      // Sum duration for each service (quantity = número de veces este servicio)
      const serviceDuration = itemDuration * (item.quantity || 1);
      totalDuration += serviceDuration;
      
      if (item.quantity && item.quantity > 1) {
        console.log(`📊 Item ${item.id}: ${itemDuration} min x ${item.quantity} unidades = ${serviceDuration} min`);
      }
    }

    console.log(`🎯 DURACIÓN TOTAL CALCULADA: ${totalDuration} minutos (para mascota tamaño ${petSize})`);
    return totalDuration;
  }
}
