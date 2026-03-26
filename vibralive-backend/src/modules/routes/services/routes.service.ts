/**
 * Servicio principal de rutas que integra la optimización con el sistema existente.
 * Transforma datos del sistema a formato del optimizer y viceversa.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { RouteOptimizerService } from './route-optimizer.service';
import {
  OptimizationRequest,
  OptimizationResponse,
  RouteAppointment,
  RouteStylist,
  Location,
  TimeWindow,
  StylistWorkSchedule,
  OptimizationConfig,
} from '../dto/route-optimizer.dto';

// Importar entidades existentes del sistema
// Ajusta estas importaciones según tu estructura actual
// import { Appointment } from '../../appointments/entities/appointment.entity';
// import { User } from '../../users/entities/user.entity';
// import { ClientAddress } from '../../addresses/entities/client-address.entity';
// import { GroomerRoute } from '../entities/groomer-route.entity';
// import { GroomerRouteStop } from '../entities/groomer-route-stop.entity';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    private readonly optimizerService: RouteOptimizerService,
    // Inyectar repositorios según necesites
    // @InjectRepository(Appointment)
    // private appointmentsRepository: Repository<Appointment>,
    // @InjectRepository(User)
    // private usersRepository: Repository<User>,
    // @InjectRepository(GroomerRoute)
    // private routesRepository: Repository<GroomerRoute>,
    // @InjectRepository(GroomerRouteStop)
    // private stopsRepository: Repository<GroomerRouteStop>,
  ) {}

  /**
   * Optimiza las rutas para una fecha específica en una clínica.
   *
   * @param clinicId ID de la clínica
   * @param date Fecha a optimizar
   * @param config Configuración opcional del algoritmo
   */
  async optimizeRoutesForDate(
    clinicId: string,
    date: Date,
    config?: Partial<OptimizationConfig>,
  ): Promise<OptimizationResponse> {
    this.logger.log(
      `Starting route optimization for clinic ${clinicId} on ${format(date, 'yyyy-MM-dd')}`,
    );

    // 1. Obtener citas del día que requieren planificación de rutas
    const appointments = await this.getAppointmentsForOptimization(clinicId, date);

    if (appointments.length === 0) {
      this.logger.log('No appointments to optimize');
      return {
        success: true,
        message: 'No hay citas para optimizar',
        routes: [],
        unassigned_appointments: [],
        total_appointments_assigned: 0,
        total_travel_time_minutes: 0,
        total_travel_distance_km: 0,
        solve_time_seconds: 0,
        solver_status: 'NO_APPOINTMENTS',
        algorithm_version: 'v1.0-ortools-vrptw',
      };
    }

    // 2. Obtener estilistas disponibles
    const stylists = await this.getStylistsForOptimization(clinicId, date);

    if (stylists.length === 0) {
      throw new Error('No hay estilistas disponibles para la fecha seleccionada');
    }

    // 3. Construir solicitud de optimización
    const request: OptimizationRequest = {
      clinic_id: clinicId,
      date: date.toISOString(),
      appointments: appointments,
      stylists: stylists,
      config: {
        max_solve_time_seconds: 30,
        allow_unassigned: true,
        ...config,
      },
    };

    // 4. Validar antes de optimizar
    const validation = await this.optimizerService.validate(request);
    if (!validation.valid) {
      throw new Error(validation.error || 'Validación fallida');
    }

    if (validation.warnings && validation.warnings.length > 0) {
      this.logger.warn('Optimization warnings:', validation.warnings);
    }

    // 5. Ejecutar optimización
    const result = await this.optimizerService.optimize(request);

    // 6. Guardar resultados en la base de datos
    if (result.success && result.routes.length > 0) {
      await this.saveOptimizationResults(clinicId, date, result);
    }

    return result;
  }

  /**
   * Obtiene las citas que necesitan ser optimizadas.
   */
  private async getAppointmentsForOptimization(
    clinicId: string,
    date: Date,
  ): Promise<RouteAppointment[]> {
    // TODO: Implementar query real a tu base de datos
    // Ejemplo de cómo sería:
    /*
    const appointments = await this.appointmentsRepository.find({
      where: {
        clinic_id: clinicId,
        scheduled_at: Between(startOfDay(date), endOfDay(date)),
        location_type: 'HOME',
        requires_route_planning: true,
        status: 'CONFIRMED',
      },
      relations: ['client', 'address', 'pet'],
    });

    return appointments.map((appt) => this.mapAppointmentToRouteAppointment(appt));
    */

    // Placeholder - implementa según tu estructura
    this.logger.warn('getAppointmentsForOptimization needs implementation');
    return [];
  }

  /**
   * Obtiene los estilistas disponibles para la fecha.
   */
  private async getStylistsForOptimization(
    clinicId: string,
    date: Date,
  ): Promise<RouteStylist[]> {
    // TODO: Implementar query real a tu base de datos
    // Ejemplo:
    /*
    const groomers = await this.usersRepository.find({
      where: {
        clinic_id: clinicId,
        role: In(['GROOMER', 'STYLIST']),
        status: 'ACTIVE',
      },
      relations: ['availability'],
    });

    return groomers.map((groomer) => this.mapUserToRouteStylist(groomer, date));
    */

    // Placeholder - implementa según tu estructura
    this.logger.warn('getStylistsForOptimization needs implementation');
    return [];
  }

  /**
   * Guarda los resultados de la optimización en la base de datos.
   */
  private async saveOptimizationResults(
    clinicId: string,
    date: Date,
    result: OptimizationResponse,
  ): Promise<void> {
    this.logger.log('Saving optimization results to database');

    // TODO: Implementar guardado según tu estructura de tablas
    // Ejemplo:
    /*
    for (const route of result.routes) {
      // Crear registro de ruta
      const groomerRoute = await this.routesRepository.save({
        clinic_id: clinicId,
        route_date: date,
        groomer_user_id: route.stylist_id,
        status: 'GENERATED',
        total_stops: route.total_stops,
        total_distance_km: route.total_travel_distance_km,
        total_travel_minutes: route.total_travel_time_minutes,
        algorithm_version: result.algorithm_version,
        generated_at: new Date(),
      });

      // Crear paradas
      for (const stop of route.stops) {
        await this.stopsRepository.save({
          route_id: groomerRoute.id,
          appointment_id: stop.appointment_id,
          stop_order: stop.stop_order,
          planned_arrival_time: parseISO(stop.planned_arrival),
          planned_departure_time: parseISO(stop.planned_departure),
          travel_distance_km: stop.travel_distance_km,
          travel_duration_minutes: stop.travel_time_minutes,
        });

        // Actualizar appointment con el estilista asignado
        await this.appointmentsRepository.update(stop.appointment_id, {
          assigned_staff_user_id: route.stylist_id,
        });
      }
    }
    */

    this.logger.warn('saveOptimizationResults needs implementation');
  }

  /**
   * Verifica si el servicio de optimización está disponible.
   */
  async checkOptimizerHealth(): Promise<boolean> {
    return this.optimizerService.healthCheck();
  }

  // ========== HELPERS DE MAPEO ==========

  /**
   * Mapea una cita del sistema al formato del optimizer.
   */
  private mapAppointmentToRouteAppointment(appointment: any): RouteAppointment {
    return {
      id: appointment.id,
      client_id: appointment.client?.id || appointment.client_id,
      client_name: appointment.client?.name,
      pet_name: appointment.pet?.name,
      location: {
        lat: appointment.address?.lat || 0,
        lng: appointment.address?.lng || 0,
        address: appointment.address?.full_address,
      },
      time_window: {
        start: appointment.time_window_start?.toISOString() ||
               appointment.scheduled_at?.toISOString(),
        end: appointment.time_window_end?.toISOString() ||
             new Date(appointment.scheduled_at?.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      },
      duration_minutes: appointment.duration_minutes || 60,
      required_stylist_id: appointment.required_staff_user_id,
      preferred_stylist_id: appointment.preferred_staff_user_id,
      required_skills: appointment.required_skills || [],
    };
  }

  /**
   * Mapea un usuario/groomer del sistema al formato del optimizer.
   */
  private mapUserToRouteStylist(user: any, date: Date): RouteStylist {
    // Obtener horario del día (simplificado - ajustar según tu estructura)
    const schedule = user.availability?.find(
      (a: any) => a.day_of_week === date.getDay(),
    );

    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      start_location: {
        lat: user.clinic?.lat || 0,
        lng: user.clinic?.lng || 0,
        address: user.clinic?.address,
      },
      work_schedule: {
        start_time: schedule?.start_time || '09:00',
        end_time: schedule?.end_time || '18:00',
      },
      max_appointments: user.max_appointments_per_day || 8,
      skills: user.skills || [],
      avg_speed_kmh: 30,
    };
  }
}
