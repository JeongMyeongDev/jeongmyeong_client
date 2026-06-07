import api from './api';
import type { User } from '../types/user';

export interface UpdateMeRequest {
  nickname?: string;
  profileImage?: string;
}

interface UserResponse {
  success: boolean;
  user: User;
}

interface SettingsResponse {
  success: boolean;
  notificationsEnabled: boolean;
}

export const userService = {
  updateMe: (data: UpdateMeRequest) => api.patch<UserResponse>('/users/me', data),
  getPublicProfile: (userId: string) => api.get<UserResponse>(`/users/${userId}`),
  getMySettings: () => api.get<SettingsResponse>('/users/me/settings'),
  updateMySettings: (data: { notificationsEnabled: boolean }) =>
    api.patch<SettingsResponse>('/users/me/settings', data),
};
