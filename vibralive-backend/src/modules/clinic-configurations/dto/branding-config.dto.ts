import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsHexColor } from 'class-validator';
import { Type } from 'class-transformer';

export class BrandingFeatureDto {
  @IsString()
  icon!: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;
}

export class UpdateBrandingConfigDto {
  // Logo & Images
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  logoDarkUrl?: string;

  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @IsOptional()
  @IsString()
  loginBackgroundUrl?: string;

  // Brand Identity
  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  // Primary Colors
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  primaryColorLight?: string;

  @IsOptional()
  @IsString()
  primaryColorDark?: string;

  // Secondary/Accent Colors
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  // Navigation Colors
  @IsOptional()
  @IsString()
  sidebarBgColor?: string;

  @IsOptional()
  @IsString()
  sidebarTextColor?: string;

  @IsOptional()
  @IsString()
  sidebarActiveBg?: string;

  @IsOptional()
  @IsString()
  sidebarActiveText?: string;

  // TopBar Colors
  @IsOptional()
  @IsString()
  topbarBgColor?: string;

  @IsOptional()
  @IsString()
  topbarTextColor?: string;

  // Login Page
  @IsOptional()
  @IsString()
  loginGradientFrom?: string;

  @IsOptional()
  @IsString()
  loginGradientTo?: string;

  @IsOptional()
  @IsString()
  loginTextColor?: string;

  // Typography
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @IsOptional()
  @IsString()
  headingFontFamily?: string;

  // Border Radius
  @IsOptional()
  @IsString()
  borderRadius?: string;

  @IsOptional()
  @IsString()
  buttonRadius?: string;

  // Custom Features
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrandingFeatureDto)
  features?: BrandingFeatureDto[];

  // Footer & Legal
  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsString()
  privacyPolicyUrl?: string;

  @IsOptional()
  @IsString()
  termsUrl?: string;

  // Custom CSS
  @IsOptional()
  @IsString()
  customCss?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BrandingConfigResponseDto {
  id!: string;
  clinicId!: string;
  
  // Logo & Images
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  loginBackgroundUrl?: string;
  
  // Brand Identity
  brandName?: string;
  tagline?: string;
  
  // Primary Colors
  primaryColor!: string;
  primaryColorLight!: string;
  primaryColorDark!: string;
  
  // Secondary/Accent Colors
  secondaryColor!: string;
  accentColor!: string;
  
  // Navigation Colors
  sidebarBgColor!: string;
  sidebarTextColor!: string;
  sidebarActiveBg!: string;
  sidebarActiveText!: string;
  
  // TopBar Colors
  topbarBgColor!: string;
  topbarTextColor!: string;
  
  // Login Page
  loginGradientFrom!: string;
  loginGradientTo!: string;
  loginTextColor!: string;
  
  // Typography
  fontFamily!: string;
  headingFontFamily?: string;
  
  // Border Radius
  borderRadius!: string;
  buttonRadius!: string;
  
  // Custom Features
  features?: BrandingFeatureDto[];
  
  // Footer & Legal
  footerText?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  
  // Custom CSS
  customCss?: string;
  
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

// Public branding (limited fields for login page)
export class PublicBrandingDto {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  loginBackgroundUrl?: string;
  brandName?: string;
  tagline?: string;
  primaryColor!: string;
  loginGradientFrom!: string;
  loginGradientTo!: string;
  loginTextColor!: string;
  fontFamily!: string;
  features?: BrandingFeatureDto[];
  footerText?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
}
