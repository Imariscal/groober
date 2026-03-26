/**
 * Controlador de rutas para exponer endpoints de optimización.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { RoutesService } from '../services/routes.service';
import { RouteOptimizerService } from '../services/route-optimizer.service';
import {
  OptimizationRequest,
  OptimizationResponse,
  OptimizationConfig,
} from '../dto/route-optimizer.dto';

@Controller('routes')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class RoutesController {
  constructor(
    private readonly routesService: RoutesService,
    private readonly optimizerService: RouteOptimizerService,
  ) {}

  @Get('health')
  @RequirePermission('appointments:read')
  async checkHealth() {
    const healthy = await this.routesService.checkOptimizerHealth();
    return {
      optimizer_available: healthy,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('optimize')
  @RequirePermission('appointments:create')
  async optimizeRoutes(
    @Body()
    body: {
      clinic_id: string;
      date: string;
      config?: Partial<OptimizationConfig>;
    },
  ): Promise<OptimizationResponse> {
    const date = new Date(body.date);

    if (isNaN(date.getTime())) {
      throw new HttpException('Fecha inválida', HttpStatus.BAD_REQUEST);
    }

    return this.routesService.optimizeRoutesForDate(
      body.clinic_id,
      date,
      body.config,
    );
  }

  @Post('optimize/raw')
  @RequirePermission('appointments:create')
  async optimizeRaw(
    @Body() request: OptimizationRequest,
  ): Promise<OptimizationResponse> {
    return this.optimizerService.optimize(request);
  }

  @Post('optimize/validate')
  @RequirePermission('appointments:read')
  async validateOptimization(@Body() request: OptimizationRequest) {
    return this.optimizerService.validate(request);
  }

  @Get('optimize/config')
  @RequirePermission('appointments:read')
  async getConfigDefaults() {
    return this.optimizerService.getConfigDefaults();
  }

  @Get('optimize/example')
  @RequirePermission('appointments:read')
  async getExample() {
    return this.optimizerService.getExample();
  }
}
