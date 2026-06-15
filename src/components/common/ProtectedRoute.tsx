import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const ProtectedRoute = () => {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const location = useLocation();
  const isProfilePath = location.pathname === '/profile';
  const isOnboardingPath = location.pathname === '/onboarding';

  if (!isInitialized) return null;
  if (!isAuthenticated && !isProfilePath) return <Navigate to="/login" replace />;
  if (
    isAuthenticated &&
    user?.hasCompletedOnboarding === false &&
    !isOnboardingPath
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
