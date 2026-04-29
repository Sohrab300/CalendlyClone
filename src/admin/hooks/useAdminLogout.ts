import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function useAdminLogout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
}
