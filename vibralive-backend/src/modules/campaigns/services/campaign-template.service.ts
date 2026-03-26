import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CampaignTemplate, CampaignChannel } from '@/database/entities/campaign-template.entity';
import { CreateCampaignTemplateDto, UpdateCampaignTemplateDto } from '../dtos';
import { CampaignTemplateRepository } from '../repositories';
import { TemplateRendererService } from '@/shared/services/template-renderer.service';

@Injectable()
export class CampaignTemplateService {
  constructor(
    private readonly templateRepo: CampaignTemplateRepository,
    private readonly renderer: TemplateRendererService,
  ) {}

  /**
   * Get template by ID with authorization check
   */
  async getTemplate(clinicId: string, templateId: string): Promise<CampaignTemplate> {
    const template = await this.templateRepo.findById(templateId);

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    if (template.clinicId !== clinicId) {
      throw new ForbiddenException('Cannot access template from another clinic');
    }

    return template;
  }

  /**
   * List templates for clinic
   */
  async listTemplates(
    clinicId: string,
    options?: { channel?: CampaignChannel; isActive?: boolean },
  ): Promise<CampaignTemplate[]> {
    return this.templateRepo.findByClinicId(clinicId, options);
  }

  /**
   * Create new campaign template
   */
  async createTemplate(
    clinicId: string,
    createdByUserId: string,
    dto: CreateCampaignTemplateDto,
  ): Promise<CampaignTemplate> {
    // Validate required fields for channel
    if (dto.channel === CampaignChannel.EMAIL && !dto.subject) {
      throw new BadRequestException('Email templates must have a subject');
    }

    if (dto.channel === CampaignChannel.WHATSAPP && !dto.whatsappTemplateName) {
      throw new BadRequestException(
        'WhatsApp templates must have a WhatsApp template name',
      );
    }

    // Validate body for variables
    this.renderer.validateVariables(dto.body);
    if (dto.bodyHtml) {
      this.renderer.validateVariables(dto.bodyHtml);
    }
    if (dto.subject) {
      this.renderer.validateVariables(dto.subject);
    }

    // Extract variables from body
    const variables = this.renderer.detectVariables(dto.body);
    const variablesJson = variables.length > 0 ? { variables } : undefined;

    const template = await this.templateRepo.create({
      clinicId,
      createdByUserId,
      ...dto,
      variablesJson,
    });

    return template;
  }

  /**
   * Update existing template
   */
  async updateTemplate(
    clinicId: string,
    templateId: string,
    dto: UpdateCampaignTemplateDto,
  ): Promise<CampaignTemplate> {
    const template = await this.getTemplate(clinicId, templateId);

    // Validate body if provided
    if (dto.body) {
      this.renderer.validateVariables(dto.body);
    }

    if (dto.bodyHtml) {
      this.renderer.validateVariables(dto.bodyHtml);
    }

    if (dto.subject) {
      this.renderer.validateVariables(dto.subject);
    }

    // Reextract variables if body changed
    const updatedBody = dto.body || template.body;
    const variables = this.renderer.detectVariables(updatedBody);
    const variablesJson = variables.length > 0 ? { variables } : undefined;

    const updates = {
      ...dto,
      variablesJson,
      updatedAt: new Date(),
    };

    return this.templateRepo.update(templateId, updates);
  }

  /**
   * Delete template
   * Cannot delete if template is in use by active campaigns
   */
  async deleteTemplate(clinicId: string, templateId: string): Promise<void> {
    const template = await this.getTemplate(clinicId, templateId);

    // TODO: Check if template is used by any campaign
    // const campaignCount = await campaignRepo.countByTemplateId(templateId);
    // if (campaignCount > 0) {
    //   throw new BadRequestException('Cannot delete template used by campaigns');
    // }

    const deleted = await this.templateRepo.delete(templateId);
    if (!deleted) {
      throw new NotFoundException('Template not found for deletion');
    }
  }

  /**
   * Test rendering template with sample data
   */
  previewTemplate(template: CampaignTemplate): { body: string; html?: string; subject?: string } {
    return {
      body: this.renderer.preview(template.body),
      html: template.bodyHtml ? this.renderer.preview(template.bodyHtml) : undefined,
      subject: template.subject ? this.renderer.preview(template.subject) : undefined,
    };
  }

  /**
   * Render template with actual context
   */
  renderTemplate(
    template: CampaignTemplate,
    context: Record<string, any>,
  ): { body: string; html?: string; subject?: string } {
    return {
      body: this.renderer.render(template.body, context),
      html: template.bodyHtml ? this.renderer.render(template.bodyHtml, context) : undefined,
      subject: template.subject
        ? this.renderer.render(template.subject, context)
        : undefined,
    };
  }

  /**
   * Get all supported variables for UI
   */
  getSupportedVariables() {
    return this.renderer.getSupportedVariables();
  }
}
