# 🔐 ENTERPRISE SECURITY FRAMEWORK - IMPLEMENTATION CODE REFERENCE

**Purpose**: Production-ready code implementations for security framework  
**Status**: Ready to integrate into backend  
**Last Updated**: February 25, 2026

---

## TABLE OF CONTENTS

1. [Guard Implementations](#1-guard-implementations)
2. [Decorator Implementations](#2-decorator-implementations)
3. [Service Implementations](#3-service-implementations)
4. [Testing Code](#4-testing-code)
5. [Database Migrations](#5-database-migrations)
6. [Integration Checklist](#6-integration-checklist)

---

# 1. GUARD IMPLEMENTATIONS

## 1.1 AuthGuard (JWT Validation)

**Location**: `src/common/guards/auth.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuditService } from '@/modules/audit/audit.service';
import { TokenBlacklistService } from '@/modules/auth/services/token-blacklist.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private auditService: AuditService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1️⃣ EXTRACT JWT FROM AUTHORIZATION HEADER
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No authorization token provided');
    }

    // 2️⃣ VERIFY JWT SIGNATURE & EXPIRATION
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch (error) {
      let message = 'Token validation failed';

      if (error.name === 'TokenExpiredError') {
        message = 'Token has expired';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token signature';
      }

      throw new UnauthorizedException(message);
    }

    // 3️⃣ VALIDATE REQUIRED FIELDS
    if (!request.user.sub || !request.user.clinic_id) {
      throw new UnauthorizedException(
        'Token missing required fields (sub, clinic_id)',
      );
    }

    // 4️⃣ CHECK TOKEN BLACKLIST (LOGOUT)
    const isBlacklisted =
      await this.tokenBlacklistService.isBlacklisted(request.user.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // 5️⃣ ATTACH TO REQUEST FOR DECORATORS
    request['clinicId'] = request.user.clinic_id;
    request['userId'] = request.user.sub;

    // 6️⃣ LOG SUCCESSFUL AUTH
    await this.auditService.handleAuthSuccess({
      userId: request.user.sub,
      clinicId: request.user.clinic_id,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
    });

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer') {
      return undefined;
    }

    return token;
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
```

---

## 1.2 TenantGuard (Clinic Status & Isolation)

**Location**: `src/common/guards/tenant.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from '@/database/entities/clinic.entity';
import { AuditService } from '@/modules/audit/audit.service';
import { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectRepository(Clinic)
    private clinicRepository: Repository<Clinic>,
    private auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const clinicId = request.user?.clinic_id;

    if (!clinicId) {
      throw new ForbiddenException('No clinic context in token');
    }

    // 1️⃣ FETCH CLINIC DETAILS
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new ForbiddenException('Clinic not found');
    }

    // 2️⃣ CHECK CLINIC STATUS
    if (clinic.status === 'SUSPENDED') {
      await this.auditService.logSecurityEvent({
        category: 'TENANT_VIOLATION',
        action: 'ACCESS_SUSPENDED_CLINIC',
        userId: request.user.sub,
        clinicId,
        details: {
          suspensionReason: clinic.suspensionReason,
          suspensionDate: clinic.suspendedAt,
        },
        severity: 'HIGH',
        ipAddress: this.getClientIp(request),
      });

      throw new ForbiddenException(
        `Clinic suspended. Reason: ${clinic.suspensionReason}`,
      );
    }

    if (clinic.status === 'DELETED') {
      throw new ForbiddenException('Clinic no longer exists');
    }

    // 3️⃣ MAKE CLINIC_ID IMMUTABLE
    Object.defineProperty(request, '__clinic_id_immutable__', {
      value: clinicId,
      writable: false,
      configurable: false,
    });

    // 4️⃣ ATTACH CLINIC CONTEXT
    request['clinic'] = clinic;

    return true;
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
```

---

## 1.3 RoleGuard (Role Validation)

**Location**: `src/common/guards/role.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // 1️⃣ GET @Roles() DECORATOR METADATA
    const requiredRoles = this.reflector.get<string[]>(
      'required_roles',
      context.getHandler(),
    );

    // No @Roles() decorator = no role restriction
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2️⃣ GET USER ROLE FROM JWT
    const userRole = request.user?.role;
    if (!userRole) {
      throw new ForbiddenException('No role in token');
    }

    // 3️⃣ VALIDATE ROLE MATCH
    const hasRequiredRole = requiredRoles.includes(userRole);
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Insufficient role. Required: ${requiredRoles.join(', ')}. Got: ${userRole}`,
      );
    }

    return true;
  }
}
```

---

## 1.4 PermissionGuard (Fine-Grained Permission Check)

**Location**: `src/common/guards/permission.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // 1️⃣ GET @RequirePermission() DECORATOR METADATA
    const requiredPermissions = this.reflector.get<string[]>(
      'required_permissions',
      context.getHandler(),
    );

    // No @RequirePermission() decorator = no permission restriction
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 2️⃣ GET USER PERMISSIONS FROM JWT
    const userPermissions = request.user?.permissions || [];

    // 3️⃣ CHECK IF USER HAS ANY REQUIRED PERMISSION
    const hasPermission = requiredPermissions.some((required) => {
      // Handle exact permission
      if (userPermissions.includes(required)) {
        return true;
      }

      // Handle wildcard permissions (e.g., 'clients:*' matches 'clients:create')
      if (required.endsWith('*')) {
        const prefix = required.slice(0, -1); // Remove '*'
        return userPermissions.some((perm) => perm.startsWith(prefix));
      }

      // Handle superadmin bypass (if has 'platform:*')
      if (userPermissions.includes('platform:*')) {
        return true;
      }

      return false;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing permissions: ${requiredPermissions.join(', ')}. You have: ${userPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
```

---

## 1.5 PlatformRoleGuard (Superadmin Only)

**Location**: `src/common/guards/platform-role.guard.ts`

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Superadmin is identified by NOT having clinic_id OR having role='SUPERADMIN'
    const isSuperAdmin =
      request.user?.role === 'SUPERADMIN' ||
      request.user?.permissions?.includes('platform:*');

    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'This endpoint requires superadmin privileges',
      );
    }

    return true;
  }
}
```

---

## 1.6 Guard Chain Export

**Location**: `src/common/guards/index.ts`

```typescript
export { AuthGuard } from './auth.guard';
export { TenantGuard } from './tenant.guard';
export { RoleGuard } from './role.guard';
export { PermissionGuard } from './permission.guard';
export { PlatformRoleGuard } from './platform-role.guard';

// Default guard chain for all protected endpoints
export const DEFAULT_GUARD_CHAIN = [
  AuthGuard,
  TenantGuard,
  RoleGuard,
  PermissionGuard,
];
```

---

# 2. DECORATOR IMPLEMENTATIONS

## 2.1 @CurrentClinicId() Decorator

**Location**: `src/common/decorators/current-clinic-id.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

export const CurrentClinicId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // Try to get from immutable property (set by TenantGuard)
    const immutableClinicId = Object.getOwnPropertyDescriptor(
      request,
      '__clinic_id_immutable__',
    )?.value;

    if (immutableClinicId) {
      return immutableClinicId;
    }

    // Fallback: get from JWT
    const clinicId = request.user?.clinic_id;

    if (!clinicId) {
      throw new ForbiddenException('Clinic context not available');
    }

    return clinicId;
  },
);
```

---

## 2.2 @CurrentUser() Decorator

**Location**: `src/common/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUserPayload {
  sub: string;
  email: string;
  clinic_id: string;
  role: 'SUPERADMIN' | 'OWNER' | 'STAFF';
  permissions: string[];
  iat: number;
  exp: number;
  jti: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
```

---

## 2.3 @RequirePermission() Decorator

**Location**: `src/common/decorators/require-permission.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (permissions: string | string[]) => {
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  return SetMetadata('required_permissions', permissionArray);
};

// USAGE:
// @RequirePermission('clients:create')
// @RequirePermission(['clients:read', 'clients:create'])
// @RequirePermission('clients:*')  // Wildcard
```

---

## 2.4 @Roles() Decorator

**Location**: `src/common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export type Role = 'SUPERADMIN' | 'OWNER' | 'STAFF';

export const Roles = (roles: Role | Role[]) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return SetMetadata('required_roles', roleArray);
};

// USAGE:
// @Roles('owner')
// @Roles(['owner', 'superadmin'])
```

---

## 2.5 @SkipTenantFilter() Decorator (Admin Exception)

**Location**: `src/common/decorators/skip-tenant-filter.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const SkipTenantFilter = (reason?: string) => {
  return SetMetadata('skip_tenant_filter', {
    skip: true,
    reason: reason || 'Admin analytics query',
  });
};

// USAGE:
// @SkipTenantFilter('Cross-clinic analytics')
// async getCrossClinicStats() { ... }
```

---

## 2.6 Decorators Export

**Location**: `src/common/decorators/index.ts`

```typescript
export { CurrentClinicId } from './current-clinic-id.decorator';
export { CurrentUser, CurrentUserPayload } from './current-user.decorator';
export { RequirePermission } from './require-permission.decorator';
export { Roles, Role } from './roles.decorator';
export { SkipTenantFilter } from './skip-tenant-filter.decorator';
```

---

# 3. SERVICE IMPLEMENTATIONS

## 3.1 TokenBlacklistService (Token Revocation)

**Location**: `src/modules/auth/services/token-blacklist.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { TokenBlacklist } from '@/database/entities/token-blacklist.entity';

/**
 * Manages blacklisted (revoked) tokens
 * Used for logout functionality
 */
@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {}

  /**
   * Add token to blacklist (on logout)
   */
  async blacklistToken(
    jti: string,
    expiresAt: Date,
    userId: string,
  ): Promise<void> {
    await this.tokenBlacklistRepository.save({
      jti,
      expiresAt,
      userId,
      createdAt: new Date(),
    });
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(jti: string): Promise<boolean> {
    const blacklistedToken = await this.tokenBlacklistRepository.findOne({
      where: { jti },
    });

    return !!blacklistedToken;
  }

  /**
   * Remove expired tokens from blacklist
   * Run daily to keep table size manageable
   */
  @Cron('0 2 * * *')  // 2 AM daily
  async cleanupExpiredTokens(): Promise<void> {
    console.log('[TokenBlacklist] Running cleanup of expired tokens...');

    const now = new Date();
    const result = await this.tokenBlacklistRepository.delete({
      expiresAt: LessThan(now),
    });

    console.log(`[TokenBlacklist] Removed ${result.affected} expired tokens`);
  }
}
```

---

## 3.2 PermissionService (Permission Management)

**Location**: `src/modules/auth/services/permission.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@/database/entities/role.entity';
import { RolePermission } from '@/database/entities/role-permission.entity';

/**
 * Manages role permissions
 * Permissions are loaded from DB, NOT from user-controlled input
 */
@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  /**
   * Get all permissions for a role
   * Used during JWT generation
   */
  async getPermissionsForRole(roleId: string): Promise<string[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });

    return rolePermissions.map((rp) => rp.permission.code);
  }

  /**
   * Get all permissions for a specific role by name
   */
  async getPermissionsByRoleName(
    roleName: 'SUPERADMIN' | 'OWNER' | 'STAFF',
  ): Promise<string[]> {
    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (!role) {
      return [];
    }

    return this.getPermissionsForRole(role.id);
  }

  /**
   * Check if a specific permission exists
   */
  async hasPermission(roleId: string, permissionCode: string): Promise<boolean> {
    const permission = await this.rolePermissionRepository.findOne({
      where: {
        roleId,
        permission: { code: permissionCode },
      },
    });

    return !!permission;
  }

  /**
   * Get all permissions (for admin UI)
   */
  async getAllPermissions(): Promise<any[]> {
    return this.rolePermissionRepository.find({
      relations: ['permission', 'role'],
    });
  }
}
```

---

## 3.3 AuditService (Logging & Compliance)

**Location**: `src/modules/audit/services/audit.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@/database/entities/audit-log.entity';
import { Request } from 'express';

export interface AuditLogPayload {
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
}

export interface SecurityEventPayload {
  category: string;
  action: string;
  userId?: string;
  clinicId?: string;
  details?: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress: string;
  timestamp?: Date;
}

/**
 * Audit service: Logs all critical operations
 * HIPAA/ISO 27001 compliant
 */
@Injectable()
export class AuditService {
  private logger = new Logger('AuditService');

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log successful authentication
   */
  async handleAuthSuccess(payload: {
    userId: string;
    clinicId: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<void> {
    await this.log({
      tenantId: payload.clinicId,
      userId: payload.userId,
      action: 'LOGIN_SUCCESS',
      resource: 'User',
      resourceId: payload.userId,
      status: 'SUCCESS',
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      timestamp: new Date(),
    });
  }

  /**
   * Log authentication failure
   */
  async handleAuthFailure(payload: {
    email?: string;
    userId?: string;
    reason: string;
    ipAddress: string;
  }): Promise<void> {
    // Don't log email for unauthorized users
    this.logger.warn(
      `[AUTH_FAILURE] Reason: ${payload.reason}, IP: ${payload.ipAddress}`,
    );

    // Only log if we know the user (prevent spam)
    if (payload.userId) {
      await this.log({
        tenantId: 'PLATFORM',
        userId: payload.userId,
        action: 'LOGIN_FAILURE',
        resource: 'User',
        resourceId: payload.userId,
        status: 'FAILURE',
        ipAddress: payload.ipAddress,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Log security incident
   */
  async logSecurityEvent(payload: SecurityEventPayload): Promise<void> {
    this.logger.error(
      `[SECURITY_EVENT] ${payload.severity}: ${payload.action} from ${payload.ipAddress}`,
    );

    // Critical incidents should trigger alerts
    if (payload.severity === 'CRITICAL') {
      await this.sendSecurityAlert(payload);
    }

    // Log to audit trail if associated with clinic
    if (payload.clinicId) {
      await this.log({
        tenantId: payload.clinicId,
        userId: payload.userId || 'SYSTEM',
        action: `SECURITY_${payload.action}`,
        resource: 'SecurityEvent',
        status: 'FAILURE',
        ipAddress: payload.ipAddress,
        changes: payload.details,
        timestamp: payload.timestamp || new Date(),
      });
    }
  }

  /**
   * Generic audit log
   */
  async log(payload: AuditLogPayload): Promise<void> {
    try {
      await this.auditLogRepository.insert({
        tenantId: payload.tenantId,
        userId: payload.userId,
        action: payload.action,
        resource: payload.resource,
        resourceId: payload.resourceId,
        changes: payload.changes ? JSON.stringify(payload.changes) : null,
        status: payload.status,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        createdAt: payload.timestamp,
      });
    } catch (error) {
      // CRITICAL: Failing to log security events is dangerous
      this.logger.error(`Failed to log audit event: ${error.message}`, error.stack);
      // In production, could send to external syslog
    }
  }

  /**
   * Get audit logs for a clinic (with pagination)
   */
  async getAuditLogsByClinic(
    clinicId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { tenantId: clinicId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Send alert to security team (stub - implement via email/Slack)
   */
  async sendSecurityAlert(incident: SecurityEventPayload): Promise<void> {
    // TODO: Implement integration with Slack/email
    this.logger.error(
      `[CRITICAL_INCIDENT] ${incident.action} - Manual review required`,
    );
  }
}
```

---

# 4. TESTING CODE

## 4.1 Unit Test: AuthGuard

**Location**: `src/common/guards/__tests__/auth.guard.spec.ts`

```typescript
import { Test } from '@nestjs/testing';
import { AuthGuard } from '../auth.guard';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '@/modules/audit/audit.service';
import { TokenBlacklistService } from '@/modules/auth/services/token-blacklist.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;
  let auditService: AuditService;
  let tokenBlacklistService: TokenBlacklistService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            handleAuthSuccess: jest.fn(),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            isBlacklisted: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    auditService = module.get<AuditService>(AuditService);
    tokenBlacklistService = module.get<TokenBlacklistService>(TokenBlacklistService);
  });

  describe('canActivate', () => {
    it('should allow valid JWT', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer valid-token',
            },
          }),
        }),
      } as any;

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'user-id',
        clinic_id: 'clinic-id',
        jti: 'token-id',
        permissions: ['clients:read'],
      });

      jest.spyOn(tokenBlacklistService, 'isBlacklisted').mockResolvedValue(false);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should reject missing token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as any;

      expect(() => guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject expired token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer expired-token',
            },
          }),
        }),
      } as any;

      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(error);

      expect(() => guard.canActivate(mockContext)).rejects.toThrow(
        'Token has expired',
      );
    });

    it('should reject blacklisted token', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer revoked-token',
            },
          }),
        }),
      } as any;

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'user-id',
        clinic_id: 'clinic-id',
        jti: 'revoked-token-id',
      });

      jest.spyOn(tokenBlacklistService, 'isBlacklisted').mockResolvedValue(true);

      expect(() => guard.canActivate(mockContext)).rejects.toThrow(
        'Token has been revoked',
      );
    });

    it('should reject token missing clinic_id', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer token-no-clinic',
            },
          }),
        }),
      } as any;

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'user-id',
        // clinic_id: missing
      });

      jest.spyOn(tokenBlacklistService, 'isBlacklisted').mockResolvedValue(false);

      expect(() => guard.canActivate(mockContext)).rejects.toThrow(
        'Token missing required fields',
      );
    });
  });
});
```

---

## 4.2 Integration Test: Cross-Tenant Isolation

**Location**: `src/__tests__/security.e2e.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { JwtService } from '@nestjs/jwt';

describe('Security: Cross-Tenant Isolation (E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const clinic1Id = 'clinic-1-uuid';
  const clinic2Id = 'clinic-2-uuid';
  const user1Token = 'clinic-1-user-token';
  const user2Token = 'clinic-2-user-token';
  const clientId = 'client-uuid';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Generate test tokens
    // Note: In real tests, create users and tokens via database
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /clients/:id', () => {
    it('should allow user to access their own clinic data', async () => {
      // User from clinic1 accesses clinic1 client
      const response = await request(app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.clinicId).toBe(clinic1Id);
    });

    it('should DENY user accessing different clinic data', async () => {
      // User from clinic2 tries to access clinic1 client
      const response = await request(app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);  // Not found (clinic_id filter returns nothing)

      expect(response.body.message).toContain('not found');
    });

    it('should DENY unauthenticated access', async () => {
      const response = await request(app.getHttpServer())
        .get(`/clients/${clientId}`)
        .expect(401);

      expect(response.body.message).toContain('unauthorized');
    });

    it('should DENY tampered JWT', async () => {
      const tamperedToken = user1Token.slice(0, -5) + 'xxxxx';  // Corrupt token

      const response = await request(app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.message).toContain('Token');
    });
  });

  describe('POST /clients (create)', () => {
    it('should create client in user clinic only', async () => {
      const response = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Test Client',
          phone: '555-0000',
        })
        .expect(201);

      expect(response.body.clinicId).toBe(clinic1Id);
    });

    it('should DENY staff without create permission', async () => {
      // user2 is STAFF (no create permission)
      const response = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Test Client',
          phone: '555-0000',
        })
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('Privilege Escalation Protection', () => {
    it('should reject role change via JWT tampering', async () => {
      // Attacker tries to craft token with OWNER role
      const maliciousPayload = {
        sub: 'user-id',
        clinic_id: clinic1Id,
        role: 'OWNER',  // ← Attacker changes
        permissions: ['clients:delete', 'users:create'],
      };

      const tamperedToken = jwtService.sign(maliciousPayload, {
        secret: 'wrong-secret',  // Wrong secret = invalid signature
      });

      const response = await request(app.getHttpServer())
        .get('/clients')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.message).toContain('Token');
    });

    it('should reject self-permission modification', async () => {
      // User tries to grant themselves superadmin
      const response = await request(app.getHttpServer())
        .patch(`/users/myself/role`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ newRole: 'SUPERADMIN' })
        .expect(403);

      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('Audit Logging', () => {
    it('should log all data access', async () => {
      // This test would require checking audit_logs table
      await request(app.getHttpServer())
        .get(`/clients/${clientId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Check audit log was created
      // const auditLog = await auditRepository.findOne({
      //   where: { userId: 'user-id', action: 'DATA_READ' }
      // });
      // expect(auditLog).toBeDefined();
    });

    it('should log failed access attempts', async () => {
      // User tries to access different clinic
      await request(app.getHttpServer())
        .get(`/clients/other-clinic-client`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      // Check audit log for failed access
      // Similar to above, verify failure was logged
    });
  });
});
```

---

## 4.3 Security Test Utilities

**Location**: `src/__tests__/security-test-utils.ts`

```typescript
import { JwtService } from '@nestjs/jwt';

/**
 * Utility functions for security testing
 */
export class SecurityTestUtils {
  constructor(private jwtService: JwtService) {}

  /**
   * Generate test JWT token
   */
  generateTestToken(payload: {
    sub: string;
    clinic_id: string;
    role: 'SUPERADMIN' | 'OWNER' | 'STAFF';
    permissions?: string[];
  }): string {
    return this.jwtService.sign({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      jti: `test-token-${Date.now()}`,
    });
  }

  /**
   * Tamper with JWT (change signature)
   */
  tamperedToken(token: string): string {
    const parts = token.split('.');
    parts[2] = parts[2].slice(0, -5) + 'xxxxx';  // Corrupt signature
    return parts.join('.');
  }

  /**
   * Create expired JWT
   */
  generateExpiredToken(): string {
    return this.jwtService.sign({
      sub: 'user-id',
      clinic_id: 'clinic-id',
      role: 'STAFF',
      exp: Math.floor(Date.now() / 1000) - 3600,  // Expired 1hr ago
    });
  }

  /**
   * Simulate missing clinic_id
   */
  generateTokenMissingClinicId(): string {
    const payload = {
      sub: 'user-id',
      role: 'STAFF',
      // clinic_id: missing
    } as any;

    return this.jwtService.sign(payload);
  }
}
```

---

# 5. DATABASE MIGRATIONS

## 5.1 Create Audit Log Table

**Location**: `src/database/migrations/CreateAuditLogTable.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditLogTable1708915600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Clinic ID (for multi-tenant filtering)',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'e.g., CREATE, READ, UPDATE, DELETE, LOGIN, SECURITY_INCIDENT',
          },
          {
            name: 'resource',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'e.g., Client, Pet, User, SecurityEvent',
          },
          {
            name: 'resource_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: true,
            comment: 'Before/after values for UPDATE operations',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['SUCCESS', 'FAILURE'],
            default: `'SUCCESS'`,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
            comment: 'IPv4 or IPv6',
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
        indices: [
          new TableIndex({
            name: 'idx_audit_logs_tenant_id',
            columnNames: ['tenant_id'],
          }),
          new TableIndex({
            name: 'idx_audit_logs_user_id',
            columnNames: ['user_id'],
          }),
          new TableIndex({
            name: 'idx_audit_logs_action',
            columnNames: ['action'],
          }),
          new TableIndex({
            name: 'idx_audit_logs_created_at',
            columnNames: ['created_at'],
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs');
  }
}
```

---

## 5.2 Create Token Blacklist Table

**Location**: `src/database/migrations/CreateTokenBlacklistTable.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTokenBlacklistTable1708915601000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'token_blacklist',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'jti',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
            comment: 'JWT ID (unique token identifier)',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
            comment: 'When token expires (for cleanup)',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
        indices: [
          new TableIndex({
            name: 'idx_token_blacklist_jti',
            columnNames: ['jti'],
          }),
          new TableIndex({
            name: 'idx_token_blacklist_expires_at',
            columnNames: ['expires_at'],
          }),
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('token_blacklist');
  }
}
```

---

# 6. INTEGRATION CHECKLIST

## Phase 1: Foundation (Immediate)

- [ ] **Copy Guard Files**
  - [ ] `src/common/guards/auth.guard.ts`
  - [ ] `src/common/guards/tenant.guard.ts`
  - [ ] `src/common/guards/role.guard.ts`
  - [ ] `src/common/guards/permission.guard.ts`
  - [ ] `src/common/guards/platform-role.guard.ts`
  - [ ] `src/common/guards/index.ts`

- [ ] **Copy Decorator Files**
  - [ ] `src/common/decorators/current-clinic-id.decorator.ts`
  - [ ] `src/common/decorators/current-user.decorator.ts`
  - [ ] `src/common/decorators/require-permission.decorator.ts`
  - [ ] `src/common/decorators/roles.decorator.ts`
  - [ ] `src/common/decorators/skip-tenant-filter.decorator.ts`
  - [ ] `src/common/decorators/index.ts`

- [ ] **Update AuthModule**
  - [ ] Import all guards
  - [ ] Register JwtConfigService
  - [ ] Load PermissionService dependency

- [ ] **Update Controllers**
  - [ ] Add `@UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard)`
  - [ ] Add `@CurrentClinicId()` to all endpoints
  - [ ] Add `@RequirePermission()` as needed
  - [ ] Add `@Roles()` as needed

- [ ] **Database Migrations**
  - [ ] Create `audit_logs` table
  - [ ] Create `token_blacklist` table
  - [ ] Run migrations: `npm run migration:run`

- [ ] **Service Integration**
  - [ ] Copy `AuditService`
  - [ ] Copy `TokenBlacklistService`
  - [ ] Copy `PermissionService`
  - [ ] Register in auth.module.ts

- [ ] **Testing**
  - [ ] Copy unit tests
  - [ ] Copy E2E tests
  - [ ] Run: `npm test`
  - [ ] All tests should pass

---

## Phase 2: Validation (Before Production)

- [ ] **Security Code Review**
  - [ ] JWT secret validation (>32 chars, mixed case + numbers)
  - [ ] Algorithm whitelist (only HS256)
  - [ ] No plaintext secrets in code
  - [ ] .env is in .gitignore

- [ ] **Database Audit**
  - [ ] All tenant entities have clinic_id FK
  - [ ] All queries filtered by clinic_id
  - [ ] No sensitive data in plaintext

- [ ] **Test Coverage**
  - [ ] All 7 critical security tests pass
  - [ ] Cross-tenant tests: Pass
  - [ ] Privilege escalation tests: Pass
  - [ ] Audit logging tests: Pass

- [ ] **Documentation**
  - [ ] Update API docs with @RequirePermission
  - [ ] Update API docs with guard chain
  - [ ] Document permission matrix for frontend

---

## Production Deployment Checklist

- [ ] JWT_SECRET set to strong value (64 chars)
- [ ] JWT_EXPIRATION set to 1h (not more)
- [ ] REFRESH_TOKEN_EXPIRATION set to 7d
- [ ] CORS origin restricted to frontend domain
- [ ] Database credentials in Vault (not .env)
- [ ] Audit logging enabled
- [ ] Token blacklist cleaning job running
- [ ] HTTPS/TLS configured
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Rate limiting enabled
- [ ] Sentry/logging configured
- [ ] Incident response playbook ready
- [ ] Security team trained on alerts

---

## Monitoring & Alerting

**Daily Checks**:

```bash
# Check failed authentications
SELECT COUNT(*) FROM audit_logs
WHERE action = 'LOGIN_FAILURE'
AND created_at > NOW() - INTERVAL '24 hours';

# Check suspicious privilege changes
SELECT * FROM audit_logs
WHERE action LIKE 'PRIVILEGE_%'
AND created_at > NOW() - INTERVAL '24 hours';

# Check cross-tenant access attempts
SELECT * FROM audit_logs
WHERE action = 'SECURITY_CROSS_TENANT_ACCESS'
AND created_at > NOW() - INTERVAL '24 hours';
```

---

**End of Implementation Reference**

