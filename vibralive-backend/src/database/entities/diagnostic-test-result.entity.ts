import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DiagnosticOrder } from './diagnostic-order.entity';

@Entity('diagnostic_test_results')
export class DiagnosticTestResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'diagnostic_order_id' })
  diagnosticOrderId!: string;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'test_result_name',
  })
  testResultName!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'result_value',
  })
  resultValue?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'result_unit',
  })
  resultUnit?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'reference_range_min',
  })
  referenceRangeMin?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'reference_range_max',
  })
  referenceRangeMax?: string;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'is_normal',
  })
  isNormal?: boolean;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'completed_date',
  })
  completedDate?: Date;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    name: 'updated_at',
  })
  updatedAt!: Date;

  // === RELATIONSHIPS ===
  @ManyToOne(() => DiagnosticOrder, (order) => order.testResults, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diagnostic_order_id' })
  diagnosticOrder!: DiagnosticOrder;
}
