# 🎯 ACTION PLAN - MVP Ejecución Step-by-Step

**Objetivo:** Implementar Appointments + WhatsApp Outbox en 5 sprints de ~3 horas c/u  
**Audiencia:** Equipo de desarrollo (backend)  

---

## 📋 SPRINT 0: Setup (30 minutos)

### Tarea 0.1: Crear entities (Appointment + WhatsAppOutbox)

**Archivo:** `vibralive-backend/src/database/entities/appointment.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Pet } from './pet.entity';
import { Client } from './client.entity';

@Entity('appointments')
@Index(['clinic_id', 'status'])
@Index(['clinic_id', 'scheduled_at'])
@Index(['clinic_id', 'created_at'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId: string;

  @Column({ type: 'timestamp', name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'SCHEDULED',
  })
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'duration_minutes',
  })
  durationMinutes: number;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'veterinarian_id',
  })
  veterinarianId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'cancelled_at',
  })
  cancelledAt: Date | null;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'cancelled_by',
  })
  cancelledBy: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'cancellation_reason',
  })
  cancellationReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @ManyToOne(() => Pet, (pet) => pet.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Client, (client) => client.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;
}
```

**Archivo:** `vibralive-backend/src/database/entities/whatsapp-outbox.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Client } from './client.entity';

@Entity('whatsapp_outbox')
@Index(['clinic_id', 'status'])
@Index(['clinic_id', 'created_at'])
@Index(['idempotency_key'])
@Index(['retry_count', 'status'])
export class WhatsAppOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId: string;

  @Column({ type: 'uuid', nullable: true, name: 'client_id' })
  clientId: string | null;

  @Column({ type: 'varchar', length: 20, name: 'phone_number' })
  phoneNumber: string;

  @Column({ type: 'text', name: 'message_body' })
  messageBody: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'queued',
  })
  status: 'queued' | 'sent' | 'failed' | 'delivered';

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
    name: 'idempotency_key',
  })
  idempotencyKey: string | null;

  @Column({
    type: 'integer',
    default: 0,
    name: 'retry_count',
  })
  retryCount: number;

  @Column({
    type: 'integer',
    default: 5,
    name: 'max_retries',
  })
  maxRetries: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_retry_at',
  })
  lastRetryAt: Date | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'provider_message_id',
  })
  providerMessageId: string | null;

  @Column({
    type: 'text',
    nullable: true,
    name: 'provider_error',
  })
  providerError: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'whatsapp',
  })
  channel: 'whatsapp' | 'sms' | 'telegram';

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'message_type',
  })
  messageType: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'sent_at',
  })
  sentAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.whatsappMessages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @ManyToOne(() => Client, (client) => client.whatsappMessages, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client | null;
}
```

**Archivo:** Actualizar `vibralive-backend/src/database/entities/index.ts`

```typescript
export { Appointment } from './appointment.entity';
export { WhatsAppOutbox } from './whatsapp-outbox.entity';
// ... existing exports
```

### Tarea 0.2: Crear migration

```bash
# En terminal, dentro carpeta backend:
npm run typeorm migration:generate -- -n CreateAppointmentAndWhatsApp
```

Luego editar el archivo generado para asegurar índices:

```typescript
// migrations/1708...CreateAppointmentAndWhatsApp.ts
public async up(queryRunner: QueryRunner): Promise<void> {
  // Appointments
  await queryRunner.createTable(
    new Table({
      name: 'appointments',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
        { name: 'clinic_id', type: 'uuid' },
        { name: 'pet_id', type: 'uuid' },
        { name: 'client_id', type: 'uuid' },
        { name: 'scheduled_at', type: 'timestamp' },
        { name: 'status', type: 'varchar', length: 50, default: "'SCHEDULED'" },
        // ... rest campos
      ],
      foreignKeys: [
        { columnNames: ['clinic_id'], referencedTableName: 'clinics', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
        { columnNames: ['pet_id'], referencedTableName: 'pets', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
        { columnNames: ['client_id'], referencedTableName: 'clients', referencedColumnNames: ['id'], onDelete: 'CASCADE' },
      ],
    }),
    true,
  );
  // + indices
}
```

---

## 🏗️ SPRINT 1: Appointments Módulo (3 horas)

### Tarea 1.1: Crear DTOs

**Archivo:** `vibralive-backend/src/modules/appointments/dtos/create-appointment.dto.ts`

```typescript
import {
  IsUUID,
  IsISO8601,
  IsOptional,
  IsString,
  IsInt,
  Length,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  pet_id: string;

  @IsUUID()
  client_id: string;

  @IsISO8601()
  scheduled_at: string; // ISO 8601 format

  @IsOptional()
  @IsString()
  @Length(1, 255)
  reason?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  duration_minutes?: number;

  @IsOptional()
  @IsUUID()
  veterinarian_id?: string;
}
```

**Archivo:** `vibralive-backend/src/modules/appointments/dtos/update-appointment.dto.ts`

```typescript
import {
  IsOptional,
  IsISO8601,
  IsString,
  IsInt,
  Length,
  Min,
  IsUUID,
} from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsISO8601()
  scheduled_at?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  reason?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  duration_minutes?: number;

  @IsOptional()
  @IsUUID()
  veterinarian_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**Archivo:** `vibralive-backend/src/modules/appointments/dtos/update-status.dto.ts`

```typescript
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  cancellation_reason?: string;
}
```

**Archivo:** `vibralive-backend/src/modules/appointments/dtos/index.ts`

```typescript
export * from './create-appointment.dto';
export * from './update-appointment.dto';
export * from './update-status.dto';
```

### Tarea 1.2: Crear Repository

**Archivo:** `vibralive-backend/src/modules/appointments/repositories/appointments.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Appointment } from '../../../database/entities/appointment.entity';

@Injectable()
export class AppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  async create(data: Partial<Appointment>): Promise<Appointment> {
    return this.repo.save(this.repo.create(data));
  }

  async findByClinic(
    clinicId: string,
    filters: {
      status?: string;
      client_id?: string;
      pet_id?: string;
      date_from?: string;
      date_to?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<[Appointment[], number]> {
    const query = this.repo
      .createQueryBuilder('a')
      .where('a.clinicId = :clinicId', { clinicId });

    if (filters.status) {
      query.andWhere('a.status = :status', { status: filters.status });
    }
    if (filters.client_id) {
      query.andWhere('a.clientId = :clientId', { clientId: filters.client_id });
    }
    if (filters.pet_id) {
      query.andWhere('a.petId = :petId', { petId: filters.pet_id });
    }
    if (filters.date_from) {
      query.andWhere('a.scheduledAt >= :dateFrom', {
        dateFrom: new Date(filters.date_from),
      });
    }
    if (filters.date_to) {
      query.andWhere('a.scheduledAt <= :dateTo', {
        dateTo: new Date(filters.date_to),
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('a.scheduledAt', 'ASC');

    return query.getManyAndCount();
  }

  async findByClinicAndId(
    clinicId: string,
    appointmentId: string,
  ): Promise<Appointment | null> {
    return this.repo.findOne({
      where: { clinicId, id: appointmentId },
      relations: ['pet', 'client'],
    });
  }

  async save(appointment: Appointment): Promise<Appointment> {
    return this.repo.save(appointment);
  }

  async findById(appointmentId: string): Promise<Appointment | null> {
    return this.repo.findOne({ where: { id: appointmentId } });
  }
}
```

### Tarea 1.3: Crear Service

**Archivo:** `vibralive-backend/src/modules/appointments/appointments.service.ts`

```typescript
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { CreateAppointmentDto, UpdateStatusDto } from './dtos';
import { UpdateAppointmentDto } from './dtos/update-appointment.dto';
// Assuming AuditLogService exists
// import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepo: AppointmentsRepository,
    // private readonly auditLog: AuditLogService,
  ) {}

  async create(clinicId: string, dto: CreateAppointmentDto) {
    // Validar que scheduled_at sea en futuro
    const scheduledDate = new Date(dto.scheduled_at);
    if (scheduledDate <= new Date()) {
      throw new BadRequestException(
        'scheduled_at debe ser una fecha futura',
      );
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
    });

    return {
      id: appointment.id,
      pet_id: appointment.petId,
      client_id: appointment.clientId,
      status: appointment.status,
      scheduled_at: appointment.scheduledAt,
      created_at: appointment.createdAt,
    };
  }

  async findByClinic(
    clinicId: string,
    filters: any = {},
  ) {
    const [appointments, total] = await this.appointmentsRepo.findByClinic(
      clinicId,
      filters,
    );

    return {
      data: appointments.map((a) => ({
        id: a.id,
        pet: { id: a.petId, name: a.pet?.name },
        client: { id: a.clientId, name: a.client?.name },
        status: a.status,
        scheduled_at: a.scheduledAt,
        reason: a.reason,
        duration_minutes: a.durationMinutes,
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

    const updated = await this.appointmentsRepo.save(appointment);

    return {
      id: updated.id,
      status: updated.status,
      scheduled_at: updated.scheduledAt,
      updated_at: updated.updatedAt,
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

    // TODO: AuditLog
    // await this.auditLog.create({
    //   clinic_id: clinicId,
    //   actor_id: userId,
    //   action: 'UPDATE',
    //   resource_type: 'appointment',
    //   resource_id: appointmentId,
    //   changes: {
    //     before: { status: oldStatus },
    //     after: { status: dto.status },
    //   },
    // });

    return {
      id: updated.id,
      status: updated.status,
      cancelled_at: updated.cancelledAt,
      updated_at: updated.updatedAt,
    };
  }
}
```

### Tarea 1.4: Crear Controller

**Archivo:** `vibralive-backend/src/modules/appointments/appointments.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentClinicId } from '../../common/decorators/current-clinic.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateStatusDto,
  UpdateAppointmentDto,
} from './dtos';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(201)
  async create(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(clinicId, dto);
  }

  @Get()
  async findAll(
    @CurrentClinicId() clinicId: string,
    @Query() filters: any,
  ) {
    return this.appointmentsService.findByClinic(clinicId, filters);
  }

  @Get(':id')
  async findOne(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
  ) {
    return this.appointmentsService.findOne(clinicId, appointmentId);
  }

  @Put(':id')
  async update(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(clinicId, appointmentId, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(
      clinicId,
      appointmentId,
      dto,
      user.id,
    );
  }
}
```

### Tarea 1.5: Crear Module

**Archivo:** `vibralive-backend/src/modules/appointments/appointments.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { Appointment } from '../../database/entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
```

### Tarea 1.6: Registrar en AppModule

**Archivo:** `vibralive-backend/src/app.module.ts` (actualizar imports)

```typescript
import { AppointmentsModule } from './modules/appointments/appointments.module';

@Module({
  imports: [
    // ... existing imports
    AppointmentsModule,
  ],
  // ...
})
export class AppModule {}
```

---

## 💬 SPRINT 2: WhatsApp Módulo (3 horas)

### Tarea 2.1: Crear DTOs

**Archivo:** `vibralive-backend/src/modules/whatsapp/dtos/send-message.dto.ts`

```typescript
import {
  IsPhoneNumber,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Length,
  IsEnum,
} from 'class-validator';

export enum MessageType {
  REMINDER = 'reminder',
  CONFIRMATION = 'confirmation',
  NOTIFICATION = 'notification',
  CUSTOM = 'custom',
}

export class SendMessageDto {
  @IsPhoneNumber('MX')
  phone_number: string; // E.164: +525512345678

  @IsNotEmpty()
  @Length(1, 4096)
  message_body: string;

  @IsOptional()
  @IsUUID()
  client_id?: string;

  @IsOptional()
  @Length(1, 255)
  idempotency_key?: string;

  @IsOptional()
  @IsEnum(MessageType)
  message_type?: MessageType;
}
```

**Archivo:** `vibralive-backend/src/modules/whatsapp/dtos/index.ts`

```typescript
export * from './send-message.dto';
```

### Tarea 2.2: Crear Repository

**Archivo:** `vibralive-backend/src/modules/whatsapp/repositories/whatsapp-outbox.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WhatsAppOutbox } from '../../../database/entities/whatsapp-outbox.entity';

@Injectable()
export class WhatsAppOutboxRepository {
  constructor(
    @InjectRepository(WhatsAppOutbox)
    private readonly repo: Repository<WhatsAppOutbox>,
  ) {}

  async create(data: Partial<WhatsAppOutbox>): Promise<WhatsAppOutbox> {
    return this.repo.save(this.repo.create(data));
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<WhatsAppOutbox | null> {
    return this.repo.findOne({
      where: { idempotencyKey },
    });
  }

  async findQueued(limit: number = 100): Promise<WhatsAppOutbox[]> {
    return this.repo.find({
      where: {
        status: 'queued' as any,
        retryCount: LessThan(5), // max retries = 5
      },
      take: limit,
      order: { createdAt: 'ASC' },
    });
  }

  async findByClinic(
    clinicId: string,
    filters: {
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<[WhatsAppOutbox[], number]> {
    const query = this.repo.createQueryBuilder('w')
      .where('w.clinicId = :clinicId', { clinicId });

    if (filters.status) {
      query.andWhere('w.status = :status', { status: filters.status });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('w.createdAt', 'DESC');

    return query.getManyAndCount();
  }

  async findById(messageId: string): Promise<WhatsAppOutbox | null> {
    return this.repo.findOne({ where: { id: messageId } });
  }

  async save(message: WhatsAppOutbox): Promise<WhatsAppOutbox> {
    return this.repo.save(message);
  }
}
```

### Tarea 2.3: Crear WhatsApp Service (Enqueue)

**Archivo:** `vibralive-backend/src/modules/whatsapp/whatsapp.service.ts`

```typescript
import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppOutboxRepository } from './repositories/whatsapp-outbox.repository';
import { SendMessageDto } from './dtos';
// import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class WhatsAppService {
  constructor(
    private readonly outboxRepo: WhatsAppOutboxRepository,
    // private readonly auditLog: AuditLogService,
  ) {}

  async enqueueMessage(
    clinicId: string,
    dto: SendMessageDto,
    userId: string,
  ) {
    // Idempotencia: si key existe, error 409
    if (dto.idempotency_key) {
      const existing = await this.outboxRepo.findByIdempotencyKey(
        dto.idempotency_key,
      );
      if (existing) {
        throw new ConflictException(
          'Message already queued with this idempotency key',
        );
      }
    }

    const idempotencyKey = dto.idempotency_key || uuidv4();

    const message = await this.outboxRepo.create({
      clinicId,
      phoneNumber: dto.phone_number,
      messageBody: dto.message_body,
      clientId: dto.client_id,
      idempotencyKey,
      messageType: dto.message_type || 'notification',
      status: 'queued',
      retryCount: 0,
      maxRetries: 5,
      channel: 'whatsapp',
    });

    // TODO: AuditLog
    // await this.auditLog.create({
    //   clinic_id: clinicId,
    //   actor_id: userId,
    //   action: 'CREATE',
    //   resource_type: 'whatsapp_message',
    //   resource_id: message.id,
    // });

    return {
      id: message.id,
      status: 'queued',
      idempotency_key: idempotencyKey,
      created_at: message.createdAt,
    };
  }

  async findByClinic(clinicId: string, filters: any = {}) {
    const [messages, total] = await this.outboxRepo.findByClinic(
      clinicId,
      filters,
    );

    return {
      data: messages.map((m) => ({
        id: m.id,
        phone_number: m.phoneNumber,
        status: m.status,
        retry_count: m.retryCount,
        created_at: m.createdAt,
        message_type: m.messageType,
      })),
      total,
      page: filters.page || 1,
    };
  }

  async findOne(messageId: string) {
    const message = await this.outboxRepo.findById(messageId);
    if (!message) {
      throw new BadRequestException('Message not found');
    }

    return {
      id: message.id,
      phone_number: message.phoneNumber,
      message_body: message.messageBody,
      status: message.status,
      retry_count: message.retryCount,
      provider_message_id: message.providerMessageId,
      provider_error: message.providerError,
      sent_at: message.sentAt,
      created_at: message.createdAt,
    };
  }

  async retryMessage(messageId: string) {
    const message = await this.outboxRepo.findById(messageId);
    if (!message) {
      throw new BadRequestException('Message not found');
    }

    message.status = 'queued';
    message.retryCount = 0;
    message.lastRetryAt = null;

    await this.outboxRepo.save(message);

    return {
      id: message.id,
      status: message.status,
      retry_count: message.retryCount,
    };
  }
}
```

### Tarea 2.4: Crear WhatsApp Worker (Cron)

**Archivo:** `vibralive-backend/src/modules/whatsapp/whatsapp-worker.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsAppOutboxRepository } from './repositories/whatsapp-outbox.repository';
// import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class WhatsAppWorkerService {
  private readonly logger = new Logger(WhatsAppWorkerService.name);

  constructor(
    private readonly outboxRepo: WhatsAppOutboxRepository,
    // private readonly auditLog: AuditLogService,
  ) {}

  // Ejecutar cada 30 segundos
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processQueue() {
    this.logger.debug('Processing WhatsApp outbox queue...');

    try {
      const messages = await this.outboxRepo.findQueued(50);

      if (messages.length === 0) {
        this.logger.debug('No messages to process');
        return;
      }

      this.logger.debug(`Processing ${messages.length} messages`);

      for (const msg of messages) {
        try {
          // ⭐ PLACEHOLDER: Integración real con proveedor
          const success = await this.sendViaProvider(msg);

          if (success) {
            msg.status = 'sent';
            msg.sentAt = new Date();
            msg.providerMessageId = `MOCK_${Date.now()}_${Math.random()}`;
          } else {
            // Reintento
            msg.retryCount++;
            msg.lastRetryAt = new Date();

            if (msg.retryCount >= msg.maxRetries) {
              msg.status = 'failed';
              this.logger.warn(
                `Message ${msg.id} max retries reached (${msg.retryCount}/${msg.maxRetries})`,
              );
            }
          }

          await this.outboxRepo.save(msg);

          // TODO: AuditLog del envío
          // await this.auditLog.create({
          //   clinic_id: msg.clinicId,
          //   actor_id: 'SYSTEM',
          //   action: 'SEND_MESSAGE',
          //   resource_type: 'whatsapp_message',
          //   resource_id: msg.id,
          //   changes: {
          //     after: {
          //       status: msg.status,
          //       provider_message_id: msg.providerMessageId,
          //     },
          //   },
          // });
        } catch (error) {
          this.logger.error(
            `Error processing message ${msg.id}: ${error.message}`,
            error.stack,
          );
          msg.retryCount++;
          msg.providerError = error.message;
          msg.lastRetryAt = new Date();
          await this.outboxRepo.save(msg);
        }
      }

      this.logger.debug(`Finished processing queue`);
    } catch (error) {
      this.logger.error(
        `WhatsApp worker error: ${error.message}`,
        error.stack,
      );
    }
  }

  // PLACEHOLDER: Integración real
  private async sendViaProvider(message: any): Promise<boolean> {
    // TODO: Reemplázalo con Twilio, Meta, etc.
    // For now, simulate 90% success rate
    const success = Math.random() > 0.1;

    if (!success) {
      throw new Error('Simulated provider error');
    }

    return true;
  }
}
```

### Tarea 2.5: Crear Controller

**Archivo:** `vibralive-backend/src/modules/whatsapp/whatsapp.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentClinicId } from '../../common/decorators/current-clinic.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WhatsAppService } from './whatsapp.service';
import { SendMessageDto } from './dtos';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('send')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  @HttpCode(202) // Accepted
  async sendMessage(
    @CurrentClinicId() clinicId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.whatsappService.enqueueMessage(clinicId, dto, user.id);
  }

  @Get('outbox')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  async listOutbox(
    @CurrentClinicId() clinicId: string,
    @Query() filters: any,
  ) {
    return this.whatsappService.findByClinic(clinicId, filters);
  }

  @Get('outbox/:id')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  async getOutboxMessage(@Param('id') messageId: string) {
    return this.whatsappService.findOne(messageId);
  }

  @Patch('outbox/:id/retry')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  async retryMessage(@Param('id') messageId: string) {
    return this.whatsappService.retryMessage(messageId);
  }
}
```

### Tarea 2.6: Crear Module

**Archivo:** `vibralive-backend/src/modules/whatsapp/whatsapp.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWorkerService } from './whatsapp-worker.service';
import { WhatsAppOutboxRepository } from './repositories/whatsapp-outbox.repository';
import { WhatsAppOutbox } from '../../database/entities/whatsapp-outbox.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsAppOutbox])],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppWorkerService, WhatsAppOutboxRepository],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
```

### Tarea 2.7: Registrar en AppModule

**Archivo:** `vibralive-backend/src/app.module.ts` (actualizar)

```typescript
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // ⭐ IMPORTANTE para @Cron
    // ... other imports
    WhatsAppModule,
  ],
})
export class AppModule {}
```

---

## 🧪 SPRINT 3: Testing (2 horas)

Crear archivo `tests/appointments.e2e-spec.ts` (siguiendo ejemplo en MVP_SPECIFICATION.md).

Comandos:

```bash
# Instalar test dependencies
npm install --save-dev @nestjs/testing jest @types/jest ts-jest

# Correr tests
npm run test e2e

# Con cobertura
npm run test e2e -- --coverage
```

---

## 📊 SPRINT 4: Seeding + Documentación (1 hora)

### Tarea 4.1: Actualizar seeding

**Archivo:** `vibralive-backend/src/database/seeds/seed.ts` (agregar datos de prueba)

```typescript
// Crear citas de prueba
const appointment = appointmentRepo.create({
  clinicId,
  petId,
  clientId,
  scheduledAt: new Date(Date.now() + 86400000), // mañana
  status: 'SCHEDULED',
  reason: 'Vacunación',
  durationMinutes: 45,
});
await appointmentRepo.save(appointment);

// Crear mensajes WhatsApp de prueba
const msg = whatsappOutboxRepo.create({
  clinicId,
  phoneNumber: '+5215512345678',
  messageBody: 'Recordatorio: Tu cita es mañana a las 10am',
  messageType: 'reminder',
  status: 'queued',
  idempotencyKey: `test-${Date.now()}`,
  retryCount: 0,
  maxRetries: 5,
});
await whatsappOutboxRepo.save(msg);
```

---

## 🚀 SPRINT 5: Deploy (1 hora)

```bash
# Build
npm run build

# Run migrations
npm run typeorm migration:run

# Start
npm start
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Entities creadas: Appointment, WhatsAppOutbox
- [ ] Migrations generadas y testeadas
- [ ] Appointments Module completo (DTO, repo, service, controller)
- [ ] Appointments registrado en AppModule
- [ ] WhatsApp Module completo (DTO, repo, service, worker, controller)
- [ ] WhatsApp registrado en AppModule
- [ ] ScheduleModule importado en AppModule
- [ ] Tests e2e (10 tests mínimos)
- [ ] Seeding actualizado
- [ ] Build sin errores (`npm run build`)
- [ ] TypeORM migrations OK
- [ ] Local testing: crear cita, cambiar status, encolar WhatsApp
- [ ] Deploy a staging

---

## ⚠️ CHECKLIST DE VALIDACIÓN

**Antes de merge:**
- [ ] `clinic_id` NUNCA viene del body (siempre del JWT)
- [ ] `TenantGuard` activo en TODOS endpoints protegidos
- [ ] AuditLog creado para: UPDATE appointment status, CREATE whatsapp message
- [ ] Indices en BD para queries rápidas: `(clinic_id, stauts)`, `(clinic_id, created_at)`
- [ ] Tests pasan: `npm run test e2e`
- [ ] No hay SQL injection (usar QueryBuilder)
- [ ] Validación DTO en todos inputs
- [ ] Error responses coherentes (400, 403, 404, 409)

---

## 📞 SUPPORT

**Dudas durante implementación:**
- Review MVP_SPECIFICATION.md (entregable A-G)
- Validar patrones en código existente (clients, pets)
- Ejecutar seeding: `npm run seed` para tener data de prueba

---

**Total esfuerzo estimado:** 16 horas (4 días dev)  
**Status:** 🟢 Listo para comenzar  
