import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const AuthRoute = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default AuthRoute;
