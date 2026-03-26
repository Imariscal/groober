import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from '@/database/entities/clinic.entity';
import { Sale } from '@/database/entities/sale.entity';
import { SaleProduct } from '@/database/entities/sale-product.entity';
import { SaleItem } from '@/database/entities/sale-item.entity';
import { SalePayment } from '@/database/entities/sale-payment.entity';
import { InventoryMovement } from '@/database/entities/inventory-movement.entity';
import { Client } from '@/database/entities/client.entity';
import { Appointment } from '@/database/entities/appointment.entity';
import { AppointmentItem } from '@/database/entities/appointment-item.entity';
import { Service } from '@/database/entities/service.entity';
import { POSService } from './services/pos.service';
import { POSController } from './controllers/pos.controller';
import { SaleRepository } from './repositories/sale.repository';
import { SaleProductRepository } from './repositories/sale-product.repository';
import { InventoryMovementRepository } from './repositories/inventory-movement.repository';

/**
 * POSModule
 * Manages point-of-sale operations:
 * - Product catalog management
 * - Sales transactions
 * - Inventory tracking
 * - Payments and refunds
 * - Appointment-to-Sale conversion
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clinic,
      Sale,
      SaleProduct,
      SaleItem,
      SalePayment,
      InventoryMovement,
      Client,
      Appointment,
      AppointmentItem,
      Service,
    ]),
  ],
  controllers: [POSController],
  providers: [
    POSService,
    SaleRepository,
    SaleProductRepository,
    InventoryMovementRepository,
  ],
  exports: [POSService],
})
export class POSModule {}
