import api from './api';
import type { PaginatedResponse } from '../types/api';

export type NotificationType =
  | 'COMMENT_ON_POST'
  | 'REPLY_TO_COMMENT'
  | 'NEW_POST_IN_DEBATE'
  | 'NEW_CONSENSUS_IN_DEBATE';

export interface Notification {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  debateId: string;
  referenceId: string;
  debate: { id: string; title: string };
  actor: { id: string; nickname: string; profileImage: string | null };
}

export const notificationService = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<{ notifications: Notification[]; unreadCount: number; hasMore: boolean }>>('/notifications', { params }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};
