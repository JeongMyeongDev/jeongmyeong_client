import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, clearAuth } = useAuthStore();

  const login = async (email: string, password: string) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('accessToken');
    clearAuth();
  };

  return { user, isAuthenticated, login, logout };
};
