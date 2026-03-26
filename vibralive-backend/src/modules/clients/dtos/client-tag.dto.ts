import { IsString, Length } from 'class-validator';

export class ClientTagDto {
  @IsString()
  @Length(1, 50, {
    message: 'El tag debe tener entre 1 y 50 caracteres',
  })
  tag!: string;
}

export class ClientTagResponseDto {
  id!: string;
  clientId!: string;
  tag!: string;
  createdAt!: Date;
}
