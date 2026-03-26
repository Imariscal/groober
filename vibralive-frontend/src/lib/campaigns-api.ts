/**
 * Campaigns API Service
 * Capa de abstracción para todas las operaciones CRUD con campañas
 * Maneja: crear, listar, obtener, actualizar, ejecutar, pausar, reanudar campañas
 */

import { apiClient } from './api-client';

export interface CampaignTemplate {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  channel: 'WHATSAPP' | 'EMAIL';
  subject?: string;
  body: string;
  bodyHtml?: string;
  variablesJson?: { variables: string[] };
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignFilter {
  species?: string[];
  breed?: string[];
  sex?: string[];
  size?: string[];
  sterilized?: boolean;
  age?: { min: number; max: number };
  microchip?: boolean;
  active?: boolean;
  clientHasWhatsapp?: boolean;
  clientHasEmail?: boolean;
  clientActive?: boolean;
  createdAfter?: string;
  lastVisitDate?: { after: string; before: string };
  petCount?: { min: number; max: number };
}

export interface Campaign {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  channel: 'WHATSAPP' | 'EMAIL';
  campaignTemplateId: string;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
  filtersJson: CampaignFilter;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedRecipients: number;
  actualRecipients: number;
  successfulCount: number;
  failedCount: number;
  skippedCount: number;
  openedCount: number;
  readCount: number;
  isRecurring?: boolean;
  recurrenceType?: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  lastSentAt?: string;
  nextScheduledAt?: string;
  createdByUserId: string;
  pausedByUserId?: string;
  pausedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  clinicId: string;
  clientId: string;
  petId: string;
  channel: 'WHATSAPP' | 'EMAIL';
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  status: 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'OPENED' | 'FAILED' | 'SKIPPED';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  openedAt?: string;
  failedAt?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface CampaignMetrics {
  campaign: Campaign;
  deliveryStats: {
    sent: number;
    delivered: number;
    read: number;
    opened: number;
    failed: number;
  };
  openRate: number;
  conversionRate: number;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  campaignTemplateId: string;
  channel: 'WHATSAPP' | 'EMAIL';
  filter: CampaignFilter;
  scheduledAt?: string;
  isRecurring?: boolean;
  recurrenceType?: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  filter?: CampaignFilter;
  scheduledAt?: string;
  isRecurring?: boolean;
  recurrenceType?: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
}

export interface ListCampaignsResponse {
  data: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export interface AudiencePreviewResponse {
  estimatedCount: number;
  previewCount: number;
  preview: Array<{
    clientId: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    petId: string;
    petName: string;
  }>;
}

// ============================================================================
// Campaigns
// ============================================================================

export const campaignsApi = {
  /**
   * Listar campañas
   */
  async listCampaigns(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<ListCampaignsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await apiClient.get(`/campaigns?${params.toString()}`);
    return response;
  },

  /**
   * Obtener detalle de una campaña
   */
  async getCampaign(campaignId: string): Promise<Campaign> {
    const response = await apiClient.get(`/campaigns/${campaignId}`);
    return response;
  },

  /**
   * Crear una nueva campaña
   */
  async createCampaign(dto: CreateCampaignDto): Promise<Campaign> {
    const response = await apiClient.post(`/campaigns`, dto);
    return response;
  },

  /**
   * Actualizar una campaña (solo en estado DRAFT)
   */
  async updateCampaign(campaignId: string, dto: UpdateCampaignDto): Promise<Campaign> {
    const response = await apiClient.patch(`/campaigns/${campaignId}`, dto);
    return response;
  },

  /**
   * Eliminar una campaña (solo en estado DRAFT)
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    await apiClient.delete(`/campaigns/${campaignId}`);
  },

  /**
   * Iniciar ejecución de una campaña
   */
  async startCampaign(campaignId: string): Promise<Campaign> {
    const response = await apiClient.post(`/campaigns/${campaignId}/start`, {});
    return response;
  },

  /**
   * Pausar una campaña en ejecución
   */
  async pauseCampaign(campaignId: string): Promise<Campaign> {
    const response = await apiClient.post(`/campaigns/${campaignId}/pause`, {});
    return response;
  },

  /**
   * Reanudar una campaña pausada
   */
  async resumeCampaign(campaignId: string): Promise<Campaign> {
    const response = await apiClient.post(`/campaigns/${campaignId}/resume`, {});
    return response;
  },

  /**
   * Obtener métricas de una campaña
   */
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const response = await apiClient.get(`/campaigns/${campaignId}/metrics`);
    return response;
  },

  /**
   * Listar destinatarios de una campaña
   */
  async getCampaignRecipients(
    campaignId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: CampaignRecipient[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiClient.get(`/campaigns/${campaignId}/recipients?${params.toString()}`);
    return response;
  },

  /**
   * Preview de audiencia (sin crear campaña)
   */
  async previewAudience(campaignTemplateId: string, filter: CampaignFilter): Promise<AudiencePreviewResponse> {
    const response = await apiClient.post(`/campaigns/audience/preview`, {
      campaignTemplateId,
      filter,
    });
    return response;
  },
};

// ============================================================================
// Campaign Templates
// ============================================================================

export interface CreateCampaignTemplateDto {
  name: string;
  description?: string;
  channel: 'WHATSAPP' | 'EMAIL';
  subject?: string;
  body: string;
  bodyHtml?: string;
  whatsappTemplateName?: string;
  whatsappTemplateLanguage?: string;
}

export interface UpdateCampaignTemplateDto {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  bodyHtml?: string;
  isActive?: boolean;
}

export interface ListCampaignTemplatesResponse {
  data: CampaignTemplate[];
  total: number;
  page: number;
  limit: number;
}

export interface RenderTemplateResponse {
  rendered: string;
  variables: string[];
}

export const campaignTemplatesApi = {
  /**
   * Listar templates de campañas
   */
  async listTemplates(
    page: number = 1,
    limit: number = 20,
    channel?: string,
    isActive?: boolean,
  ): Promise<CampaignTemplate[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (channel) params.append('channel', channel);
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    const response = await apiClient.get(`/campaign-templates?${params.toString()}`);
    return response;
  },

  /**
   * Obtener detalle de un template
   */
  async getTemplate(templateId: string): Promise<CampaignTemplate> {
    const response = await apiClient.get(`/campaign-templates/${templateId}`);
    return response;
  },

  /**
   * Crear nuevo template
   */
  async createTemplate(dto: CreateCampaignTemplateDto): Promise<CampaignTemplate> {
    const response = await apiClient.post(`/campaign-templates`, dto);
    return response;
  },

  /**
   * Actualizar un template
   */
  async updateTemplate(
    templateId: string,
    dto: UpdateCampaignTemplateDto,
  ): Promise<CampaignTemplate> {
    const response = await apiClient.patch(`/campaign-templates/${templateId}`, dto);
    return response;
  },

  /**
   * Eliminar un template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`/campaign-templates/${templateId}`);
  },

  /**
   * Preview de template con datos de ejemplo
   */
  async previewTemplate(templateId: string): Promise<RenderTemplateResponse> {
    const response = await apiClient.get(`/campaign-templates/${templateId}/preview`);
    return response;
  },

  /**
   * Renderizar template con contexto específico
   */
  async renderTemplate(
    templateId: string,
    context: Record<string, any>,
  ): Promise<RenderTemplateResponse> {
    const response = await apiClient.post(`/campaign-templates/${templateId}/render`, {
      context,
    });
    return response;
  },

  /**
   * Obtener variables soportadas
   */
  async getSupportedVariables(): Promise<{ variables: string[] }> {
    const response = await apiClient.get(`/campaign-templates/variables/supported`);
    return response;
  },
};
