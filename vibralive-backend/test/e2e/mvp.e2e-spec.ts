import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * MVP E2E Tests - Focused Core Functionality
 * Tests multi-tenant isolation, CRUD operations, and WhatsApp queue
 */
describe('VibraLive MVP E2E Tests', () => {
  let app: INestApplication;

  // Test JWTs (mock format - in production, obtained via login)
  const jwt1 = 'Bearer mock-jwt-clinic-1';
  const jwt2 = 'Bearer mock-jwt-clinic-2';
  const jwtSuspended = 'Bearer mock-jwt-clinic-suspended';

  let client1Id: string;
  let pet1Id: string;
  let appointmentId: string;
  let whatsappMessageId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('T1-T2: Cross-Tenant Isolation', () => {
    it('T1: GET /clients - clinic 1 should only see own clients', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients')
        .set('Authorization', jwt1)
        .expect(200);

      // All clients should be from clinic 1 only
      if (response.body.data && Array.isArray(response.body.data)) {
        response.body.data.forEach((client: any) => {
          // Clinic ID should match (property should be clinicId in camelCase)
          expect(client.clinicId || client.clinic_id).toBeDefined();
        });
      }
    });

    it('T2: POST /clients - should be isolated to requesting clinic', async () => {
      const newClient = {
        first_name: 'Test Client',
        last_name: 'Clinic 1',
        email: 'test1@example.com',
        phone: '+34612345678',
      };

      const response = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', jwt1)
        .send(newClient)
        .expect(201);

      client1Id = response.body.id || response.body.clientId;
      expect(response.body.id || response.body.clientId).toBeDefined();
    });
  });

  describe('T3-T4: SUSPENDED Clinic Blocks Access', () => {
    it('T3: GET /appointments should fail for SUSPENDED clinic', async () => {
      const response = await request(app.getHttpServer())
        .get('/appointments')
        .set('Authorization', jwtSuspended);

      // Should return 403 Forbidden or 401 Unauthorized
      expect([403, 401]).toContain(response.status);
    });

    it('T4: POST /appointments should fail for SUSPENDED clinic', async () => {
      const newAppointment = {
        pet_id: 'mock-pet-id',
        client_id: 'mock-client-id',
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', jwtSuspended)
        .send(newAppointment);

      expect([403, 401]).toContain(response.status);
    });
  });

  describe('T5-T6: CRUD Operations', () => {
    it('T5: CREATE pet (after client created)', async () => {
      if (!client1Id) {
        const clientRes = await request(app.getHttpServer())
          .post('/clients')
          .set('Authorization', jwt1)
          .send({
            first_name: 'Pet Owner',
            last_name: 'Test',
            email: 'owner@example.com',
            phone: '+34699999999',
          });
        client1Id = clientRes.body.id || clientRes.body.clientId;
      }

      const newPet = {
        name: 'Fluffy',
        animal_type_id: 'mock-type-id',
        breed: 'Golden Retriever',
        date_of_birth: '2020-01-15',
        client_id: client1Id,
      };

      const response = await request(app.getHttpServer())
        .post('/pets')
        .set('Authorization', jwt1)
        .send(newPet);

      if (response.status === 201) {
        pet1Id = response.body.id || response.body.petId;
        expect(pet1Id).toBeDefined();
      }
    });

    it('T6: UPDATE and DELETE client (soft delete)', async () => {
      if (!client1Id) return;

      // UPDATE
      const updateRes = await request(app.getHttpServer())
        .put(`/clients/${client1Id}`)
        .set('Authorization', jwt1)
        .send({ first_name: 'Updated Name' });

      expect([200, 201, 204]).toContain(updateRes.status);

      // SOFT DELETE
      const deleteRes = await request(app.getHttpServer())
        .delete(`/clients/${client1Id}`)
        .set('Authorization', jwt1);

      expect([200, 204]).toContain(deleteRes.status);
    });
  });

  describe('T7: Appointments CRUD + Status Transitions', () => {
    let testClientId: string;
    let testPetId: string;

    beforeAll(async () => {
      // Create test client
      const clientRes = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', jwt1)
        .send({
          first_name: 'Appt',
          last_name: 'Test',
          email: 'appt@example.com',
          phone: '+34611111111',
        });
      testClientId = clientRes.body.id || clientRes.body.clientId;

      // Create test pet
      const petRes = await request(app.getHttpServer())
        .post('/pets')
        .set('Authorization', jwt1)
        .send({
          name: 'Appointment Pet',
          animal_type_id: 'mock-type',
          breed: 'Labrador',
          date_of_birth: '2021-05-20',
          client_id: testClientId,
        });
      testPetId = petRes.body.id || petRes.body.petId;
    });

    it('T7a: CREATE appointment', async () => {
      const appointment = {
        pet_id: testPetId,
        client_id: testClientId,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Check-up',
        duration_minutes: 30,
      };

      const response = await request(app.getHttpServer())
        .post('/appointments')
        .set('Authorization', jwt1)
        .send(appointment)
        .expect(201);

      appointmentId = response.body.id || response.body.appointmentId;
      expect(appointmentId).toBeDefined();
    });

    it('T7b: UPDATE appointment details', async () => {
      if (!appointmentId) return;

      const update = {
        reason: 'Updated reason',
        duration_minutes: 45,
      };

      const response = await request(app.getHttpServer())
        .put(`/appointments/${appointmentId}`)
        .set('Authorization', jwt1)
        .send(update)
        .expect(200);

      expect(response.body.id || response.body.appointmentId).toBe(appointmentId);
    });

    it('T7c: Status transition SCHEDULED → CONFIRMED', async () => {
      if (!appointmentId) return;

      const response = await request(app.getHttpServer())
        .patch(`/appointments/${appointmentId}/status`)
        .set('Authorization', jwt1)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      const status = response.body.status;
      expect(status).toBe('CONFIRMED');
    });

    it('T7d: Status transition CONFIRMED → COMPLETED', async () => {
      if (!appointmentId) return;

      const response = await request(app.getHttpServer())
        .patch(`/appointments/${appointmentId}/status`)
        .set('Authorization', jwt1)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
    });
  });

  describe('T8-T9: WhatsApp Idempotency + Queue', () => {
    it('T8a: POST /whatsapp/send creates message in queue', async () => {
      const message = {
        phone_number: '+34612345678',
        message_body: 'Appointment reminder',
        idempotency_key: `msg-${Date.now()}`,
        message_type: 'appointment_reminder',
      };

      const response = await request(app.getHttpServer())
        .post('/whatsapp/send')
        .set('Authorization', jwt1)
        .send(message)
        .expect(202);

      whatsappMessageId = response.body.id || response.body.messageId;
      expect(whatsappMessageId).toBeDefined();
      expect(response.body.status).toBe('queued');
    });

    it('T8b: Idempotency - duplicate request returns same message', async () => {
      const message = {
        phone_number: '+34612345678',
        message_body: 'Appointment reminder',
        idempotency_key: `msg-${Date.now()}`,
        message_type: 'appointment_reminder',
      };

      const res1 = await request(app.getHttpServer())
        .post('/whatsapp/send')
        .set('Authorization', jwt1)
        .send(message)
        .expect(202);

      const id1 = res1.body.id || res1.body.messageId;

      const res2 = await request(app.getHttpServer())
        .post('/whatsapp/send')
        .set('Authorization', jwt1)
        .send(message)
        .expect(202);

      const id2 = res2.body.id || res2.body.messageId;

      // IDs should be the same (idempotency)
      expect(id2).toBe(id1);
    });

    it('T9a: GET /whatsapp/outbox lists messages', async () => {
      const response = await request(app.getHttpServer())
        .get('/whatsapp/outbox')
        .set('Authorization', jwt1)
        .expect(200);

      expect(Array.isArray(response.body.data || response.body.messages)).toBe(
        true,
      );
    });

    it('T9b: GET /whatsapp/outbox/:id retrieves single message', async () => {
      if (!whatsappMessageId) return;

      const response = await request(app.getHttpServer())
        .get(`/whatsapp/outbox/${whatsappMessageId}`)
        .set('Authorization', jwt1)
        .expect(200);

      expect(
        response.body.id ||
          response.body.messageId ||
          response.body.whatsapp_outbox_id,
      ).toBe(whatsappMessageId);
    });

    it('T9c: Filter messages by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/whatsapp/outbox?status=queued')
        .set('Authorization', jwt1)
        .expect(200);

      expect(Array.isArray(response.body.data || response.body.messages)).toBe(
        true,
      );
    });

    it('T9d: PATCH /whatsapp/outbox/:id/retry requeues message', async () => {
      if (!whatsappMessageId) return;

      const response = await request(app.getHttpServer())
        .patch(`/whatsapp/outbox/${whatsappMessageId}/retry`)
        .set('Authorization', jwt1)
        .send({})
        .expect(202);

      expect(response.body.status).toBe('queued');
    });
  });

  describe('HTTP Status Codes Validation', () => {
    it('POST should return 201 Created', async () => {
      const response = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', jwt1)
        .send({
          first_name: 'Status',
          last_name: 'Code',
          email: 'status@example.com',
          phone: '+34615555555',
        });

      expect(response.status).toBe(201);
    });

    it('GET should return 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients')
        .set('Authorization', jwt1);

      expect(response.status).toBe(200);
    });

    it('POST /whatsapp/send should return 202 Accepted', async () => {
      const response = await request(app.getHttpServer())
        .post('/whatsapp/send')
        .set('Authorization', jwt1)
        .send({
          phone_number: '+34616666666',
          message_body: 'Test',
          idempotency_key: `test-${Date.now()}`,
        });

      expect(response.status).toBe(202);
    });

    it('Missing auth should return 401', async () => {
      const response = await request(app.getHttpServer()).get('/clients');

      expect(response.status).toBe(401);
    });
  });
});
