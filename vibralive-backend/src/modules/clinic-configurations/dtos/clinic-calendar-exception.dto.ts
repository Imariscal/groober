import { CalendarExceptionType } from '@/database/entities';
import { IsString, IsEnum, IsOptional, Matches, IsIn } from 'class-validator';

export class CreateClinicCalendarExceptionDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string; // YYYY-MM-DD

  @IsIn(Object.values(CalendarExceptionType), {
    message: `type must be one of: CLOSED, SPECIAL_HOURS`,
  })
  type!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime?: string; // HH:mm

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime?: string; // HH:mm

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateClinicCalendarExceptionDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;

  @IsOptional()
  @IsIn(Object.values(CalendarExceptionType), {
    message: `type must be one of: CLOSED, SPECIAL_HOURS`,
  })
  type?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
