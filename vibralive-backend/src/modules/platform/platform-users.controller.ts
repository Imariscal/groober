import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  RequirePlatformRole,
  RequirePermission,
} from '../../common/decorators';
import { PlatformRoleGuard, PermissionGuard } from '../../common/guards';
import { PlatformUsersService, CreatePlatformUserDto, UpdatePlatformUserDto } from './platform-users.service';

@Controller('platform/users')
@UseGuards(AuthGuard, PlatformRoleGuard, PermissionGuard)
export class PlatformUsersController {
  constructor(private usersService: PlatformUsersService) {}

  @Get()
  @RequirePermission('users:read')
  async listUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.listUsers({
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      status,
      role,
      search,
    });
  }

  @Get('roles')
  @RequirePermission('users:read')
  async getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  @RequirePermission('users:read')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('users:create')
  async createUser(@Body() dto: CreatePlatformUserDto) {
    return this.usersService.createUser(dto);
  }

  @Patch(':id')
  @RequirePermission('users:update')
  async updateUser(@Param('id') id: string, @Body() dto: UpdatePlatformUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @RequirePermission('users:delete')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
