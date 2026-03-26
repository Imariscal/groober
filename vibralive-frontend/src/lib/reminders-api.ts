import { apiClient } from '@/lib/api-client';
import { ReminderQueueResponseDto } from '@/types/preventive-care';

/**
 * Reminders API Client
 * Handles reminder queue operations
 */

export async function getPendingReminders(
  limit?: number,
): Promise<ReminderQueueResponseDto[]> {
  return apiClient.get('/reminders/pending', { params: { limit: limit || 100 } });
}

export async function getReminderHistory(
  filters?: Record<string, any>,
): Promise<{ data: ReminderQueueResponseDto[]; total: number }> {
  return apiClient.get('/reminders', { params: filters });
}

export async function getReminderById(reminderId: string): Promise<ReminderQueueResponseDto> {
  return apiClient.get(`/reminders/${reminderId}`);
}

export async function resendReminder(reminderId: string): Promise<ReminderQueueResponseDto> {
  return apiClient.patch(`/reminders/${reminderId}/resend`, {});
}

export async function markReminderAsSent(
  reminderId: string,
): Promise<ReminderQueueResponseDto> {
  return apiClient.patch(`/reminders/${reminderId}/mark-sent`, {});
}

export async function cancelReminder(
  reminderId: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.delete(`/reminders/${reminderId}`);
}

export async function getFailedReminders(
  maxRetries?: number,
): Promise<ReminderQueueResponseDto[]> {
  return apiClient.get('/reminders/failed', {
    params: { maxRetries: maxRetries || 3 },
  });
}

export async function getReminderStats(): Promise<{
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;
}> {
  return apiClient.get('/reminders/stats');
}
