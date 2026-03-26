import {
  IsUUID,
  IsString,
  IsISO8601,
  Length,
} from 'class-validator';

export class SignMedicalRecordDto {
  @IsUUID()
  medicalVisitId!: string;

  @IsString()
  @Length(1, 50000)
  signatureImage!: string; // base64 encoded image data (canvas drawing)

  @IsISO8601()
  timestamp!: string; // ISO 8601 format (UTC)
}
