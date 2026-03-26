// User and Auth types
export type UserRole = 'SUPER_ADMIN' | 'CLINIC_OWNER' | 'CLINIC_STAFF' | 'CLINIC_STYLIST' | 'CLINIC_VETERINARIAN';

export interface User {
  id: string;
  clinic_id: string | null;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  role: UserRole;
  status: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
  permissions: string[];
  available_features: string[];
  available_menu: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  clinic_name: string;
  clinic_phone: string;
  owner_name: string;
  owner_email: string;
  password: string;
  city?: string;
}

export interface AcceptInvitationPayload {
  invitation_token: string;
  password: string;
}

// Clinic types
export type ClinicStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type SubscriptionPlanCode = string; // Now dynamic, fetched from API

export interface Clinic {
  id: string;
  name: string;
  phone: string;
  email?: string;
  responsable?: string;
  city?: string;
  country: string;
  subscriptionPlan: string;
  status: ClinicStatus;
  activeStaffCount?: number;
  activeClientsCount?: number;
  activePetsCount?: number;
  maxStaffUsers?: number;
  maxClients?: number;
  maxPets?: number;
  whatsappAccountId?: string;
  whatsappPhoneId?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicPayload {
  name: string;
  phone: string;
  email?: string;
  responsable?: string;
  city?: string;
  country?: string;
  subscription_plan?: string;
  max_staff_users?: number;
  max_clients?: number;
  max_pets?: number;
  whatsapp_account_id?: string;
  whatsapp_phone_id?: string;
}

export interface UpdateClinicPayload {
  name?: string;
  city?: string;
  country?: string;
  subscription_plan?: string;
  max_staff_users?: number;
  max_clients?: number;
  max_pets?: number;
  whatsapp_account_id?: string;
  whatsapp_phone_id?: string;
}

export interface SuspendClinicPayload {
  reason: string;
}

export interface CreateOwnerPayload {
  name: string;
  email: string;
  phone?: string;
}

export interface CreateOwnerResponse {
  id: string;
  clinic_id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  invitation_token: string;
  invitation_expires_at: string;
}

// Dashboard Platform types
export interface DashboardData {
  timestamp: string;
  kpis: {
    total_clinics: number;
    active_clinics: number;
    suspended_clinics: number;
    statistics: {
      total_active_staff: number;
      total_active_clients: number;
      total_active_pets: number;
    };
  };
  recent_clinics: Clinic[];
}

// Client types
export interface Client {
  id: string;
  clinic_id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  price_list_id: string | null;
  // New evolved client profile fields
  whatsapp_number: string | null;
  phone_secondary: string | null;
  preferred_contact_method: 'WHATSAPP' | 'PHONE' | 'EMAIL' | 'SMS' | null;
  preferred_contact_time_start: string | null; // HH:MM format
  preferred_contact_time_end: string | null; // HH:MM format
  housing_type: 'HOUSE' | 'APARTMENT' | 'OTHER' | null;
  access_notes: string | null;
  service_notes: string | null;
  do_not_contact: boolean | null;
  do_not_contact_reason: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'BLACKLISTED' | null;
  tags: string[]; // Array of tag strings
  created_at: string;
  updated_at: string;
  pets?: Pet[];
  addresses?: ClientAddress[]; // Client addresses (Grooming)
}

export interface CreateClientAddressPayload {
  label?: string;
  street: string;
  number_ext?: string;
  number_int?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zip_code?: string;
  references?: string;
  lat?: number;
  lng?: number;
  is_default?: boolean;
}

export interface CreateClientPayload {
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  // New evolved client profile fields
  whatsapp_number: string | null;
  phone_secondary: string | null;
  preferred_contact_method: 'WHATSAPP' | 'PHONE' | 'EMAIL' | 'SMS' | null;
  preferred_contact_time_start: string | null; // HH:MM format
  preferred_contact_time_end: string | null; // HH:MM format
  housing_type: 'HOUSE' | 'APARTMENT' | 'OTHER' | null;
  access_notes: string | null;
  service_notes: string | null;
  do_not_contact: boolean | null;
  do_not_contact_reason: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'BLACKLISTED' | null;
  price_list_id: string | null;
  // Addresses to create with client
  addresses?: CreateClientAddressPayload[];
  // Pets to create with client
  pets?: CreateClientPetPayload[];
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {}

// PriceList types
export interface PriceList {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriceListPayload {
  name: string;
  description?: string;
  is_default?: boolean;
  copyFromPriceListId?: string;
}

export interface UpdatePriceListPayload {
  name?: string;
  description?: string;
  is_active?: boolean;
  is_default?: boolean;
}

// Service types
export interface Service {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  category: 'MEDICAL' | 'GROOMING';
  defaultDurationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicePayload {
  name: string;
  description?: string;
  category: 'MEDICAL' | 'GROOMING';
  defaultDurationMinutes?: number;
  price: number;
}

export interface UpdateServicePayload {
  name?: string;
  description?: string;
  category?: 'MEDICAL' | 'GROOMING';
  defaultDurationMinutes?: number;
}

// Service Price types (prices for services within a price list)
export interface ServicePrice {
  id: string;
  priceListId: string;
  serviceId: string;
  serviceName?: string;
  service?: Service;
  price: number;
  currency?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateServicePricePayload {
  price: number;
  currency?: string;
  is_available?: boolean;
}

export interface ServicePriceHistory {
  id: string;
  priceListId: string;
  serviceId: string;
  changedBy: string;
  oldPrice?: number;
  newPrice: number;
  reason?: string;
  changed_at: string;
}

// Service Size Price types (prices for services by pet size)
export interface ServiceSizePrice {
  id: string;
  clinicId: string;
  serviceId: string;
  serviceName?: string;
  petSize: 'XS' | 'S' | 'M' | 'L' | 'XL';
  price: number;
  currency?: string;
  durationMinutes?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceSizePricePayload {
  serviceId: string;
  petSize: 'XS' | 'S' | 'M' | 'L' | 'XL';
  price: number;
  currency?: string;
  durationMinutes?: number;
}

export interface UpdateServiceSizePricePayload {
  price: number;
  currency?: string;
  is_active?: boolean;
  durationMinutes?: number;
}

// Service Package Price types
export interface ServicePackagePrice {
  id: string;
  priceListId: string;
  packageId: string;
  packageName?: string;
  price: number;
  currency?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePackagePricePayload {
  price: number;
  currency?: string;
  is_available?: boolean;
}

// ClientAddress types (Grooming - Home addresses)
export interface ClientAddress {
  id: string;
  clinic_id: string;
  client_id: string;
  label?: string; // e.g., "Casa", "Trabajo"
  street: string;
  number_ext?: string;
  number_int?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zip_code?: string;
  references?: string;
  lat?: number;
  lng?: number;
  geocode_status: 'PENDING' | 'OK' | 'FAILED';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientAddressPayload {
  label?: string;
  street: string;
  number_ext?: string;
  number_int?: string;
  neighborhood?: string;
  city: string;
  state?: string;
  zip_code?: string;
  references?: string;
  lat?: number;
  lng?: number;
}

export interface UpdateClientAddressPayload extends Partial<CreateClientAddressPayload> {
  is_default?: boolean;
}

// Pet Enums
export type PetSpecies = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'HAMSTER' | 'GUINEA_PIG' | 'FISH' | 'TURTLE' | 'FERRET' | 'OTHER';
export type PetSex = 'MALE' | 'FEMALE' | 'UNKNOWN';
export type PetSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

// Pet types
export interface Pet {
  id: string;
  clinic_id: string;
  client_id: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  date_of_birth?: string;
  sex: PetSex;
  is_sterilized: boolean;
  color?: string;
  size?: PetSize;
  microchip_number?: string;
  tag_number?: string;
  external_reference?: string;
  notes?: string;
  allergies?: string;
  blood_type?: string;
  is_deceased: boolean;
  deceased_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientPetPayload {
  name: string;
  species: PetSpecies;
  breed?: string;
  dateOfBirth?: string;
  sex?: PetSex;
  isSterilized?: boolean;
  color?: string;
  size?: PetSize;
  microchipNumber?: string;
  tagNumber?: string;
  notes?: string;
  allergies?: string;
}

export interface CreatePetPayload {
  name: string;
  client_id: string;
  animal_type_id: number;
  breed?: string;
  birth_date?: string;
  next_vaccine_date?: string;
  next_deworming_date?: string;
  notes?: string;
}

// Animal Type
export interface AnimalType {
  id: number;
  clinic_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Appointment types (Grooming)
export type AppointmentLocationTypeType = 'CLINIC' | 'HOME';
export type AppointmentStatusType = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'UNATTENDED';
export type AssignmentSourceType = 'NONE' | 'AUTO_ROUTE' | 'MANUAL_RECEPTION' | 'COMPLETED_IN_CLINIC';

export interface Appointment {
  id: string;
  clinic_id: string;
  pet_id: string;
  client_id: string;
  scheduled_at: string;
  status: AppointmentStatusType;
  reason?: string;
  location_type: AppointmentLocationTypeType; // CLINIC | HOME
  service_type?: 'MEDICAL' | 'GROOMING'; // Type of service: Medical visit or Grooming
  address_id?: string;
  address?: ClientAddress; // For HOME appointments
  assigned_staff_user_id?: string;
  assignment_source?: AssignmentSourceType; // NEW: How the appointment was assigned
  assigned_at?: string; // NEW: When the appointment was assigned
  performed_by_user_id?: string; // Stylist who actually completed the appointment (may differ from assigned)
  veterinarian_id?: string;
  duration_minutes?: number;
  requires_route_planning: boolean;
  notes?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  rescheduled_at?: string;
  created_at: string;
  updated_at: string;
  pet?: Pet;
  client?: Client;
}

export interface CreateAppointmentPayload {
  pet_id: string;
  client_id: string;
  scheduled_at: string; // ISO 8601
  reason?: string;
  duration_minutes?: number;
  veterinarian_id?: string;
  location_type?: AppointmentLocationTypeType; // default CLINIC
  service_type?: 'MEDICAL' | 'GROOMING'; // Type of service: Medical visit or Grooming
  address_id?: string; // Required if location_type=HOME
  assigned_staff_user_id?: string;
  assignment_source?: AssignmentSourceType; // NEW: Optional assignment source indicator
}

export interface UpdateAppointmentPayload extends Partial<CreateAppointmentPayload> {
  status?: AppointmentStatusType;
  rescheduled_at?: string;
}

export interface AppointmentItem {
  id: string;
  clinic_id: string;
  appointment_id: string;
  service_id?: string;
  package_id?: string;
  price_at_booking: number;
  quantity: number;
  subtotal?: number;
  created_at: string;
}

// Reminder types
export interface Reminder {
  id: string;
  clinic_id: string;
  pet_id: string;
  client_id: string;
  reminder_type: 'vaccine' | 'deworming';
  reminder_stage: 'day7' | 'day1' | 'followup24h';
  scheduled_date: string;
  status: 'pending' | 'sent' | 'confirmed' | 'cancelled' | 'failed';
  message_id?: string;
  confirmed_at?: string;
  failed_reason?: string;
  created_at: string;
  updated_at: string;
}

// Message Log types
export interface MessageLog {
  id: string;
  clinic_id: string;
  reminder_id?: string;
  client_id: string;
  direction: 'outbound' | 'inbound';
  message_type: 'reminder' | 'confirmation' | 'followup' | 'user_message';
  phone_number: string;
  message_body: string;
  whatsapp_message_id?: string;
  status: 'delivered' | 'read' | 'failed' | 'cancelled';
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

// API Error
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// Platform Admin Types
export interface CreateOwnerResponse {
  id: string;
  clinic_id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  invitation_token: string;
  invitation_expires_at: string;
  created_at?: string;
}

export interface DashboardKPIs {
  total_clinics: number;
  active_clinics: number;
  suspended_clinics: number;
  statistics: {
    total_active_staff: number;
    total_active_clients: number;
    total_active_pets: number;
  };
  recent_clinics: Clinic[];
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_type: 'platform_user' | 'clinic_user';
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
  error_message?: string;
  created_at: string;
}

// Client Growth KPIs types
export interface ClientGrowthKPIs {
  /**
   * Number of new clients registered today
   */
  newClientsToday: number;

  /**
   * Number of new clients registered in the last 7 days
   */
  newClientsThisWeek: number;

  /**
   * Number of new clients registered this month
   */
  newClientsThisMonth: number;

  /**
   * Growth percentage compared to previous month
   * Can be negative (e.g., -15.5) or positive (+25.3)
   */
  growthPercentage: number;

  /**
   * Total clients registered last month (for context)
   */
  clientsLastMonth: number;

  /**
   * Average daily registrations this month
   */
  dailyAverage: number;

  /**
   * Total active clients (status = ACTIVE)
   */
  activeClients: number;

  /**
   * Total clients overall (all statuses)
   */
  totalClients: number;

  /**
   * Timestamp when KPIs were calculated
   */
  timestamp: Date | string;
}

export interface ClientGrowthKPIsResponse {
  success: boolean;
  data: ClientGrowthKPIs;
}
// Service Package types
export interface PackageItem {
  serviceId: string;
  serviceName?: string;
  quantity: number;
  price?: number;
  currency?: string;
  service?: Service;
}

export interface ServicePackage {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  isActive: boolean;
  items: PackageItem[];
  totalPrice?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicePackagePayload {
  name: string;
  description?: string;
  items: PackageItem[];
}

export interface UpdateServicePackagePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  items?: PackageItem[];
}

// Clinic Configuration types
export interface BusinessHours {
  week: {
    mon: Array<{ start: string; end: string }>;
    tue: Array<{ start: string; end: string }>;
    wed: Array<{ start: string; end: string }>;
    thu: Array<{ start: string; end: string }>;
    fri: Array<{ start: string; end: string }>;
    sat: Array<{ start: string; end: string }>;
    sun: Array<{ start: string; end: string }>;
  };
}

export interface ClinicConfiguration {
  clinicId: string;
  timezone: string;
  businessHours: BusinessHours;
  // Grooming configuration
  clinicGroomingCapacity: number;
  homeGroomingCapacity: number;
  homeTravelBufferMinutes: number;
  preventSamePetSameDay: boolean;
  maxClinicOverlappingAppointments: number; // Max simultaneous appointments at clinic
  allowAppointmentOverlap?: boolean; // If true, allows overlapping appointments at same location
  // Medical configuration
  clinicMedicalCapacity: number;
  homeMedicalCapacity: number;
  medicalTravelBufferMinutes: number;
  maxClinicMedicalOverlappingAppointments: number;
  allowMedicalAppointmentOverlap?: boolean;
  // Base location for maps
  baseLat?: number | null; // Latitude base de la clínica para mapas
  baseLng?: number | null; // Longitude base de la clínica para mapas
  createdAt: string;
  updatedAt: string;
}

export type CalendarExceptionType = 'CLOSED' | 'SPECIAL_HOURS';

export interface ClinicCalendarException {
  id: string;
  clinicId: string;
  date: string; // YYYY-MM-DD
  type: CalendarExceptionType;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarExceptionPayload {
  date: string; // YYYY-MM-DD
  type: CalendarExceptionType;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  reason?: string;
}

export interface UpdateCalendarExceptionPayload {
  date?: string;
  type?: CalendarExceptionType;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

// ============================================
// BILLING CONFIG TYPES
// ============================================

export interface BillingConfig {
  clinicId: string;
  legalName?: string;
  taxId?: string;
  taxRegime?: string;
  fiscalAddress?: string;
  fiscalCity?: string;
  fiscalState?: string;
  fiscalZip?: string;
  fiscalCountry: string;
  billingEmail?: string;
  billingPhone?: string;
  currency: string;
  taxRate: number;
  invoicePrefix?: string;
  invoiceNextNumber: number;
  invoiceLogoUrl?: string;
  invoiceFooterText?: string;
  billingProvider?: string;
  isBillingActive: boolean;
}

// ============================================
// EMAIL CONFIG TYPES
// ============================================

export type EmailProvider = 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'resend' | 'postmark' | 'platform';

export interface EmailConfig {
  clinicId: string;
  provider: EmailProvider;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpSecure: boolean;
  apiDomain?: string;
  fromEmail?: string;
  fromName?: string;
  replyToEmail?: string;
  isActive: boolean;
  isVerified: boolean;
  lastVerifiedAt?: string;
  lastError?: string;
}

// ============================================
// WHATSAPP CONFIG TYPES
// ============================================

export type WhatsAppProvider = 'meta' | 'twilio' | '360dialog' | 'messagebird' | 'vonage' | 'wati';

export interface WhatsAppConfig {
  clinicId: string;
  provider: WhatsAppProvider;
  phoneNumberId?: string;
  businessAccountId?: string;
  appId?: string;
  accountSid?: string;
  twilioPhoneNumber?: string;
  senderPhone?: string;
  webhookUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  lastVerifiedAt?: string;
  lastError?: string;
  dailyLimit: number;
  messagesSentToday: number;
  sendAppointmentConfirmation: boolean;
  sendAppointmentReminder: boolean;
  reminderHoursBefore: number;
  sendStylistOnWay: boolean;
  sendServiceCompleted: boolean;
}

// ============================================
// MESSAGE TEMPLATE TYPES
// ============================================

export type MessageChannel = 'email' | 'whatsapp' | 'sms' | 'push';

export type MessageTrigger = 
  | 'appointment_scheduled'
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'appointment_same_day'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'stylist_on_way'
  | 'stylist_arrived'
  | 'pet_checked_in'
  | 'service_in_progress'
  | 'service_completed'
  | 'pet_ready_pickup'
  | 'appointment_follow_up'
  | 'review_request'
  | 'payment_received'
  | 'payment_reminder'
  | 'invoice_sent'
  | 'welcome'
  | 'birthday'
  | 'pet_birthday'
  | 'loyalty_reward'
  | 'vaccination_reminder'
  | 'grooming_due';

export type MessageTiming = 'immediate' | 'hours_before' | 'days_before' | 'hours_after' | 'days_after' | 'scheduled';

export interface MessageTemplate {
  id: string;
  clinicId: string;
  name: string;
  trigger: MessageTrigger;
  channel: MessageChannel;
  subject?: string;
  body: string;
  bodyHtml?: string;
  timing: MessageTiming;
  timingValue?: number;
  scheduledTime?: string;
  whatsappTemplateName?: string;
  whatsappTemplateLanguage?: string;
  isActive: boolean;
  isSystem: boolean;
  timesSent: number;
  lastSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CLINIC USERS / RBAC TYPES
// ============================================

export type ClinicUserStatus = 'INVITED' | 'ACTIVE' | 'DEACTIVATED';

export interface RoleResponse {
  code: string;
  name: string;
}

export interface StylistProfile {
  id: string;
  displayName: string | null;
  isBookable: boolean;
  calendarColor: string | null;
}

export interface VeterinarianProfile {
  id: string;
  displayName: string | null;
  isBookable: boolean;
  calendarColor: string | null;
}

export interface ClinicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: ClinicUserStatus;
  roles: RoleResponse[];
  isStylist: boolean;
  stylistProfile: StylistProfile | null;
  isVeterinarian: boolean;
  veterinarianProfile: VeterinarianProfile | null;
  lastLogin: string | null;
  createdAt: string;
}

export interface StylistProfilePayload {
  displayName?: string;
  calendarColor?: string;
  isBookable?: boolean;
}

export interface VeterinarianProfilePayload {
  displayName?: string;
  calendarColor?: string;
  isBookable?: boolean;
}

export interface CreateClinicUserPayload {
  name: string;
  email: string;
  phone?: string;
  roles: string[]; // Role codes: ['CLINIC_STAFF', 'CLINIC_STYLIST', 'CLINIC_VETERINARIAN']
  stylistProfile?: StylistProfilePayload;
  veterinarianProfile?: VeterinarianProfilePayload;
}

export interface UpdateClinicUserPayload {
  name?: string;
  phone?: string;
  roles?: string[];
  stylistProfile?: StylistProfilePayload;
  veterinarianProfile?: VeterinarianProfilePayload;
}

export interface ListClinicUsersQuery {
  search?: string;
  status?: ClinicUserStatus;
  isStylist?: boolean;
  isVeterinarian?: boolean;
}

// Role with permissions (for role management view)
export interface RoleWithPermissions {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
}

export interface Permission {
  id?: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}

// Stylist list response (for scheduler/booking)
export type StylistType = 'CLINIC' | 'HOME';

export interface Stylist {
  id: string;
  userId: string;
  displayName: string | null;
  type: StylistType; // CLINIC = Estilista de clínica, HOME = Estilista de domicilio/ruta
  isBookable: boolean;
  calendarColor: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BRANDING CONFIG TYPES
// ============================================

export interface BrandingFeature {
  icon: string;
  title: string;
  description: string;
}

export interface BrandingConfig {
  id: string;
  clinicId: string;
  
  // Logo & Images
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  loginBackgroundUrl?: string;
  
  // Brand Identity
  brandName?: string;
  tagline?: string;
  
  // Primary Colors
  primaryColor: string;
  primaryColorLight: string;
  primaryColorDark: string;
  
  // Secondary/Accent Colors
  secondaryColor: string;
  accentColor: string;
  
  // Navigation Colors
  sidebarBgColor: string;
  sidebarTextColor: string;
  sidebarActiveBg: string;
  sidebarActiveText: string;
  
  // TopBar Colors
  topbarBgColor: string;
  topbarTextColor: string;
  
  // Login Page
  loginGradientFrom: string;
  loginGradientTo: string;
  loginTextColor: string;
  
  // Typography
  fontFamily: string;
  headingFontFamily?: string;
  
  // Border Radius
  borderRadius: string;
  buttonRadius: string;
  
  // Custom Features
  features?: BrandingFeature[];
  
  // Footer & Legal
  footerText?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  
  // Custom CSS
  customCss?: string;
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandingConfigPayload {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  loginBackgroundUrl?: string;
  brandName?: string;
  tagline?: string;
  primaryColor?: string;
  primaryColorLight?: string;
  primaryColorDark?: string;
  secondaryColor?: string;
  accentColor?: string;
  sidebarBgColor?: string;
  sidebarTextColor?: string;
  sidebarActiveBg?: string;
  sidebarActiveText?: string;
  topbarBgColor?: string;
  topbarTextColor?: string;
  loginGradientFrom?: string;
  loginGradientTo?: string;
  loginTextColor?: string;
  fontFamily?: string;
  headingFontFamily?: string;
  borderRadius?: string;
  buttonRadius?: string;
  features?: BrandingFeature[];
  footerText?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  customCss?: string;
  isActive?: boolean;
}

// Public branding for login page (limited fields)
export interface PublicBranding {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  loginBackgroundUrl?: string;
  brandName?: string;
  tagline?: string;
  primaryColor: string;
  loginGradientFrom: string;
  loginGradientTo: string;
  loginTextColor: string;
  fontFamily: string;
  features?: BrandingFeature[];
  footerText?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
}