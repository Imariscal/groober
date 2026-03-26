import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject('AuditLogRepository')
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Solo auditar si hay usuario autenticado
    if (!user) {
      return next.handle();
    }

    const startTime = Date.now();
    const method = request.method;
    const path = request.path;

    // Solo auditar mutaciones (POST, PATCH, DELETE, PUT)
    const shouldAudit = ['POST', 'PATCH', 'DELETE', 'PUT'].includes(method);

    if (!shouldAudit) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (data) => {
        try {
          const duration = Date.now() - startTime;
          const clientIp =
            request.headers['x-forwarded-for'] ||
            request.connection.remoteAddress;

          // Extraer información de auditoría
          const auditInfo = this.extractAuditInfo(
            method,
            path,
            request.body,
            data,
          );

          if (auditInfo) {
            await this.auditLogRepository.save({
              actor_id: user.id,
              action: auditInfo.action,
              resource_type: auditInfo.resource_type,
              resource_id: auditInfo.resource_id,
              clinic_id: user.clinic_id || null,
              changes: auditInfo.changes || null,
              impersonation_context: user.impersonation_context || null,
              client_ip: clientIp,
              user_agent: request.headers['user-agent'] || null,
              status: 'SUCCESS',
              duration_ms: duration,
            });
          }
        } catch (error) {
          // No fallar la respuesta si la auditoría falla
          console.error('Audit log error:', error);
        }
      }),
      catchError(async (error) => {
        try {
          const duration = Date.now() - startTime;
          const clientIp =
            request.headers['x-forwarded-for'] ||
            request.connection.remoteAddress;

          const auditInfo = this.extractAuditInfo(
            method,
            path,
            request.body,
            null,
          );

          if (auditInfo) {
            const auditLog = new AuditLog();
            auditLog.actorId = user.id;
            auditLog.actorType = 'clinic_user';
            auditLog.action = auditInfo.action as any;
            auditLog.entityType = auditInfo.resource_type as any;
            auditLog.entityId = auditInfo.resource_id;
            auditLog.metadata = auditInfo.changes || {};
            auditLog.status = 'SUCCESS';
            
            await this.auditLogRepository.save(auditLog);
          }
        } catch (auditError) {
          console.error('Audit error log failed:', auditError);
        }

        throw error;
      }),
    );
  }

  private extractAuditInfo(
    method: string,
    path: string,
    body: any,
    response: any,
  ): any {
    // Platform endpoints
    if (path.includes('/platform/clinics')) {
      if (method === 'POST') {
        return {
          action: 'CREATE',
          resource_type: 'clinic',
          resource_id: response?.id || body?.id || 'unknown',
          changes: {
            before: {},
            after: body,
          },
        };
      }
      if (method === 'PATCH') {
        return {
          action: 'UPDATE',
          resource_type: 'clinic',
          resource_id: path.split('/')[3] || body?.id || 'unknown',
          changes: {
            before: {},
            after: body,
          },
        };
      }
    }

    if (path.includes('/platform/users')) {
      if (method === 'POST') {
        return {
          action: 'CREATE',
          resource_type: 'platform_user',
          resource_id: response?.id || body?.id || 'unknown',
          changes: {
            before: {},
            after: { email: body?.email, full_name: body?.full_name },
          },
        };
      }
    }

    return null;
  }
}
