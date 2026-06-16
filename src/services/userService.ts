import api from './api';
import type { ApiResponse } from '../types/api';
import type { User } from '../types/user';

export interface UpdateMeRequest {
  nickname?: string;
  profileImage?: string;
}

export const userService = {
  updateMe: (data: UpdateMeRequest) => api.patch<ApiResponse<{ user: User }>>('/users/me', data),
  deleteMe: () => api.delete<ApiResponse<{ message: string }>>('/users/me'),
  getPublicProfile: (userId: string) => api.get<ApiResponse<{ user: User }>>(`/users/${userId}`),
  getMySettings: () => api.get<ApiResponse<{ notificationsEnabled: boolean }>>('/users/me/settings'),
  updateMySettings: (data: { notificationsEnabled: boolean }) =>
    api.patch<ApiResponse<{ notificationsEnabled: boolean }>>('/users/me/settings', data),
  completeOnboarding: () => api.patch<ApiResponse<{ user: User }>>('/users/me/onboarding-complete'),
};
