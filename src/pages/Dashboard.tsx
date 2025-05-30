
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Wrench, User, Menu, Bell } from 'lucide-react';
import ProviderMissionsList from '@/components/ProviderMissionsList';
import ProviderProposalsList from '@/components/ProviderProposalsList';
import ProviderMessagesList from '@/components/ProviderMessagesList';
import UserProfile from '@/components/UserProfile';
import SimpleClientDashboard from '@/components/SimpleClientDashboard';
import { useState } from 'react';

export default function Dashboard() {
  const { signOut } = useAuth();
  const { profile, loading, error } = useProfile();
  const [activeView, setActiveView] = useState<'proposals' | 'missions' | 'messages' | 'profile'>('proposals');

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

  // Interface ultra-simple pour les clients
  if (!isProvider) {
    return <SimpleClientDashboard />;
  }

  // Interface existante pour les prestataires
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header pour prestataires */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-900">Homi</h1>
                <p className="text-xs text-gray-600">Prestataire</p>
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
        <ProviderDashboard profile={profile} activeView={activeView} setActiveView={setActiveView} />
      </div>

      {/* Bottom Navigation pour prestataires */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around items-center">
          <Button 
            variant={activeView === 'proposals' ? 'default' : 'ghost'} 
            className="flex flex-col items-center p-2 h-auto" 
            size="sm"
            onClick={() => setActiveView('proposals')}
          >
            <span className="text-xs">Propositions</span>
          </Button>
          <Button 
            variant={activeView === 'missions' ? 'default' : 'ghost'} 
            className="flex flex-col items-center p-2 h-auto" 
            size="sm"
            onClick={() => setActiveView('missions')}
          >
            <span className="text-xs">Missions</span>
          </Button>
          <Button 
            variant={activeView === 'messages' ? 'default' : 'ghost'} 
            className="flex flex-col items-center p-2 h-auto" 
            size="sm"
            onClick={() => setActiveView('messages')}
          >
            <span className="text-xs">Candidatures</span>
          </Button>
          <Button 
            variant={activeView === 'profile' ? 'default' : 'ghost'} 
            className="flex flex-col items-center p-2 h-auto" 
            size="sm"
            onClick={() => setActiveView('profile')}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs">Profil</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProviderDashboard({ profile, activeView, setActiveView }: { 
  profile: any; 
  activeView: 'proposals' | 'missions' | 'messages' | 'profile';
  setActiveView: (view: 'proposals' | 'missions' | 'messages' | 'profile') => void;
}) {
  return (
    <div className="space-y-4">
      {activeView === 'proposals' && <ProviderProposalsList />}
      {activeView === 'missions' && <ProviderMissionsList />}
      {activeView === 'messages' && <ProviderMessagesList />}
      {activeView === 'profile' && <UserProfile />}
    </div>
  );
}
