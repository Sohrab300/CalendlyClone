import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { captureAppError } from '../../lib/sentry';

export function useAdminLogout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
      captureAppError(error, {
        route: '/admin',
        stage: 'logout',
      });
    }
  };
}
