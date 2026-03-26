import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PlatformUser, Clinic } from '../../../src/database/entities';

export class TestHelpers {
  constructor(
    private app: INestApplication,
    private platformUserRepo: Repository<PlatformUser>,
    private clinicRepo: Repository<Clinic>,
  ) {}

  /**
   * Create a test superadmin user and return login token
   * For MVP tests, we use a mock token
   */
  async createSuperAdminAndLogin(): Promise<{
    user: PlatformUser | any;
    token: string;
  }> {
    const testUser: any = {
      id: 'test-superadmin-id',
      email: 'superadmin@vibralive.test',
      full_name: 'Super Admin Test',
      status: 'ACTIVE',
      platform_roles: [{ key: 'PLATFORM_SUPERADMIN', name: 'Platform Superadmin' }],
      permissions: ['clinics:*', 'users:*', 'platform:dashboard'],
    };

    // Mock JWT token for testing
    // Payload: { sub: 'test-superadmin-id', email: 'superadmin@vibralive.test', platform_roles: [...] }
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXN1cGVyYWRtaW4taWQiLCJlbWFpbCI6InN1cGVyYWRtaW5AdmlicmFsaXZlLnRlc3QiLCJwbGF0Zm9ybV9yb2xlcyI6W3sia2V5IjoiUExBVERPUk1fU1VQRVJBRElNIn1dLCJwZXJtaXNzaW9ucyI6WyJjbGluaWNzOioiLCJ1c2VyczoqIiwicGxhdGZvcm06ZGFzaGJvYXJkIl0sImlhdCI6MTcwODk0NzIwMCwiZXhwIjoxNzA4OTUwODAwfQ.signature';

    return { user: testUser, token };
  }

  /**
   * Create a test clinic
   */
  async createTestClinic(overrides?: Partial<Clinic>): Promise<Clinic> {
    const clinic = this.clinicRepo.create({
      name: 'Test Veterinary Clinic',
      phone: '+525551234567',
      city: 'Mexico City',
      country: 'MX',
      plan: 'STARTER',
      status: 'ACTIVE',
      ...overrides,
    });

    return this.clinicRepo.save(clinic);
  }

  /**
   * Clean up test data
   */
  async cleanupClinics(): Promise<void> {
    await this.clinicRepo.delete({});
  }
}
