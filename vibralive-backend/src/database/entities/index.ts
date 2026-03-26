export { Clinic } from './clinic.entity';
export { User } from './user.entity';
export { Client } from './client.entity';
export { ClientAddress } from './client-address.entity';
export { ClientTag } from './client-tag.entity';
export { Pet, PetSpecies, PetSex, PetSize } from './pet.entity';
export { Appointment } from './appointment.entity';
export { AppointmentGroup } from './appointment-group.entity';
export { WhatsAppOutbox } from './whatsapp-outbox.entity';
export { AnimalType } from './animal-type.entity';
export { Reminder } from './reminder.entity';
export { MessageLog } from './message-log.entity';
export { PlatformUser } from './platform-user.entity';
export { PlatformRole } from './platform-role.entity';
export { AuditLog } from './audit-log.entity';
export { GroomerRoute } from './groomer-route.entity';
export { GroomerRouteStop } from './groomer-route-stop.entity';
export { Service } from './service.entity';
export { ServiceSizePrice } from './service-size-price.entity';
export { PriceList } from './price-list.entity';
export { ServicePrice } from './service-price.entity';
export { ServicePackage } from './service-package.entity';
export { ServicePackageItem } from './service-package-item.entity';
export { ServicePackagePrice } from './service-package-price.entity';
export { SubscriptionPlan } from './subscription-plan.entity';
export { AppointmentItem } from './appointment-item.entity';
export { PriceListHistory } from './price-list-history.entity';
export { ClinicConfiguration, BusinessHours } from './clinic-configuration.entity';
export { ClinicCalendarException, CalendarExceptionType } from './clinic-calendar-exception.entity';
export { ClinicBillingConfig } from './clinic-billing-config.entity';
export { ClinicEmailConfig, EmailProvider } from './clinic-email-config.entity';
export { ClinicWhatsAppConfig, WhatsAppProvider } from './clinic-whatsapp-config.entity';
export { MessageTemplate, MessageChannel, MessageTrigger, MessageTiming } from './message-template.entity';
export { ClinicBranding } from './clinic-branding.entity';

// WhatsApp Messaging & Conversational Infrastructure
export { WhatsAppConversation, ConversationStatus } from './whatsapp-conversation.entity';
export { ConversationMessage, MessageDirection, MessageStatus } from './conversation-message.entity';
export { WhatsAppTemplate, TemplateStatus, TemplateCategory } from './whatsapp-template.entity';
export { WhatsAppWebhookEvent, WebhookEventType, ProcessingStatus } from './whatsapp-webhook-event.entity';
export { WhatsAppConversationTransition } from './whatsapp-conversation-transition.entity';

// RBAC Entities
export { Role } from './role.entity';
export { Permission } from './permission.entity';
export { RolePermission } from './role-permission.entity';
export { UserRole } from './user-role.entity';

// Domain Profiles
export { Stylist } from './stylist.entity';
export { StylistAvailability } from './stylist-availability.entity';
export { Veterinarian, VeterinarianSpecialty } from './veterinarian.entity';
export { VeterinarianAvailability } from './veterinarian-availability.entity';

// Campaigns Module
export { CampaignTemplate } from './campaign-template.entity';
export { Campaign, CampaignStatus } from './campaign.entity';
export { CampaignRecipient, RecipientStatus, CampaignChannel } from './campaign-recipient.entity';
export { EmailOutbox, EmailStatus } from './email-outbox.entity';
export { StylistUnavailablePeriod } from './stylist-unavailable-period.entity';
export { StylistCapacity } from './stylist-capacity.entity';
export { VeterinarianUnavailablePeriod, UnavailablePeriodReason } from './veterinarian-unavailable-period.entity';
export { VeterinarianCapacity } from './veterinarian-capacity.entity';

// Preventive Care Module
export { PetPreventiveCareEvent } from './pet-preventive-care-event.entity';
export { ReminderQueue } from './reminder-queue.entity';

// POS System
export { SaleProduct } from './sale-product.entity';
export { Sale } from './sale.entity';
export { SaleItem } from './sale-item.entity';
export { SalePayment } from './sale-payment.entity';
export { InventoryMovement } from './inventory-movement.entity';
// Medical Visits (EHR) - Electronic Health Records
export { MedicalVisit } from './medical-visit.entity';
export { MedicalVisitExam } from './medical-visit-exam.entity';
export { MedicalVisitDiagnosis } from './medical-visit-diagnosis.entity';
export { Prescription } from './prescription.entity';
export { Vaccine } from './vaccine.entity';
export { Vaccination } from './vaccination.entity';
export { MedicationAllergy } from './medication-allergy.entity';
export { DiagnosticOrder } from './diagnostic-order.entity';
export { DiagnosticTestResult } from './diagnostic-test-result.entity';
export { MedicalProcedure } from './medical-procedure.entity';
export { FollowUpNote } from './follow-up-note.entity';
export { MedicalAttachment } from './medical-attachment.entity';