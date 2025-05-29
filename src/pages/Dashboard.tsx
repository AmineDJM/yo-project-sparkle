
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, User, Plus, MapPin, MessageSquare, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { signOut } = useAuth();
  const { profile, loading, error } = useProfile();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Profil introuvable'}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  const isProvider = profile.user_type === 'provider';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-blue-900">Homi</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bonjour, {profile.full_name}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User type badge */}
        <div className="mb-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {isProvider ? <Wrench className="w-4 h-4 mr-1" /> : <User className="w-4 h-4 mr-1" />}
            {isProvider ? 'Prestataire' : 'Client'}
          </div>
        </div>

        {/* Main content */}
        {isProvider ? (
          <ProviderDashboard profile={profile} />
        ) : (
          <ClientDashboard profile={profile} navigate={navigate} />
        )}
      </div>
    </div>
  );
}

function ClientDashboard({ profile, navigate }: { profile: any; navigate: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Poster une mission */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/new-request')}>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Poster une mission
            </CardTitle>
            <CardDescription>
              Décrivez votre besoin et trouvez un prestataire
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Mes missions */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-green-600" />
              Mes missions
            </CardTitle>
            <CardDescription>
              Suivez l'avancement de vos demandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">0 mission active</p>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
              Messages
            </CardTitle>
            <CardDescription>
              Communiquez avec vos prestataires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Aucun message</p>
          </CardContent>
        </Card>
      </div>

      {/* Missions récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Missions récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Aucune mission pour le moment. Commencez par poster votre première mission !
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ProviderDashboard({ profile }: { profile: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Missions disponibles */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Missions à proximité
            </CardTitle>
            <CardDescription>
              Trouvez des missions près de chez vous
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">0 mission disponible</p>
          </CardContent>
        </Card>

        {/* Mes candidatures */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Wrench className="w-5 h-5 mr-2 text-green-600" />
              Mes candidatures
            </CardTitle>
            <CardDescription>
              Suivez vos propositions de service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">0 candidature</p>
          </CardContent>
        </Card>

        {/* Mon profil */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              Mon profil
            </CardTitle>
            <CardDescription>
              Gérez vos informations et services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Profil à compléter</p>
          </CardContent>
        </Card>
      </div>

      {/* Missions en cours */}
      <Card>
        <CardHeader>
          <CardTitle>Missions en cours</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Aucune mission en cours. Consultez les missions disponibles pour commencer !
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
