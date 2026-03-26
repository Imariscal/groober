import {
  IsString,
  IsOptional,
  IsDateString,
  Length,
} from 'class-validator';

export class UpdateFollowUpNoteDto {
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  noteContent?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  statusUpdate?: string;

  @IsOptional()
  @IsDateString()
  noteDate?: string;
}
