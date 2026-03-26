import { create } from 'zustand';

export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

export interface SaleItem {
  id?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  clinicId: string;
  status: SaleStatus;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  clientId?: string;
  notes?: string;
  createdAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
}

interface SaleStoreState {
  // State
  sale: Sale | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  // Actions
  setSale: (sale: Sale) => void;
  updateSale: (updates: Partial<Sale>) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearSale: () => void;
  addItem: (item: SaleItem) => void;
  removeItem: (productId: string) => void;
  updateItem: (productId: string, updates: Partial<SaleItem>) => void;
  setDiscount: (amount: number) => void;
  setTax: (amount: number) => void;
  calculateTotals: () => void;
}

export const useSaleStore = create<SaleStoreState>((set, get) => ({
  // Initial state
  sale: null,
  isLoading: false,
  error: null,
  successMessage: null,

  // Actions
  setSale: (sale) => {
    set({ sale, error: null });
  },

  updateSale: (updates) => {
    set((state) => ({
      sale: state.sale ? { ...state.sale, ...updates } : null,
      error: null,
    }));
  },

  setError: (error) => {
    set({ error });
  },

  setSuccessMessage: (message) => {
    set({ successMessage: message });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  clearSale: () => {
    set({
      sale: null,
      error: null,
      successMessage: null,
      isLoading: false,
    });
  },

  addItem: (item) => {
    set((state) => {
      if (!state.sale) return state;

      const newItems = [...state.sale.items, item];
      const newSubtotal = newItems.reduce((sum, i) => sum + i.subtotal, 0);

      return {
        sale: {
          ...state.sale,
          items: newItems,
          subtotal: newSubtotal,
          totalAmount: newSubtotal - state.sale.discountAmount + state.sale.taxAmount,
        },
      };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      if (!state.sale) return state;

      const newItems = state.sale.items.filter((item) => item.productId !== productId);
      const newSubtotal = newItems.reduce((sum, i) => sum + i.subtotal, 0);

      return {
        sale: {
          ...state.sale,
          items: newItems,
          subtotal: newSubtotal,
          totalAmount: newSubtotal - state.sale.discountAmount + state.sale.taxAmount,
        },
      };
    });
  },

  updateItem: (productId, updates) => {
    set((state) => {
      if (!state.sale) return state;

      const newItems = state.sale.items.map((item) => {
        if (item.productId !== productId) return item;

        const updatedItem = { ...item, ...updates };
        updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice;
        return updatedItem;
      });

      const newSubtotal = newItems.reduce((sum, i) => sum + i.subtotal, 0);

      return {
        sale: {
          ...state.sale,
          items: newItems,
          subtotal: newSubtotal,
          totalAmount: newSubtotal - state.sale.discountAmount + state.sale.taxAmount,
        },
      };
    });
  },

  setDiscount: (amount) => {
    set((state) => {
      if (!state.sale) return state;

      return {
        sale: {
          ...state.sale,
          discountAmount: amount,
          totalAmount: state.sale.subtotal - amount + state.sale.taxAmount,
        },
      };
    });
  },

  setTax: (amount) => {
    set((state) => {
      if (!state.sale) return state;

      return {
        sale: {
          ...state.sale,
          taxAmount: amount,
          totalAmount: state.sale.subtotal - state.sale.discountAmount + amount,
        },
      };
    });
  },

  calculateTotals: () => {
    set((state) => {
      if (!state.sale) return state;

      const subtotal = state.sale.items.reduce((sum, item) => sum + item.subtotal, 0);
      const totalAmount = subtotal - state.sale.discountAmount + state.sale.taxAmount;

      return {
        sale: {
          ...state.sale,
          subtotal,
          totalAmount,
        },
      };
    });
  },
}));
