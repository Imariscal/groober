import {
  IsString,
  IsOptional,
  IsDateString,
  Length,
} from 'class-validator';

export class CreateFollowUpNoteDto {
  @IsString()
  @Length(1, 5000)
  noteContent!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  statusUpdate?: string;

  @IsOptional()
  @IsDateString()
  noteDate?: string; // If not provided, backend will use current timestamp
}
