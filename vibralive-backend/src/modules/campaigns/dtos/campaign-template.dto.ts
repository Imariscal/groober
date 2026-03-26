import { IsString, IsNotEmpty, IsOptional, IsEnum, IsJSON, IsUUID } from 'class-validator';
import { CampaignChannel } from '@/database/entities/campaign-template.entity';

export class CreateCampaignTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CampaignChannel)
  @IsNotEmpty()
  channel!: CampaignChannel;

  // Email fields
  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsString()
  @IsOptional()
  bodyHtml?: string;

  @IsString()
  @IsOptional()
  previewText?: string;

  // WhatsApp fields
  @IsString()
  @IsOptional()
  whatsappTemplateName?: string;

  @IsString()
  @IsOptional()
  whatsappTemplateLanguage?: string;

  // Variables
  @IsOptional()
  @IsJSON()
  variablesJson?: Record<string, string[]>;
}

export class UpdateCampaignTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  bodyHtml?: string;

  @IsString()
  @IsOptional()
  previewText?: string;

  @IsOptional()
  @IsJSON()
  variablesJson?: Record<string, string[]>;

  @IsOptional()
  isActive?: boolean;
}

export class PreviewCampaignTemplateDto {
  @IsUUID()
  @IsNotEmpty()
  templateId!: string;

  // Sample context for variable rendering
  @IsOptional()
  context?: Record<string, any>;
}
