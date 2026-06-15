import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const AuthRoute = () => {
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  if (!isInitialized) return null;
  if (isAuthenticated) {
    return <Navigate to={user?.hasCompletedOnboarding === false ? '/onboarding' : '/'} replace />;
  }

  return <Outlet />;
};

export default AuthRoute;
