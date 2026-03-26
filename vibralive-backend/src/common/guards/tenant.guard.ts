import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from '@/database/entities';

/**
 * TenantGuard: Validates that the clinic (tenant) is ACTIVE
 * Extracts clinic_id from JWT payload and ensures clinic is not SUSPENDED/DELETED
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.clinic_id) {
      throw new ForbiddenException('No clinic_id in JWT payload');
    }

    // Validate clinic exists and is ACTIVE
    const clinic = await this.clinicRepository.findOne({
      where: { id: user.clinic_id },
    });

    if (!clinic) {
      throw new ForbiddenException(`Clinic ${user.clinic_id} not found`);
    }

    if (clinic.status !== 'ACTIVE') {
      throw new ForbiddenException(
        `Clinic is ${clinic.status}. Only ACTIVE clinics can access this resource.`,
      );
    }

    // Store clinic in request for later use
    request.clinicId = clinic.id;
    request.clinic = clinic;

    return true;
  }
}
