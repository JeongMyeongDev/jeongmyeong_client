import api from './api';

export type NotificationType = 'COMMENT_ON_POST' | 'REPLY_TO_COMMENT' | 'NEW_POST_IN_DEBATE';

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

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

export const notificationService = {
  getAll: () => api.get<NotificationsResponse>('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};
