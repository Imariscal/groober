import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { POSService } from './pos.service';
import {
  Sale,
  SaleProduct,
  SaleItem,
  SalePayment,
  InventoryMovement,
  Client,
} from '@/database/entities';

describe('POSService - Inventory Fix Tests', () => {
  let service: POSService;
  let dataSource: DataSource;
  let productRepository: Repository<SaleProduct>;
  let saleRepository: Repository<Sale>;
  let saleItemRepository: Repository<SaleItem>;
  let inventoryRepository: Repository<InventoryMovement>;
  let clientRepository: Repository<Client>;

  const clinicId = 'clinic-123';
  const userId = 'user-456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        POSService,
        {
          provide: getRepositoryToken(SaleProduct),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Sale),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SaleItem),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SalePayment),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(InventoryMovement),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<POSService>(POSService);
    dataSource = module.get<DataSource>(DataSource);
    productRepository = module.get(getRepositoryToken(SaleProduct));
    saleRepository = module.get(getRepositoryToken(Sale));
    saleItemRepository = module.get(getRepositoryToken(SaleItem));
    inventoryRepository = module.get(getRepositoryToken(InventoryMovement));
    clientRepository = module.get(getRepositoryToken(Client));
  });

  describe('createDraftSale', () => {
    it('Test 1: Debe crear venta DRAFT SIN validación de stock', async () => {
      // Arrange
      const product = {
        id: 'prod-1',
        clinicId,
        name: 'Dog Food',
        stockQuantity: 20,
        isActive: true,
      };

      const dto = {
        clinicId,
        items: [{ productId: 'prod-1', quantity: 25, unitPrice: 10 }],
        createdByUserId: userId,
      };

      const sale = {
        id: 'sale-1',
        status: 'DRAFT',
        clinicId,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(product as any);
      jest.spyOn(saleRepository, 'create').mockReturnValue(sale as any);
      jest.spyOn(saleRepository, 'save').mockResolvedValue(sale as any);
      jest.spyOn(saleItemRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(saleItemRepository, 'save').mockResolvedValue({} as any);

      // Act & Assert
      // Debe permitir crear venta aunque qty > stock
      // (Antes lanzaba erro en línea 145)
      const result = await service.createDraftSale(dto);

      expect(result.status).toBe('DRAFT');
      // Stock debe seguir siendo 20 (sin cambios)
      // Ninguna llamada a productRepository.save para decrementar stock
    });

    it('Test 2: No debe crear InventoryMovement en DRAFT', async () => {
      // Arrange
      const product = { id: 'prod-1', clinicId, stockQuantity: 20, isActive: true };
      const dto = {
        clinicId,
        items: [{ productId: 'prod-1', quantity: 12, unitPrice: 10 }],
        createdByUserId: userId,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(product as any);
      jest.spyOn(saleRepository, 'create').mockReturnValue({ id: 'sale-1' } as any);
      jest.spyOn(saleRepository, 'save').mockResolvedValue({ id: 'sale-1' } as any);
      jest.spyOn(saleItemRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(saleItemRepository, 'save').mockResolvedValue({} as any);

      // Act
      await service.createDraftSale(dto);

      // Assert
      // InventoryMovement.save() debe NO haber sido llamado
      expect(inventoryRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateDraftSale', () => {
    it('Test 3: Debe editar venta DRAFT sin validación de stock', async () => {
      // Arrange
      const sale = { id: 'sale-1', status: 'DRAFT', clinicId };
      const product = { id: 'prod-1', clinicId, stockQuantity: 5, isActive: true };

      const dto = {
        clinicId,
        items: [{ productId: 'prod-1', quantity: 30, unitPrice: 10 }],
      };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(product as any);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
      };

      jest
        .spyOn(saleItemRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      jest.spyOn(saleRepository, 'save').mockResolvedValue(sale as any);
      jest.spyOn(service, 'getSale').mockResolvedValue(sale as any);

      // Act
      // Debe permitir actualizar aunque qty > stock
      const result = await service.updateDraftSale('sale-1', dto);

      // Assert
      expect(result).toBeDefined();
      // No debe haber salido error por stock insuficiente
    });

    it('Test 4: No debe editar venta COMPLETED', async () => {
      // Arrange
      const sale = { id: 'sale-1', status: 'COMPLETED', clinicId };
      const dto = {
        items: [{ productId: 'prod-1', quantity: 5, unitPrice: 10 }],
      };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);

      // Act & Assert
      await expect(service.updateDraftSale('sale-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeSale', () => {
    it('Test 5: Debe completar venta con stock suficiente y crear InventoryMovement', async () => {
      // Arrange
      const sale = {
        id: 'sale-1',
        status: 'DRAFT',
        clinicId,
        items: [{ id: 'item-1', productId: 'prod-1', quantity: 12, unitPrice: 10 }],
      };

      const product = { id: 'prod-1', clinicId, name: 'Dog Food', stockQuantity: 20, isActive: true };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn()
            .mockResolvedValueOnce(product) // Primera llamada para producto
            .mockResolvedValueOnce(product), // Segunda llamada para actualizar
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          create: jest.fn().mockReturnValue({} as any),
          save: jest.fn().mockResolvedValue({} as any),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);
      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      // Act
      const result = await service.completeSale('sale-1', {
        items: [{ productId: 'prod-1', quantity: 12, unitPrice: 10 }],
        discountAmount: 0,
        taxAmount: 0,
      });

      // Assert
      expect(result.status).toBe('COMPLETED');
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.update).toHaveBeenCalled();
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        InventoryMovement,
        expect.objectContaining({
          movementType: 'OUT',
          reason: 'SALE',
          quantity: 12,
        }),
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('Test 6: Debe fallar completar venta con stock insuficiente', async () => {
      // Arrange
      const sale = {
        id: 'sale-1',
        status: 'DRAFT',
        clinicId,
        items: [{ productId: 'prod-1', quantity: 12 }],
      };

      const product = { id: 'prod-1', clinicId, name: 'Dog Food', stockQuantity: 5, isActive: true };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(product),
          update: jest.fn().mockResolvedValue({ affected: 0 }), // Falla porque 5 < 12
          create: jest.fn().mockReturnValue({} as any),
          save: jest.fn().mockResolvedValue({} as any),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);
      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      // Act & Assert
      await expect(
        service.completeSale('sale-1', {
          items: [{ productId: 'prod-1', quantity: 12, unitPrice: 10 }],
          discountAmount: 0,
          taxAmount: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      // Verificar ROLLBACK fue llamado
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      // Verificar sale.status sigue en DRAFT (validar en DB)
    });

    it('Test 7: Debe hacer rollback completo si item falla en el medio', async () => {
      // Arrange - 3 items, el 2do falla
      const sale = {
        id: 'sale-1',
        status: 'DRAFT',
        clinicId,
        items: [
          { productId: 'prod-1', quantity: 5, unitPrice: 10 },
          { productId: 'prod-2', quantity: 15, unitPrice: 10 }, // Este fallará
          { productId: 'prod-3', quantity: 5, unitPrice: 10 },
        ],
      };

      const product1 = { id: 'prod-1', clinicId, stockQuantity: 20, isActive: true };
      const product2 = { id: 'prod-2', clinicId, stockQuantity: 5, isActive: true }; // Stock insuficiente
      const product3 = { id: 'prod-3', clinicId, stockQuantity: 25, isActive: true };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest
            .fn()
            .mockResolvedValueOnce(product1) // Primer producto
            .mockResolvedValueOnce(product2) // Segundo producto (fallará)
            .mockResolvedValueOnce(product2), // Segunda búsqueda para error message
          update: jest
            .fn()
            .mockResolvedValueOnce({ affected: 1 }) // Item 1 success
            .mockResolvedValueOnce({ affected: 0 }), // Item 2 fail (5 < 15)
          create: jest.fn().mockReturnValue({} as any),
          save: jest.fn().mockResolvedValue({} as any),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);
      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      // Act & Assert
      await expect(
        service.completeSale('sale-1', {
          items: [
            { productId: 'prod-1', quantity: 5, unitPrice: 10 },
            { productId: 'prod-2', quantity: 15, unitPrice: 10 },
            { productId: 'prod-3', quantity: 5, unitPrice: 10 },
          ],
          discountAmount: 0,
          taxAmount: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      // Verificar:
      // - Item 1 UPDATE fue llamado una vez (1 éxito, 1 fallo, no item 3)
      expect(mockQueryRunner.manager.update).toHaveBeenCalledTimes(2);
      // - Rollback fue llamado
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      // - Commit NO fue llamado
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('Test 8: Debe rechazar producto inactivo', async () => {
      // Arrange
      const sale = {
        id: 'sale-1',
        status: 'DRAFT',
        clinicId,
        items: [{ productId: 'prod-1', quantity: 12 }],
      };

      const product = { id: 'prod-1', clinicId, name: 'Inactive Item', stockQuantity: 20, isActive: false };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(product),
          update: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);
      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      // Act & Assert
      await expect(
        service.completeSale('sale-1', {
          items: [{ productId: 'prod-1', quantity: 12, unitPrice: 10 }],
          discountAmount: 0,
          taxAmount: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('Test 9: Debe fallar si venta no está en DRAFT', async () => {
      // Arrange
      const sale = { id: 'sale-1', status: 'COMPLETED', clinicId };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);

      // Act & Assert
      await expect(
        service.completeSale('sale-1', {
          items: [{ productId: 'prod-1', quantity: 12, unitValue: 10 }],
          discountAmount: 0,
          taxAmount: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refundSale', () => {
    it('Test 10: Debe reembolsar venta COMPLETED y restaurar stock', async () => {
      // Arrange
      const sale = {
        id: 'sale-1',
        status: 'COMPLETED',
        clinicId,
        createdByUserId: userId,
        items: [{ id: 'item-1', productId: 'prod-1', quantity: 15 }],
      };

      const product = { id: 'prod-1', clinicId, stockQuantity: 35, isActive: true };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(product),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          create: jest.fn().mockReturnValue({} as any),
          save: jest.fn().mockResolvedValue({} as any),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);
      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      // Act
      const result = await service.refundSale('sale-1');

      // Assert
      expect(result.status).toBe('REFUNDED');
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(
        SaleProduct,
        { id: 'prod-1' },
        expect.any(Object),
      );
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        InventoryMovement,
        expect.objectContaining({
          movementType: 'IN',
          reason: 'RETURN',
          quantity: 15,
        }),
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('Test 11: No debe reembolsar venta no COMPLETED', async () => {
      // Arrange
      const sale = { id: 'sale-1', status: 'DRAFT', clinicId };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);

      // Act & Assert
      await expect(service.refundSale('sale-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('Edge Cases', () => {
    it('Test 12: No debe permitir cantidad negativa o cero', async () => {
      // Arrange
      const sale = {
        id: 'sale-1',
        status: 'DRAFT',
        clinicId,
        items: [{ productId: 'prod-1', quantity: 0 }],
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue({ id: 'prod-1', isActive: true }),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);
      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      // Act & Assert
      await expect(
        service.completeSale('sale-1', {
          items: [{ productId: 'prod-1', quantity: 0, unitPrice: 10 }],
          discountAmount: 0,
          taxAmount: 0,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('Test 13: Debe fallar si no encuentra producto', async () => {
      // Arrange
      const sale = {
        id: 'sale-1',
        status: 'DRAFT',
        clinicId,
      };

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          findOne: jest.fn().mockResolvedValue(null), // Producto no existe
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      };

      jest.spyOn(saleRepository, 'findOne').mockResolvedValue(sale as any);
      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(mockQueryRunner as any);

      // Act & Assert
      await expect(
        service.completeSale('sale-1', {
          items: [{ productId: 'invalid-prod', quantity: 12, unitPrice: 10 }],
          discountAmount: 0,
          taxAmount: 0,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
