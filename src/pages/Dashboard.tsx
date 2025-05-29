
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, User, Plus, MapPin, MessageSquare, Settings, Menu, Bell, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProviderMissionsList from '@/components/ProviderMissionsList';
import ProviderProposalsList from '@/components/ProviderProposalsList';
import ProviderMessagesList from '@/components/ProviderMessagesList';
import ClientMissionsList from '@/components/ClientMissionsList';
import ClientApplicationsList from '@/components/ClientApplicationsList';
import { useState } from 'react';

export default function Dashboard() {
  const { signOut } = useAuth();
  const { profile, loading, error } = useProfile();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'proposals' | 'missions' | 'messages'>('proposals');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-sm">{error || 'Profil introuvable'}</p>
          <Button onClick={() => window.location.reload()} size="sm">Réessayer</Button>
        </div>
      </div>
    );
  }

  const isProvider = profile.user_type === 'provider';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-900">Homi</h1>
                <p className="text-xs text-gray-600">
                  {isProvider ? 'Prestataire' : 'Client'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="p-2">
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="pb-20">
        {/* Main content */}
        {isProvider ? (
          <ProviderDashboard profile={profile} activeView={activeView} setActiveView={setActiveView} />
        ) : (
          <ClientDashboard profile={profile} navigate={navigate} activeView={activeView} setActiveView={setActiveView} />
        )}
      </div>

      {/* Bottom Navigation pour mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around items-center">
          {isProvider ? (
            <>
              <Button 
                variant={activeView === 'proposals' ? 'default' : 'ghost'} 
                className="flex flex-col items-center p-2 h-auto" 
                size="sm"
                onClick={() => setActiveView('proposals')}
              >
                <Zap className="w-5 h-5 mb-1" />
                <span className="text-xs">Propositions</span>
              </Button>
              <Button 
                variant={activeView === 'missions' ? 'default' : 'ghost'} 
                className="flex flex-col items-center p-2 h-auto" 
                size="sm"
                onClick={() => setActiveView('missions')}
              >
                <MapPin className="w-5 h-5 mb-1" />
                <span className="text-xs">Missions</span>
              </Button>
              <Button 
                variant={activeView === 'messages' ? 'default' : 'ghost'} 
                className="flex flex-col items-center p-2 h-auto" 
                size="sm"
                onClick={() => setActiveView('messages')}
              >
                <MessageSquare className="w-5 h-5 mb-1" />
                <span className="text-xs">Messages</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant={activeView === 'missions' ? 'default' : 'ghost'} 
                className="flex flex-col items-center p-2 h-auto" 
                size="sm"
                onClick={() => setActiveView('missions')}
              >
                <MapPin className="w-5 h-5 mb-1" />
                <span className="text-xs">Missions</span>
              </Button>
              <Button 
                onClick={() => navigate('/new-request')}
                className="bg-blue-600 hover:bg-blue-700 rounded-full w-14 h-14 p-0"
              >
                <Plus className="w-6 h-6 text-white" />
              </Button>
              <Button 
                variant={activeView === 'messages' ? 'default' : 'ghost'} 
                className="flex flex-col items-center p-2 h-auto" 
                size="sm"
                onClick={() => setActiveView('messages')}
              >
                <MessageSquare className="w-5 h-5 mb-1" />
                <span className="text-xs">Messages</span>
              </Button>
            </>
          )}
          <Button variant="ghost" className="flex flex-col items-center p-2 h-auto" size="sm">
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-xs">Profil</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ClientDashboard({ profile, navigate, activeView, setActiveView }: { 
  profile: any; 
  navigate: any;
  activeView: 'proposals' | 'missions' | 'messages';
  setActiveView: (view: 'proposals' | 'missions' | 'messages') => void;
}) {
  if (activeView === 'missions') {
    return <ClientMissionsList />;
  }

  if (activeView === 'messages') {
    return <ClientApplicationsList />;
  }

  // Vue par défaut (dashboard principal)
  return (
    <div className="p-4 space-y-4">
      {/* Message de bienvenue */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h2 className="text-lg font-semibold text-blue-900 mb-1">
          Bonjour {profile.full_name?.split(' ')[0]} ! 👋
        </h2>
        <p className="text-blue-700 text-sm">
          Besoin d'aide à domicile ? Trouvez un prestataire près de chez vous.
        </p>
      </div>

      {/* Actions rapides */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide px-1">
          Actions rapides
        </h3>
        
        {/* Poster une mission - Action principale */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all active:scale-95 border-2 border-blue-200 bg-blue-50" 
          onClick={() => navigate('/new-request')}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Poster une mission</h3>
                <p className="text-sm text-blue-700">Trouvez un prestataire rapidement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mes missions */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all active:scale-95"
          onClick={() => setActiveView('missions')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Mes missions</h3>
                  <p className="text-sm text-gray-500">Gérer vos demandes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-all active:scale-95"
          onClick={() => setActiveView('messages')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Candidatures</h3>
                  <p className="text-sm text-gray-500">Voir les prestataires intéressés</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProviderDashboard({ profile, activeView, setActiveView }: { 
  profile: any; 
  activeView: 'proposals' | 'missions' | 'messages';
  setActiveView: (view: 'proposals' | 'missions' | 'messages') => void;
}) {
  return (
    <div className="space-y-4">
      {activeView === 'proposals' && <ProviderProposalsList />}
      {activeView === 'missions' && <ProviderMissionsList />}
      {activeView === 'messages' && <ProviderMessagesList />}
    </div>
  );
}
