/**
 * API Service for Notifications
 */

import { create } from 'zustand';
import api from '@/lib/api-client';

export interface NotificationItem {
  id: string;
  dateTime: Date;
  channel: string;
  direction: 'inbound' | 'outbound';
  clientName: string;
  phoneNumber: string;
  messageType: string;
  messagePreview: string;
  status: string;
  origin: string;
  retryCount: number;
  hasError: boolean;
  conversationId?: string;
}

export interface NotificationDetail {
  id: string;
  conversationId?: string;
  clientId: string;
  clientName: string;
  phoneNumber: string;
  fullMessageBody: string;
  messageType: string;
  direction: 'inbound' | 'outbound';
  payloadJson?: Record<string, any>;
  whatsappMessageId?: string;
  providerResponse?: Record<string, any>;
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  relatedReminderId?: string;
  relatedAppointmentId?: string;
}

export interface QueueItem {
  id: string;
  dateTime: Date;
  clientName: string;
  phoneNumber: string;
  messagePreview: string;
  status: string;
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: Date;
  scheduledAt?: Date;
}

export interface ErrorItem {
  id: string;
  dateTime: Date;
  clientName: string;
  phoneNumber: string;
  messagePreview: string;
  errorCode?: string;
  errorMessage?: string;
  status: string;
  retryCount: number;
}

export interface NotificationFilters {
  dateFrom?: Date;
  dateTo?: Date;
  clientId?: string;
  phoneNumber?: string;
  status?: string;
  direction?: 'inbound' | 'outbound';
  messageType?: string;
  errorsOnly?: boolean;
  page?: number;
  limit?: number;
}

interface NotificationStore {
  notifications: NotificationItem[];
  selectedNotification: NotificationDetail | null;
  queue: QueueItem[];
  errors: ErrorItem[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  activeTab: 'history' | 'queue' | 'errors';
  
  // Actions
  fetchNotifications: (filters: NotificationFilters) => Promise<void>;
  fetchNotificationDetail: (id: string) => Promise<void>;
  fetchQueue: () => Promise<void>;
  fetchErrors: () => Promise<void>;
  setActiveTab: (tab: 'history' | 'queue' | 'errors') => void;
  setPage: (page: number) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  selectedNotification: null,
  queue: [],
  errors: [],
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: false,
  activeTab: 'history',

  fetchNotifications: async (filters: NotificationFilters) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications', {
        params: {
          dateFrom: filters.dateFrom?.toISOString(),
          dateTo: filters.dateTo?.toISOString(),
          clientId: filters.clientId,
          phoneNumber: filters.phoneNumber,
          status: filters.status,
          direction: filters.direction,
          messageType: filters.messageType,
          errorsOnly: filters.errorsOnly,
          page: filters.page || 1,
          limit: filters.limit || 20,
        },
      });
      
      set({
        notifications: response.data.data,
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.totalPages,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchNotificationDetail: async (id: string) => {
    try {
      const response = await api.get(`/notifications/${id}`);
      set({ selectedNotification: response.data });
    } catch (error) {
      console.error('Failed to fetch notification detail:', error);
    }
  },

  fetchQueue: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications/tabs/queue');
      set({ queue: response.data.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      set({ isLoading: false });
    }
  },

  fetchErrors: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications/tabs/errors');
      set({ errors: response.data.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch errors:', error);
      set({ isLoading: false });
    }
  },

  setActiveTab: (tab: 'history' | 'queue' | 'errors') => {
    set({ activeTab: tab });
  },

  setPage: (page: number) => {
    set({ page });
  },
}));
