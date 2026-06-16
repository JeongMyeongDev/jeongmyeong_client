import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
import { useModerationStore } from '../../stores/moderationStore';

interface AuthInitializerProps {
  children: ReactNode;
}

const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const { setUser, clearAuth, setInitialized } = useAuthStore();
  const { fetchSanctions, clearSanctions } = useModerationStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setInitialized();
      return;
    }

    authService
      .getMe()
      .then(async ({ data }) => {
        setUser(data.user);
        try {
          await fetchSanctions();
        } catch {
          clearSanctions();
        }
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        clearAuth();
        clearSanctions();
      })
      .finally(() => setInitialized());
  }, [clearAuth, clearSanctions, fetchSanctions, setInitialized, setUser]);

  return children;
};

export default AuthInitializer;
