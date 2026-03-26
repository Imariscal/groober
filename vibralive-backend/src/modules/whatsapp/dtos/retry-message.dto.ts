import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class RetryWhatsAppMessageDto {
  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  max_retries?: number; // Override max retries (if applicable)
}
