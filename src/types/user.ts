export interface User {
  id: string;
  nickname: string;
  email: string;
  profileImage?: string | null;
  role?: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  createdAt?: string;
  hasCompletedOnboarding?: boolean;
  onboardingCompletedAt?: string | null;
  onboardingVersion?: number;
}
