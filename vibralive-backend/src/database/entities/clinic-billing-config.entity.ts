import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from './clinic.entity';

/**
 * Configuración de facturación de la clínica
 * Datos fiscales para emisión de facturas/recibos
 */
@Entity('clinic_billing_config')
export class ClinicBillingConfig {
  @PrimaryColumn({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  // Datos de la empresa/persona física
  @Column({ type: 'varchar', length: 200, name: 'legal_name', nullable: true })
  legalName?: string; // Razón social

  @Column({ type: 'varchar', length: 20, name: 'tax_id', nullable: true })
  taxId?: string; // RFC en México, NIT en Colombia, RUT en Chile, etc.

  @Column({ type: 'varchar', length: 100, name: 'tax_regime', nullable: true })
  taxRegime?: string; // Régimen fiscal (P.Física, P.Moral, etc.)

  // Dirección fiscal
  @Column({ type: 'varchar', length: 300, name: 'fiscal_address', nullable: true })
  fiscalAddress?: string;

  @Column({ type: 'varchar', length: 100, name: 'fiscal_city', nullable: true })
  fiscalCity?: string;

  @Column({ type: 'varchar', length: 100, name: 'fiscal_state', nullable: true })
  fiscalState?: string;

  @Column({ type: 'varchar', length: 20, name: 'fiscal_zip', nullable: true })
  fiscalZip?: string;

  @Column({ type: 'varchar', length: 3, name: 'fiscal_country', default: 'MX' })
  fiscalCountry!: string; // ISO country code

  // Contacto fiscal
  @Column({ type: 'varchar', length: 255, name: 'billing_email', nullable: true })
  billingEmail?: string;

  @Column({ type: 'varchar', length: 20, name: 'billing_phone', nullable: true })
  billingPhone?: string;

  // Configuración de facturación
  @Column({ type: 'varchar', length: 10, name: 'currency', default: 'MXN' })
  currency!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'tax_rate', default: 16.00 })
  taxRate!: number; // IVA u otro impuesto (16% en México)

  @Column({ type: 'varchar', length: 50, name: 'invoice_prefix', nullable: true })
  invoicePrefix?: string; // Prefijo para facturas (VL-001)

  @Column({ type: 'integer', name: 'invoice_next_number', default: 1 })
  invoiceNextNumber!: number;

  // Logo/branding para facturas
  @Column({ type: 'text', name: 'invoice_logo_url', nullable: true })
  invoiceLogoUrl?: string;

  @Column({ type: 'text', name: 'invoice_footer_text', nullable: true })
  invoiceFooterText?: string; // Texto al pie de factura

  // Integración con PAC (México) u otros servicios de facturación
  @Column({ type: 'varchar', length: 50, name: 'billing_provider', nullable: true })
  billingProvider?: string; // facturapi, sat, siigo, etc.

  @Column({ type: 'text', name: 'billing_api_key', nullable: true })
  billingApiKey?: string; // Encriptado en producción

  @Column({ type: 'boolean', name: 'is_billing_active', default: false })
  isBillingActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;
}
