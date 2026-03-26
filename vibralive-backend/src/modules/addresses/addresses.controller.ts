import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';
import { ClientAddressesService } from './addresses.service';
import {
  CreateClientAddressDto,
  UpdateClientAddressDto,
  SetDefaultAddressDto,
} from './dtos';

@Controller('clients/:clientId/addresses')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ClientAddressesController {
  constructor(private readonly addressesService: ClientAddressesService) {}

  @Get()
  @RequirePermission('clients:read')
  async getAddresses(
    @CurrentClinicId() clinicId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.addressesService.getClientAddresses(clinicId, clientId);
  }

  @Post()
  @HttpCode(201)
  @RequirePermission('clients:update')
  async createAddress(
    @CurrentClinicId() clinicId: string,
    @Param('clientId') clientId: string,
    @Body() dto: CreateClientAddressDto,
  ) {
    return this.addressesService.createAddress(clinicId, clientId, dto);
  }

  @Put(':addressId')
  @RequirePermission('clients:update')
  async updateAddress(
    @CurrentClinicId() clinicId: string,
    @Param('clientId') clientId: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateClientAddressDto,
  ) {
    return this.addressesService.updateAddress(
      clinicId,
      clientId,
      addressId,
      dto,
    );
  }

  @Delete(':addressId')
  @HttpCode(204)
  @RequirePermission('clients:update')
  async deleteAddress(
    @CurrentClinicId() clinicId: string,
    @Param('clientId') clientId: string,
    @Param('addressId') addressId: string,
  ) {
    await this.addressesService.deleteAddress(clinicId, clientId, addressId);
  }

  @Post(':addressId/set-default')
  @RequirePermission('clients:update')
  async setDefaultAddress(
    @CurrentClinicId() clinicId: string,
    @Param('clientId') clientId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.addressesService.setDefaultAddress(clinicId, clientId, addressId);
  }
}
