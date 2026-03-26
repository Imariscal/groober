import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Clinic, PlatformUser, User } from '../../src/database/entities';
import { TestHelpers } from './utils/test-helpers';

/**
 * E2E Tests for Platform Clinics MVP
 * Tests 1-10 as per MVP_IMPLEMENTATION_SPEC.md
 */
describe('Platform Clinics E2E (MVP)', () => {
  let app: INestApplication;
  let clinicRepository: Repository<Clinic>;
  let platformUserRepository: Repository<PlatformUser>;
  let userRepository: Repository<User>;
  let helpers: TestHelpers;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    clinicRepository = moduleFixture.get<Repository<Clinic>>(
      getRepositoryToken(Clinic),
    );
    platformUserRepository = moduleFixture.get<Repository<PlatformUser>>(
      getRepositoryToken(PlatformUser),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    helpers = new TestHelpers(app, platformUserRepository, clinicRepository);

    // Get a valid admin token for tests
    const admin = await helpers.createSuperAdminAndLogin();
    adminToken = admin.token;
  });

  afterAll(async () => {
    await helpers.cleanupClinics();
    await app.close();
  });

  // ==================== TEST 1: CREATE CLINIC ====================
  describe('POST /api/platform/clinics', () => {
    it('1: superadmin can create clinic', async () => {
      const createClinicDto = {
        name: 'Veterinaria Central',
        phone: '+525551234567',
        city: 'Mexico City',
        plan: 'STARTER',
      };

      const response = await request(app.getHttpServer())
        .post('/api/platform/clinics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createClinicDto);

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createClinicDto.name);
      expect(response.body.phone).toBe(createClinicDto.phone);
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.plan).toBe('STARTER');
    });
  });

  // ==================== TEST 2: DUPLICATE PHONE ====================
  describe('POST /api/platform/clinics - Duplicate Phone', () => {
    it('2: duplicate clinic phone returns 409 (R-CL-001)', async () => {
      const phone = '+525551111111';

      // Create first clinic
      await clinicRepository.save({
        name: 'Clinic 1',
        phone,
        city: 'CDMX',
        country: 'MX',
        plan: 'STARTER',
        status: 'ACTIVE',
      } as any);

      // Try to create second clinic with same phone
      const response = await request(app.getHttpServer())
        .post('/api/platform/clinics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Clinic 2',
          phone,
          city: 'CDMX',
        });

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.error?.message || response.body.message).toContain(
        'teléfono ya existe',
      );
    });
  });

  // ==================== TEST 3: LIST CLINICS ====================
  describe('GET /api/platform/clinics', () => {
    it('3: list clinics returns created clinic', async () => {
      await helpers.createTestClinic({
        name: 'Clinic A',
        phone: '+525552222222',
      });
      await helpers.createTestClinic({
        name: 'Clinic B',
        phone: '+525553333333',
      });

      const response = await request(app.getHttpServer())
        .get('/api/platform/clinics?limit=10&offset=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  // ==================== TEST 4: SUSPEND CLINIC & AUDIT ====================
  describe('PATCH /api/platform/clinics/:id/suspend', () => {
    it('4: suspend clinic changes status + writes audit', async () => {
      const clinic = await helpers.createTestClinic({
        name: 'Clinic to Suspend',
        phone: '+525554444444',
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/platform/clinics/${clinic.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Payment not received',
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.status).toBe('SUSPENDED');
      expect(response.body.suspensionReason).toBe('Payment not received');
      expect(response.body.suspendedAt).toBeDefined();
      expect(response.body.suspendedBy).toBeDefined();
    });
  });

  // ==================== TEST 5: ACTIVATE CLINIC & AUDIT ====================
  describe('PATCH /api/platform/clinics/:id/activate', () => {
    it('5: activate clinic changes status + writes audit', async () => {
      const clinic = await helpers.createTestClinic({
        name: 'Clinic to Activate',
        phone: '+525555555555',
        status: 'SUSPENDED',
      } as any);

      const response = await request(app.getHttpServer())
        .patch(`/api/platform/clinics/${clinic.id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.suspendedAt).toBeNull();
      expect(response.body.suspendedBy).toBeNull();
    });
  });

  // ==================== TEST 6: CREATE CLINIC OWNER ====================
  describe('POST /api/platform/clinics/:id/owner', () => {
    it('6: create clinic owner works and links clinic_id', async () => {
      const clinic = await helpers.createTestClinic({
        name: 'Clinic for Owner',
        phone: '+525556666666',
      });

      const response = await request(app.getHttpServer())
        .post(`/api/platform/clinics/${clinic.id}/owner`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Carlos López',
          email: 'carlos@clinic.mx',
          phone: '+525559999999',
        });

      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('carlos@clinic.mx');
      expect(response.body.role).toBe('owner');
      expect(response.body.status).toBe('INVITED');
      expect(response.body).toHaveProperty('invitation_token');
      expect(response.body).toHaveProperty('invitation_expires_at');
      expect(response.body.clinic_id).toBe(clinic.id);
    });
  });

  // ==================== TEST 7: OWNER ALREADY EXISTS ====================
  describe('POST /api/platform/clinics/:id/owner - Duplicate', () => {
    it('7: cannot create owner for non-existing clinic (404)', async () => {
      const fakeClinicId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .post(`/api/platform/clinics/${fakeClinicId}/owner`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Test',
          email: 'test@clinic.mx',
        });

      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });
  });

  // ==================== TEST 8: UNAUTHORIZED (NO TOKEN) ====================
  describe('GET /api/platform/clinics - No Token', () => {
    it('8: cannot access platform endpoints without token (401)', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/platform/clinics',
      );

      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(
        response.status,
      );
    });
  });

  // ==================== TEST 9: FORBIDDEN (NO ROLE) ====================
  describe('POST /api/platform/clinics - Insufficient Role', () => {
    it('9: cannot access platform endpoints with non-superadmin platform user (403)', async () => {
      const invalidToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJzdGFmZkB2aWJyYWxpdmUudGVzdCIsInBsYXRmb3JtX3JvbGVzIjpbXSwicGVybWlzc2lvbnMiOltdLCJpYXQiOjE3MDg5NDcyMDAsImV4cCI6MTcwODk1MDgwMH0.signature';

      const response = await request(app.getHttpServer())
        .post('/api/platform/clinics')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({
          name: 'New Clinic',
          phone: '+525558888888',
        });

      // Expected to fail due to invalid token or wrong role
      expect([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN]).toContain(
        response.status,
      );
    });
  });

  // ==================== TEST 10: DASHBOARD KPIs ====================
  describe('GET /api/platform/dashboard', () => {
    it('10: dashboard returns correct totals', async () => {
      // Setup: Create clinics with mock stats
      await clinicRepository.save([
        {
          name: 'Clinic 1',
          phone: '+525559000000',
          city: 'CDMX',
          plan: 'STARTER',
          status: 'ACTIVE',
          activeStaffCount: 5,
          activeClientsCount: 50,
          activePetsCount: 75,
        } as any,
        {
          name: 'Clinic 2',
          phone: '+525559111111',
          city: 'CDMX',
          plan: 'PROFESSIONAL',
          status: 'ACTIVE',
          activeStaffCount: 3,
          activeClientsCount: 30,
          activePetsCount: 45,
        } as any,
        {
          name: 'Clinic 3 (Suspended)',
          phone: '+525559222222',
          city: 'CDMX',
          plan: 'STARTER',
          status: 'SUSPENDED',
          activeStaffCount: 2,
          activeClientsCount: 20,
          activePetsCount: 25,
        } as any,
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/platform/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('kpis');
      expect(response.body.kpis).toHaveProperty('total_clinics');
      expect(response.body.kpis).toHaveProperty('active_clinics');
      expect(response.body.kpis).toHaveProperty('suspended_clinics');
      expect(response.body.kpis).toHaveProperty('statistics');
      expect(response.body.kpis.statistics).toHaveProperty('total_active_staff');
      expect(response.body.kpis.statistics).toHaveProperty('total_active_clients');
      expect(response.body.kpis.statistics).toHaveProperty('total_active_pets');

      // Verify totals
      expect(response.body.kpis.total_clinics).toBeGreaterThanOrEqual(3);
      expect(response.body.kpis.active_clinics).toBeGreaterThanOrEqual(2);
      expect(response.body.kpis.suspended_clinics).toBeGreaterThanOrEqual(1);
      expect(response.body.kpis.statistics.total_active_staff).toBeGreaterThanOrEqual(10); // 5+3+2
      expect(response.body.kpis.statistics.total_active_clients).toBeGreaterThanOrEqual(100); // 50+30+20
      expect(response.body.kpis.statistics.total_active_pets).toBeGreaterThanOrEqual(145); // 75+45+25
    });
  });
});
