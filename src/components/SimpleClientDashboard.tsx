
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAddress } from '@/hooks/useAddress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Plus, User, MessageSquare, ClipboardList, Home, Phone, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ClientMissionsList from './ClientMissionsList';
import UserProfile from './UserProfile';

export default function SimpleClientDashboard() {
  const { signOut } = useAuth();
  const { profile, loading } = useProfile();
  const { currentAddress, updateAddress } = useAddress();
  const [activeTab, setActiveTab] = useState<'home' | 'missions' | 'profile'>('home');
  const navigate = useNavigate();

  const getFontSizeClass = () => {
    switch ((profile as any)?.font_size || 'medium') {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

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

  const handleNewRequest = () => {
    navigate('/new-request', { 
      state: { 
        selectedAddress: currentAddress 
      } 
    });
  };

  const handleCall = () => {
    // Fonctionnalité d'appel en développement
    console.log('Appel en cours...');
    // TODO: Implémenter la logique d'appel
  };

  const handleDescribeProblem = () => {
    // Fonctionnalité de description vocale en développement
    console.log('Description du problème...');
    // TODO: Implémenter la reconnaissance vocale
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'missions':
        return <ClientMissionsList />;
      case 'profile':
        return <UserProfile />;
      default:
        return (
          <div className={`p-4 space-y-6 ${getFontSizeClass()}`}>
            {/* Barre d'adresse style Uber */}
            <Card className="shadow-sm border-0 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <Input
                    value={currentAddress}
                    onChange={(e) => updateAddress(e.target.value)}
                    placeholder="Où êtes-vous ?"
                    className="border-0 text-lg font-medium placeholder:text-gray-400 focus-visible:ring-0 px-0"
                  />
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Boutons d'action rapide */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleCall}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Phone className="w-6 h-6" />
                <span className="text-sm font-medium">Appeler</span>
              </Button>
              
              <Button 
                onClick={handleDescribeProblem}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-2 text-green-600 border-green-200 hover:bg-green-50"
              >
                <Edit className="w-6 h-6" />
                <span className="text-sm font-medium">Décrire</span>
              </Button>
            </div>

            {/* Section services populaires */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 px-1">
                Services populaires
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🔧', name: 'Plomberie', category: 'plomberie' },
                  { icon: '⚡', name: 'Électricité', category: 'electricite' },
                  { icon: '🔑', name: 'Serrurerie', category: 'serrurerie' },
                  { icon: '🧹', name: 'Ménage', category: 'menage' },
                  { icon: '📦', name: 'Déménagement', category: 'demenagement' },
                  { icon: '🌱', name: 'Jardinage', category: 'jardinage' }
                ].map((service) => (
                  <Card 
                    key={service.category}
                    className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                    onClick={() => navigate('/new-request', { 
                      state: { 
                        selectedAddress: currentAddress,
                        selectedCategory: service.category 
                      } 
                    })}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{service.icon}</div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Bouton principal */}
            <div className="pt-4">
              <Button 
                onClick={handleNewRequest}
                className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-semibold rounded-xl shadow-lg"
              >
                <Plus className="w-6 h-6 mr-3" />
                Poster une nouvelle mission
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-blue-900">Homi</h1>
                <p className="text-xs text-gray-600">Services à domicile</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="pb-20">
        {renderContent()}
      </div>

      {/* Navigation du bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around items-center">
          <Button 
            variant={activeTab === 'home' ? 'default' : 'ghost'} 
            className="flex flex-col items-center p-2 h-auto" 
            size="sm"
            onClick={() => setActiveTab('home')}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs">Accueil</span>
          </Button>
          
          <Button 
            variant={activeTab === 'missions' ? 'default' : 'ghost'} 
            className="flex flex-col items-center p-2 h-auto" 
            size="sm"
            onClick={() => setActiveTab('missions')}
          >
            <ClipboardList className="w-5 h-5 mb-1" />
            <span className="text-xs">Missions</span>
          </Button>
          
          <Button 
            variant={activeTab === 'profile' ? 'default' : 'ghost'} 
            className="flex flex-col items-center p-2 h-auto" 
            size="sm"
            onClick={() => setActiveTab('profile')}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs">Profil</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
