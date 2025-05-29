
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Navigate } from 'react-router-dom';
import ProviderPendingPage from '@/components/ProviderPendingPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproved?: boolean;
}

export default function ProtectedRoute({ children, requireApproved = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  
  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center">Erreur de profil</div>;
  }

  // Si c'est un prestataire en attente et qu'on requiert l'approbation
  if (requireApproved && profile.user_type === 'provider' && profile.provider_status === 'pending') {
    return <ProviderPendingPage />;
  }

  // Si c'est un prestataire rejeté
  if (profile.user_type === 'provider' && profile.provider_status === 'rejected') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Inscription refusée</h1>
          <p className="text-gray-600">Votre demande d'inscription en tant que prestataire a été refusée.</p>
          <p className="text-sm text-gray-500 mt-2">Contactez-nous pour plus d'informations.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
