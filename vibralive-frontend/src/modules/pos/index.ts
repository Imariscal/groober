/**
 * POS MODULE - Componentes y Servicios
 * 
 * Este módulo implementa el sistema de Punto de Venta (POS) con:
 * - Componentes React para gestionar ventas
 * - Store Zustand para estado global
 * - API client con interceptor para validaciones
 * - Implementación de la GOLDEN RULE del POS
 */

// ============ STORES ============
export { useSaleStore, type SaleStatus, type Sale, type SaleItem } from './stores/saleStore';

// ============ COMPONENTS ============
export { SaleStatusBadge } from './components/SaleStatusBadge';
export { SaleActions } from './components/SaleActions';
export { SaleDetails } from './components/SaleDetails';
export { EditSaleModal } from './components/EditSaleModal';
export { SalesList } from './components/SalesList';

// ============ SERVICES ============
export { posApi, pos, default as posApiInstance } from './services/api';
