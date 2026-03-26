import { IsString, IsInt, IsOptional, IsBoolean, ValidateIf, IsArray } from 'class-validator';

export class CreateVaccineDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diseasesCovered?: string[];

  @IsOptional()
  @IsBoolean()
  isSingleDose?: boolean;

  /**
   * Solo validar como entero si NO es dosis única
   * Para dosis única, boosterDays debe ser undefined/null
   */
  @ValidateIf((obj: CreateVaccineDto) => !obj.isSingleDose)
  @IsOptional()
  @IsInt()
  boosterDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
