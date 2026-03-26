import { api } from '@/lib/api';
import {
  ClinicConfiguration,
  ClinicCalendarException,
  CreateCalendarExceptionPayload,
  UpdateCalendarExceptionPayload,
  BillingConfig,
  EmailConfig,
  WhatsAppConfig,
  MessageTemplate,
  BrandingConfig,
  UpdateBrandingConfigPayload,
  PublicBranding,
} from '@/types';

class ClinicConfigurationsApi {
  /**
   * GET /clinic/configuration
   */
  async getConfiguration() {
    try {
      const response = await api.get('/clinic/configuration');
      const config = (response.data?.data || response.data) as ClinicConfiguration;
      return config;
    } catch (error: any) {
      console.error('[ClinicConfigurationsApi] Error fetching configuration:', error);
      throw error;
    }
  }

  /**
   * PUT /clinic/configuration
   */
  async updateConfiguration(payload: Partial<ClinicConfiguration>) {
    try {
      const response = await api.put('/clinic/configuration', payload);
      const config = (response.data?.data || response.data) as ClinicConfiguration;
      return config;
    } catch (error: any) {
      console.error('[ClinicConfigurationsApi] Error updating configuration:', error);
      throw error;
    }
  }

  /**
   * GET /clinic/calendar-exceptions
   */
  async getExceptions(from: string, to: string) {
    try {
      const response = await api.get('/clinic/calendar-exceptions', {
        params: { from, to },
      });
      const exceptions = (response.data?.data || response.data || []) as ClinicCalendarException[];
      return exceptions;
    } catch (error: any) {
      console.error('[ClinicConfigurationsApi] Error fetching exceptions:', error);
      return [];
    }
  }

  /**
   * POST /clinic/calendar-exceptions
   */
  async createException(payload: CreateCalendarExceptionPayload) {
    try {
      const response = await api.post('/clinic/calendar-exceptions', payload);
      const exception = (response.data?.data || response.data) as ClinicCalendarException;
      return exception;
    } catch (error: any) {
      console.error('[ClinicConfigurationsApi] Error creating exception:', error);
      throw error;
    }
  }

  /**
   * PATCH /clinic/calendar-exceptions/:id
   */
  async updateException(exceptionId: string, payload: UpdateCalendarExceptionPayload) {
    try {
      const response = await api.patch(`/clinic/calendar-exceptions/${exceptionId}`, payload);
      const exception = (response.data?.data || response.data) as ClinicCalendarException;
      return exception;
    } catch (error: any) {
      console.error('[ClinicConfigurationsApi] Error updating exception:', error);
      throw error;
    }
  }

  /**
   * DELETE /clinic/calendar-exceptions/:id
   */
  async deleteException(exceptionId: string) {
    try {
      await api.delete(`/clinic/calendar-exceptions/${exceptionId}`);
      return true;
    } catch (error: any) {
      console.error('[ClinicConfigurationsApi] Error deleting exception:', error);
      throw error;
    }
  }

  // =====================================================
  // BILLING CONFIG
  // =====================================================

  async getBillingConfig(clinicId: string): Promise<BillingConfig> {
    const response = await api.get(`/clinics/${clinicId}/config/billing`);
    return response.data?.data || response.data;
  }

  async updateBillingConfig(clinicId: string, payload: Partial<BillingConfig>): Promise<BillingConfig> {
    const response = await api.put(`/clinics/${clinicId}/config/billing`, payload);
    return response.data?.data || response.data;
  }

  // =====================================================
  // EMAIL CONFIG
  // =====================================================

  async getEmailConfig(clinicId: string): Promise<EmailConfig> {
    const response = await api.get(`/clinics/${clinicId}/config/email`);
    return response.data?.data || response.data;
  }

  async updateEmailConfig(clinicId: string, payload: Partial<EmailConfig>): Promise<EmailConfig> {
    const response = await api.put(`/clinics/${clinicId}/config/email`, payload);
    return response.data?.data || response.data;
  }

  async testEmailConfig(clinicId: string, testEmail: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/clinics/${clinicId}/config/email/test`, { testEmail });
    return response.data?.data || response.data;
  }

  // =====================================================
  // WHATSAPP CONFIG
  // =====================================================

  async getWhatsAppConfig(clinicId: string): Promise<WhatsAppConfig> {
    const response = await api.get(`/clinics/${clinicId}/config/whatsapp`);
    return response.data?.data || response.data;
  }

  async updateWhatsAppConfig(clinicId: string, payload: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    const response = await api.put(`/clinics/${clinicId}/config/whatsapp`, payload);
    return response.data?.data || response.data;
  }

  async testWhatsAppConfig(clinicId: string, testPhone: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/clinics/${clinicId}/config/whatsapp/test`, { testPhone });
    return response.data?.data || response.data;
  }

  // =====================================================
  // MESSAGE TEMPLATES
  // =====================================================

  async getTemplates(clinicId: string, channel?: string, trigger?: string): Promise<MessageTemplate[]> {
    const params: any = {};
    if (channel) params.channel = channel;
    if (trigger) params.trigger = trigger;
    const response = await api.get(`/clinics/${clinicId}/config/templates`, { params });
    return response.data?.data || response.data || [];
  }

  async getTemplateVariables(): Promise<Record<string, string[]>> {
    const response = await api.get(`/clinics/any/config/templates/variables`);
    return response.data?.data || response.data;
  }

  async getTemplate(clinicId: string, templateId: string): Promise<MessageTemplate> {
    const response = await api.get(`/clinics/${clinicId}/config/templates/${templateId}`);
    return response.data?.data || response.data;
  }

  async createTemplate(clinicId: string, payload: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const response = await api.post(`/clinics/${clinicId}/config/templates`, payload);
    return response.data?.data || response.data;
  }

  async updateTemplate(clinicId: string, templateId: string, payload: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const response = await api.put(`/clinics/${clinicId}/config/templates/${templateId}`, payload);
    return response.data?.data || response.data;
  }

  async deleteTemplate(clinicId: string, templateId: string): Promise<void> {
    await api.delete(`/clinics/${clinicId}/config/templates/${templateId}`);
  }

  async duplicateTemplate(clinicId: string, templateId: string): Promise<MessageTemplate> {
    const response = await api.post(`/clinics/${clinicId}/config/templates/${templateId}/duplicate`);
    return response.data?.data || response.data;
  }

  async seedDefaultTemplates(clinicId: string): Promise<{ message: string; count: number }> {
    const response = await api.post(`/clinics/${clinicId}/config/templates/seed`);
    return response.data?.data || response.data;
  }

  // Aliases for compatibility
  getMessageTemplates = this.getTemplates.bind(this);
  createMessageTemplate = this.createTemplate.bind(this);
  updateMessageTemplate = this.updateTemplate.bind(this);
  deleteMessageTemplate = this.deleteTemplate.bind(this);

  // =====================================================
  // BRANDING CONFIG
  // =====================================================

  async getBrandingConfig(clinicId: string): Promise<BrandingConfig> {
    const response = await api.get(`/clinics/${clinicId}/config/branding`);
    return response.data?.data || response.data;
  }

  async updateBrandingConfig(clinicId: string, payload: UpdateBrandingConfigPayload): Promise<BrandingConfig> {
    const response = await api.put(`/clinics/${clinicId}/config/branding`, payload);
    return response.data?.data || response.data;
  }

  async resetBrandingConfig(clinicId: string): Promise<BrandingConfig> {
    const response = await api.delete(`/clinics/${clinicId}/config/branding`);
    return response.data?.data || response.data;
  }

  // Get clinic branding for logged-in users (sidebar/topbar)
  async getClinicBranding(clinicId: string): Promise<PublicBranding> {
    const response = await api.get(`/clinics/${clinicId}/branding`);
    return response.data?.data || response.data;
  }

  // Public branding for login page (no auth required)
  async getPublicBranding(clinicSlugOrId: string): Promise<PublicBranding> {
    const response = await api.get(`/public/branding/${clinicSlugOrId}`);
    return response.data?.data || response.data;
  }
}

export const clinicConfigurationsApi = new ClinicConfigurationsApi();
