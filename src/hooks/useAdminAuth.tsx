
import { useState, useEffect } from 'react';

export function useAdminAuth() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAuth = () => {
      const authenticated = localStorage.getItem('admin_authenticated');
      const authTime = localStorage.getItem('admin_auth_time');
      
      if (authenticated === 'true' && authTime) {
        const currentTime = Date.now();
        const authTimestamp = parseInt(authTime);
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 heures
        
        // Vérifier si la session n'a pas expiré
        if (currentTime - authTimestamp < sessionDuration) {
          setIsAdminAuthenticated(true);
        } else {
          // Session expirée, nettoyer le localStorage
          localStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_auth_time');
          setIsAdminAuthenticated(false);
        }
      } else {
        setIsAdminAuthenticated(false);
      }
      
      setLoading(false);
    };

    checkAdminAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_auth_time');
    setIsAdminAuthenticated(false);
    window.location.href = '/';
  };

  return { isAdminAuthenticated, loading, logout };
}
