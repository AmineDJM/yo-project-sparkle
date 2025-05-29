
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminDashboard from '@/components/AdminDashboard';
import AdminCodeAuth from '@/components/AdminCodeAuth';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export default function Admin() {
  const { isAdminAuthenticated, loading, logout } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-sm">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <AdminCodeAuth onSuccess={() => window.location.reload()} />;
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
              Session administrateur active
            </span>
            <Button onClick={logout} variant="outline" size="sm">
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <AdminDashboard />
    </div>
  );
}
