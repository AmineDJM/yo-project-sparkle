
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import AdminDashboard from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

export default function Admin() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Accès non autorisé
            </h1>
            <p className="text-gray-600 mb-4">
              Vous devez être connecté pour accéder à cette page.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Accès refusé
            </h1>
            <p className="text-gray-600 mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder au portail administrateur.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = '/'} className="w-full">
                Retour à l'accueil
              </Button>
              <Button onClick={signOut} variant="outline" className="w-full">
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec déconnexion */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-xl font-bold text-gray-900">Admin Homi</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Connecté en tant que {user.email}
            </span>
            <Button onClick={signOut} variant="outline" size="sm">
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <AdminDashboard />
    </div>
  );
}
