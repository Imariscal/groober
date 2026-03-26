# CÓDIGO - IMPLEMENTACIÓN DE GROOMING RULES

## 1. MIGRATIONS

### 1772660200000-ConvertLocationTypeToEnum.ts
```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ConvertLocationTypeToEnum1772660200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type
    await queryRunner.query(`
      CREATE TYPE location_type_enum AS ENUM ('CLINIC', 'HOME')
    `);

    // Add temporary column with new type
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'location_type_new',
        type: 'location_type_enum',
        default: "'CLINIC'",
        isNullable: false,
      }),
    );

    // Migrate data from old column to new, handling invalid values
    await queryRunner.query(`
      UPDATE appointments 
      SET location_type_new = CASE 
        WHEN UPPER(location_type) = 'HOME' THEN 'HOME'::location_type_enum
        ELSE 'CLINIC'::location_type_enum
      END
    `);

    // Drop old column
    await queryRunner.dropColumn('appointments', 'location_type');

    // Rename new column
    await queryRunner.query(
      `ALTER TABLE appointments RENAME COLUMN location_type_new TO location_type`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to VARCHAR
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'location_type_varchar',
        type: 'varchar',
        length: '20',
        default: "'CLINIC'",
      }),
    );

    await queryRunner.query(
      `UPDATE appointments SET location_type_varchar = location_type::text`,
    );

    await queryRunner.dropColumn('appointments', 'location_type');

    await queryRunner.query(
      `ALTER TABLE appointments RENAME COLUMN location_type_varchar TO location_type`,
    );

    // Drop ENUM type
    await queryRunner.query(`DROP TYPE location_type_enum`);
  }
}
```

### 1772660300000-AddAssignmentFieldsToAppointments.ts
```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAssignmentFieldsToAppointments1772660300000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM for assignment_source
    await queryRunner.query(`
      CREATE TYPE assignment_source_enum AS ENUM ('NONE', 'AUTO_ROUTE', 'MANUAL_RECEPTION', 'COMPLETED_IN_CLINIC')
    `);

    // Add assignment_source column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'assignment_source',
        type: 'assignment_source_enum',
        default: "'NONE'",
        isNullable: false,
      }),
    );

    // Add assigned_at column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'assigned_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Set assigned_at for existing assignments
    await queryRunner.query(`
      UPDATE appointments 
      SET assigned_at = updated_at, assignment_source = 'COMPLETED_IN_CLINIC'::assignment_source_enum
      WHERE assigned_staff_user_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns
    await queryRunner.dropColumn('appointments', 'assigned_at');
    await queryRunner.dropColumn('appointments', 'assignment_source');

    // Drop ENUM type
    await queryRunner.query(`DROP TYPE assignment_source_enum`);
  }
}
```

## 2. ENTITIES

### appointment.entity.ts - Cambios
```typescript
@Column({
    type: 'enum',
    enum: ['CLINIC', 'HOME'],
    default: 'CLINIC',
    name: 'location_type',
  })
  locationType!: 'CLINIC' | 'HOME';

@Column({
    type: 'uuid',
    nullable: true,
    name: 'assigned_staff_user_id',
  })
  assignedStaffUserId?: string;

  @Column({
    type: 'enum',
    enum: ['NONE', 'AUTO_ROUTE', 'MANUAL_RECEPTION', 'COMPLETED_IN_CLINIC'],
    default: 'NONE',
    name: 'assignment_source',
  })
  assignmentSource!: 'NONE' | 'AUTO_ROUTE' | 'MANUAL_RECEPTION' | 'COMPLETED_IN_CLINIC';

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'assigned_at',
  })
  assignedAt: Date | null = null;
```

## 3. DTOS

### create-appointment.dto.ts - Nueva versión
```typescript
export enum LocationType {
  CLINIC = 'CLINIC',
  HOME = 'HOME',
}

export enum AssignmentSource {
  NONE = 'NONE',
  AUTO_ROUTE = 'AUTO_ROUTE',
  MANUAL_RECEPTION = 'MANUAL_RECEPTION',
  COMPLETED_IN_CLINIC = 'COMPLETED_IN_CLINIC',
}
```

### complete-appointment.dto.ts - Nuevo archivo
```typescript
import { IsUUID, IsOptional } from 'class-validator';

export class CompleteAppointmentDto {
  @IsOptional()
  @IsUUID()
  performed_by_user_id?: string;
}
```

## 4. SERVICIOS

### appointments.service.ts - Métodos principales

#### método create() - Lógica de asignación
- CLINIC: NO asigna estilista al crear (captura al completar)
- HOME: Puede asignarse manualmente en MANUAL_RECEPTION o dejar para AUTO_ROUTE

#### método planHomeGroomingRoutes()
```typescript
POST /appointments/grooming/home/plan-routes
Body: { date?: 'YYYY-MM-DD' }
Response: { success: true, data: { plannedCount: number, assigned: [] } }
```
- Filtra citas HOME sin asignar
- Asigna round-robin a estilistas disponibles
- Setting assignment_source = 'AUTO_ROUTE'

#### método complete()
```typescript
PUT /appointments/:id/complete
Body: { performed_by_user_id?: string }
```
- CLINIC: performed_by_user_id OBLIGATORIO, setea como assignedStaffUserId
- HOME: performed_by_user_id OPCIONAL

## 5. REPOSITORIO

### appointments.repository.ts - Nuevos métodos
```typescript
async findHomeGroomingForRoute(
    clinicId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Appointment[]>

async getAvailableStylists(clinicId: string): Promise<User[]>
```

## 6. CONTROLLER

### appointments.controller.ts - Nuevos endpoints
```typescript
@Post('grooming/home/plan-routes')
async planHomeGroomingRoutes()

@Put(':id/complete')
async complete()
```

## CARACTERÍSTICAS

✓ location_type convertido a ENUM (CLINIC | HOME)
✓ assignment_source enum para rastrear origen de asignación
✓ CLINIC grooming: NO asigna al crear, captura al completar
✓ HOME grooming: MANUAL_RECEPTION o AUTO_ROUTE via plan-routes
✓ Backwards-compatible con existing appointments
✓ Multi-tenant: clinicId obligatorio en todas las queries
✓ Compiled successfully - Sin errores TypeScript
