import { Observable } from 'rxjs';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { TimezoneSynchronizationService } from '@/shared/timezone/timezone-sync.service';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';

/**
 * Interceptor Global que normaliza todas las fechas en requests a UTC
 * Se aplica a TODOS los endpoints del backend
 * 
 * Flujo:
 * 1. Request llega con possible fechas en hora local
 * 2. Interceptor procesa el body y convierte fechas a UTC
 * 3. Request continúa con fechas normalizadas
 * 4. Los servicios garantizan que guardan UTC
 */
@Injectable()
export class UtcNormalizeInterceptor implements NestInterceptor {
  constructor(private readonly tzSync: TimezoneSynchronizationService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const clinicIdHeader = request.headers['x-clinic-id'];
    const clinicId = request.clinicId || clinicIdHeader;

    // Si hay body y clinic ID, normalizar DTOs
    if (request.body && clinicId) {
      try {
        request.body = await this.tzSync.normalizeDto(clinicId, request.body);
        
        // Log para auditoría (comentar en producción si es spam)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[UTC Normalize] POST ${request.path}:`, {
            hasScheduledAt: !!request.body.scheduledAt,
            path: request.path,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[UTC Normalize Error] ${request.path}:`, errorMessage);
        throw error; // Re-throw para que NestJS handle correctamente
      }
    }

    return next.handle();
  }
}
