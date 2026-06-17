import api from './api';
import type { ApiResponse } from '../types/api';
import type { User } from '../types/user';

interface SignupRequest {
  email: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  signup: (data: SignupRequest) => api.post<ApiResponse<{ user: User }>>('/auth/signup', data),
  login: (data: LoginRequest) => api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),
};
