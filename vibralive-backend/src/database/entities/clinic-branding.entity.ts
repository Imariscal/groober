import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Clinic } from './clinic.entity';

@Entity('clinic_branding')
export class ClinicBranding {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @OneToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  // Logo & Images
  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ name: 'logo_dark_url', nullable: true })
  logoDarkUrl?: string;

  @Column({ name: 'favicon_url', nullable: true })
  faviconUrl?: string;

  @Column({ name: 'login_background_url', nullable: true })
  loginBackgroundUrl?: string;

  // Brand Identity
  @Column({ name: 'brand_name', nullable: true })
  brandName?: string;

  @Column({ nullable: true })
  tagline?: string;

  // Primary Colors
  @Column({ name: 'primary_color', default: '#0ea5e9' })
  primaryColor!: string;

  @Column({ name: 'primary_color_light', default: '#38bdf8' })
  primaryColorLight!: string;

  @Column({ name: 'primary_color_dark', default: '#0284c7' })
  primaryColorDark!: string;

  // Secondary/Accent Colors
  @Column({ name: 'secondary_color', default: '#8b5cf6' })
  secondaryColor!: string;

  @Column({ name: 'accent_color', default: '#f59e0b' })
  accentColor!: string;

  // Navigation Colors
  @Column({ name: 'sidebar_bg_color', default: '#0f172a' })
  sidebarBgColor!: string;

  @Column({ name: 'sidebar_text_color', default: '#e2e8f0' })
  sidebarTextColor!: string;

  @Column({ name: 'sidebar_active_bg', default: '#1e293b' })
  sidebarActiveBg!: string;

  @Column({ name: 'sidebar_active_text', default: '#38bdf8' })
  sidebarActiveText!: string;

  // TopBar Colors
  @Column({ name: 'topbar_bg_color', default: '#ffffff' })
  topbarBgColor!: string;

  @Column({ name: 'topbar_text_color', default: '#1e293b' })
  topbarTextColor!: string;

  // Login Page
  @Column({ name: 'login_gradient_from', default: '#2563eb' })
  loginGradientFrom!: string;

  @Column({ name: 'login_gradient_to', default: '#1d4ed8' })
  loginGradientTo!: string;

  @Column({ name: 'login_text_color', default: '#ffffff' })
  loginTextColor!: string;

  // Typography
  @Column({ name: 'font_family', default: 'Inter' })
  fontFamily!: string;

  @Column({ name: 'heading_font_family', nullable: true })
  headingFontFamily?: string;

  // Border Radius
  @Column({ name: 'border_radius', default: '0.5rem' })
  borderRadius!: string;

  @Column({ name: 'button_radius', default: '0.5rem' })
  buttonRadius!: string;

  // Custom Features Display (for login)
  @Column({ name: 'features_json', type: 'text', nullable: true })
  featuresJson?: string; // JSON array of { icon, title, description }

  // Footer & Legal
  @Column({ name: 'footer_text', nullable: true })
  footerText?: string;

  @Column({ name: 'privacy_policy_url', nullable: true })
  privacyPolicyUrl?: string;

  @Column({ name: 'terms_url', nullable: true })
  termsUrl?: string;

  // Custom CSS (advanced)
  @Column({ name: 'custom_css', type: 'text', nullable: true })
  customCss?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
