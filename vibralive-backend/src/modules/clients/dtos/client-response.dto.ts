import { ClientAddressResponseDto } from '../../addresses/dtos';

export class PetResponseDto {
  id!: string;
  clinic_id!: string;
  client_id!: string;
  name!: string;
  species!: string;
  breed?: string;
  date_of_birth?: Date;
  sex!: string;
  is_sterilized!: boolean;
  color?: string;
  size?: string;
  microchip_number?: string;
  tag_number?: string;
  external_reference?: string;
  notes?: string;
  allergies?: string;
  blood_type?: string;
  is_deceased!: boolean;
  deceased_at?: Date;
  created_at!: Date;
  updated_at!: Date;
}

export class ClientResponseDto {
  id!: string;
  clinicId!: string;
  name!: string;
  phone!: string;
  email?: string;
  address?: string;
  notes?: string;
  priceListId?: string;

  // Nuevos campos
  whatsappNumber?: string;
  phoneSecondary?: string;
  preferredContactMethod!: string;
  preferredContactTimeStart?: string;
  preferredContactTimeEnd?: string;
  housingType?: string;
  accessNotes?: string;
  serviceNotes?: string;
  doNotContact!: boolean;
  doNotContactReason?: string;
  status!: string;

  // Relaciones
  tags?: string[];
  addresses?: ClientAddressResponseDto[];
  pets?: PetResponseDto[];

  createdAt!: Date;
  updatedAt!: Date;
}
