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

interface GoogleLoginRequest {
  idToken: string;
}

interface GoogleSignupRequest {
  idToken: string;
  nickname: string;
  password: string;
  passwordConfirm: string;
}

interface VerifyEmailRequest {
  token: string;
}

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetVerifyRequest {
  token: string;
}

interface PasswordResetConfirmRequest {
  token: string;
  password: string;
  passwordConfirm: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface MessageResponse {
  message: string;
  email?: string;
}

export const authService = {
  signup: (data: SignupRequest) => api.post<ApiResponse<{ user: User }>>('/auth/signup', data),
  login: (data: LoginRequest) => api.post<ApiResponse<AuthResponse>>('/auth/login', data),
  googleLogin: (data: GoogleLoginRequest) => api.post<ApiResponse<AuthResponse>>('/auth/google', data),
  googleSignup: (data: GoogleSignupRequest) => api.post<ApiResponse<AuthResponse>>('/auth/google/signup', data),
  verifyEmail: (data: VerifyEmailRequest) => api.post<ApiResponse<MessageResponse>>('/auth/verify-email', data),
  resendVerification: (data: { email: string }) =>
    api.post<ApiResponse<MessageResponse>>('/auth/verification/resend', data),
  requestPasswordReset: (data: PasswordResetRequest) =>
    api.post<ApiResponse<MessageResponse>>('/auth/password-reset/request', data),
  verifyPasswordReset: (data: PasswordResetVerifyRequest) =>
    api.post<ApiResponse<{ valid: boolean }>>('/auth/password-reset/verify', data),
  confirmPasswordReset: (data: PasswordResetConfirmRequest) =>
    api.post<ApiResponse<MessageResponse>>('/auth/password-reset/confirm', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),
};
