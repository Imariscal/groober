import { IsString, IsOptional, IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PackageItemDto {
  @IsUUID()
  serviceId!: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class CreateServicePackageDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  items!: PackageItemDto[];
}
