/**
 * Módulo de rutas para optimización de citas a domicilio.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic, GroomerRoute, GroomerRouteStop, Appointment, Stylist } from '@/database/entities';

import { RoutesController } from './controllers/routes.controller';
import { RoutesService } from './services/routes.service';
import { RouteOptimizerService } from './services/route-optimizer.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Clinic, GroomerRoute, GroomerRouteStop, Appointment, Stylist]),
  ],
  controllers: [RoutesController],
  providers: [RoutesService, RouteOptimizerService],
  exports: [RoutesService, RouteOptimizerService],
})
export class RoutesModule {}
