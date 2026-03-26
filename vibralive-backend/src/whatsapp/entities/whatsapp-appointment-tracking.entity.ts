import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('whatsapp_appointment_tracking')
@Index('idx_whatsapp_track_clinic_phone', ['clinic_id', 'phone_number', 'status'])
@Index('idx_whatsapp_track_status', ['status', 'appointment_date'], {
  where: `status IN ('pending', 'rescheduled_pending')`,
})
@Index('idx_whatsapp_track_phone', ['phone_number'])
export class WhatsAppAppointmentTrackingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid', unique: true })
  appointment_id: string;

  @Column({ type: 'uuid', nullable: true })
  client_id?: string;

  @Column({ type: 'varchar', length: 20 })
  phone_number: string;

  @Column({ type: 'timestamp with time zone' })
  appointment_date: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reminder_sent_at?: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, confirmed, cancelled, rescheduled_pending, rescheduled_confirmed, no_show, no_response, expired

  @Column({ type: 'varchar', length: 255, nullable: true })
  last_message_id?: string;

  @Column({ type: 'text', nullable: true })
  last_response_body?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_response_at?: Date;

  @Column({ type: 'jsonb', default: '{}' })
  metadata_json?: any;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
