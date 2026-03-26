/**
 * Servicio cliente para comunicarse con el microservicio de optimización de rutas.
 * Este servicio actúa como un adaptador entre NestJS y el microservicio Python.
 */

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  OptimizationRequest,
  OptimizationResponse,
  ValidationResponse,
  OptimizationConfig,
} from '../dto/route-optimizer.dto';

@Injectable()
export class RouteOptimizerService {
  private readonly logger = new Logger(RouteOptimizerService.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'ROUTE_OPTIMIZER_URL',
      'http://localhost:8001',
    );

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60 segundos para optimizaciones largas
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`Route Optimizer client initialized: ${this.baseUrl}`);
  }

  /**
   * Verifica si el servicio de optimización está disponible.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data?.status === 'healthy';
    } catch (error) {
      this.logger.warn('Route optimizer service is not available');
      return false;
    }
  }

  /**
   * Optimiza las rutas de citas para los estilistas.
   *
   * @param request Solicitud con citas, estilistas y configuración
   * @returns Rutas optimizadas
   */
  async optimize(request: OptimizationRequest): Promise<OptimizationResponse> {
    this.logger.log(
      `Optimizing routes for ${request.appointments.length} appointments and ${request.stylists.length} stylists`,
    );

    try {
      const response = await this.client.post<OptimizationResponse>(
        '/optimize',
        request,
      );

      this.logger.log(
        `Optimization completed: ${response.data.total_appointments_assigned} assigned, ` +
          `${response.data.unassigned_appointments.length} unassigned`,
      );

      return response.data;
    } catch (error) {
      this.handleError(error, 'optimize');
    }
  }

  /**
   * Valida una solicitud de optimización sin ejecutar el solver.
   *
   * @param request Solicitud a validar
   * @returns Resultado de la validación
   */
  async validate(request: OptimizationRequest): Promise<ValidationResponse> {
    try {
      const response = await this.client.post<ValidationResponse>(
        '/optimize/validate',
        request,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'validate');
    }
  }

  /**
   * Obtiene la configuración por defecto del optimizador.
   */
  async getConfigDefaults(): Promise<{
    first_solution_strategies: string[];
    local_search_metaheuristics: string[];
    defaults: OptimizationConfig;
  }> {
    try {
      const response = await this.client.get('/config/defaults');
      return response.data;
    } catch (error) {
      this.handleError(error, 'getConfigDefaults');
    }
  }

  /**
   * Obtiene un ejemplo de solicitud de optimización.
   */
  async getExample(): Promise<OptimizationRequest> {
    try {
      const response = await this.client.get<OptimizationRequest>('/example');
      return response.data;
    } catch (error) {
      this.handleError(error, 'getExample');
    }
  }

  /**
   * Maneja errores de la comunicación con el microservicio.
   */
  private handleError(error: unknown, operation: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNREFUSED') {
        this.logger.error(
          `Route optimizer service is not available at ${this.baseUrl}`,
        );
        throw new HttpException(
          'Servicio de optimización no disponible. Por favor intente más tarde.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        this.logger.error(
          `Route optimizer error [${operation}]: ${status} - ${JSON.stringify(data)}`,
        );

        throw new HttpException(
          data?.detail || data?.message || 'Error en el servicio de optimización',
          status,
        );
      }

      if (axiosError.code === 'ETIMEDOUT') {
        throw new HttpException(
          'La optimización tomó demasiado tiempo. Intente con menos citas o aumente el tiempo límite.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }
    }

    this.logger.error(`Unexpected error in route optimizer [${operation}]:`, error);
    throw new HttpException(
      'Error inesperado en el servicio de optimización',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
