import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 如果需要修改密码并且当前不在修改密码页面，则强制跳转
  if (user?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (requireAdmin && !user?.is_superuser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
