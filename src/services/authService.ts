import api from './api';
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

interface LoginResponse {
  success: boolean;
  accessToken: string;
  user: User;
}

interface UserResponse {
  success: boolean;
  user: User;
}

interface MessageResponse {
  success: boolean;
  message: string;
  email?: string;
}

export const authService = {
  signup: (data: SignupRequest) => api.post<UserResponse>('/auth/signup', data),
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  googleLogin: (data: GoogleLoginRequest) => api.post<LoginResponse>('/auth/google', data),
  googleSignup: (data: GoogleSignupRequest) => api.post<LoginResponse>('/auth/google/signup', data),
  verifyEmail: (data: VerifyEmailRequest) => api.post<MessageResponse>('/auth/verify-email', data),
  resendVerification: (data: { email: string }) =>
    api.post<MessageResponse>('/auth/verification/resend', data),
  requestPasswordReset: (data: PasswordResetRequest) =>
    api.post<MessageResponse>('/auth/password-reset/request', data),
  verifyPasswordReset: (data: PasswordResetVerifyRequest) =>
    api.post<{ success: boolean; valid: boolean }>('/auth/password-reset/verify', data),
  confirmPasswordReset: (data: PasswordResetConfirmRequest) =>
    api.post<MessageResponse>('/auth/password-reset/confirm', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<UserResponse>('/auth/me'),
};
