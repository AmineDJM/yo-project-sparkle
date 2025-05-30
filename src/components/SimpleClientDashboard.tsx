
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Wrench, 
  Phone, 
  Mic, 
  Zap, 
  Droplets, 
  Lock, 
  Hammer, 
  Wifi,
  Thermometer,
  AlertTriangle,
  MapPin,
  Navigation,
  User,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ClientMissionsList from './ClientMissionsList';
import UserProfile from './UserProfile';

const PROBLEM_CATEGORIES = [
  {
    id: 'plomberie',
    icon: Droplets,
    label: 'Fuite d\'eau',
    description: 'Robinet, évier, toilettes...',
    color: 'bg-blue-500',
    urgency: 'high'
  },
  {
    id: 'electricite',
    icon: Zap,
    label: 'Panne électrique',
    description: 'Plus de courant, prise cassée...',
    color: 'bg-yellow-500',
    urgency: 'high'
  },
  {
    id: 'serrurerie',
    icon: Lock,
    label: 'Problème de serrure',
    description: 'Clé cassée, porte bloquée...',
    color: 'bg-red-500',
    urgency: 'urgent'
  },
  {
    id: 'chauffage',
    icon: Thermometer,
    label: 'Chauffage',
    description: 'Plus de chauffage, radiateur...',
    color: 'bg-orange-500',
    urgency: 'medium'
  },
  {
    id: 'bricolage',
    icon: Hammer,
    label: 'Petit bricolage',
    description: 'Montage, fixation...',
    color: 'bg-green-500',
    urgency: 'low'
  },
  {
    id: 'autre',
    icon: AlertTriangle,
    label: 'Autre problème',
    description: 'Décrivez votre situation',
    color: 'bg-gray-500',
    urgency: 'medium'
  }
];

export default function SimpleClientDashboard() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'missions' | 'profile'>('home');
  const [address, setAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const handleProblemSelect = (category: typeof PROBLEM_CATEGORIES[0]) => {
    navigate('/new-request', { 
      state: { 
        selectedCategory: category.id,
        urgency: category.urgency,
        address: address
      } 
    });
  };

  const handleVoiceHelp = () => {
    setIsListening(!isListening);
    // TODO: Implémenter la reconnaissance vocale
    alert('Fonction vocale en cours de développement');
  };

  const handleCallRequest = () => {
    // TODO: Implémenter la demande d'appel
    alert('Un conseiller vous rappellera dans les 5 minutes');
  };

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      alert('Géolocalisation non disponible');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setAddress('📍 Position détectée automatiquement');
        setLocationLoading(false);
      },
      (error) => {
        alert('Erreur de géolocalisation');
        setLocationLoading(false);
      }
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = profile?.full_name?.split(' ')[0] || 'là';
    
    if (hour < 12) return `Bonjour ${firstName}`;
    if (hour < 18) return `Bonjour ${firstName}`;
    return `Bonsoir ${firstName}`;
  };

  if (activeView === 'missions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Header avec navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-blue-900">Homi</h1>
              </div>
            </div>
          </div>
        </header>

        <ClientMissionsList />

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
          <div className="flex justify-around items-center">
            <Button 
              variant="ghost"
              className="flex flex-col items-center p-2 h-auto text-xs"
              onClick={() => setActiveView('home')}
            >
              <Wrench className="w-5 h-5 mb-1" />
              Accueil
            </Button>
            <Button 
              variant="default"
              className="flex flex-col items-center p-2 h-auto text-xs"
            >
              <FileText className="w-5 h-5 mb-1" />
              Missions
            </Button>
            <Button 
              variant="ghost"
              className="flex flex-col items-center p-2 h-auto text-xs"
              onClick={() => setActiveView('profile')}
            >
              <User className="w-5 h-5 mb-1" />
              Profil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Header avec navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-blue-900">Homi</h1>
              </div>
            </div>
          </div>
        </header>

        <UserProfile />

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
          <div className="flex justify-around items-center">
            <Button 
              variant="ghost"
              className="flex flex-col items-center p-2 h-auto text-xs"
              onClick={() => setActiveView('home')}
            >
              <Wrench className="w-5 h-5 mb-1" />
              Accueil
            </Button>
            <Button 
              variant="ghost"
              className="flex flex-col items-center p-2 h-auto text-xs"
              onClick={() => setActiveView('missions')}
            >
              <FileText className="w-5 h-5 mb-1" />
              Missions
            </Button>
            <Button 
              variant="default"
              className="flex flex-col items-center p-2 h-auto text-xs"
            >
              <User className="w-5 h-5 mb-1" />
              Profil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header avec barre d'adresse comme Uber */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-blue-900">Homi</h1>
            </div>
          </div>
          
          {/* Barre d'adresse style Uber */}
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-100 rounded-lg p-3 flex items-center">
              <MapPin className="w-5 h-5 text-gray-500 mr-2" />
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Où êtes-vous ?"
                className="border-0 bg-transparent p-0 text-sm focus:ring-0"
              />
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={locationLoading}
              className="p-3"
            >
              {locationLoading ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 pb-24">
        {/* Message d'accueil avec police réduite */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getGreeting()} ! 👋
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Quel est votre problème aujourd'hui ?
          </p>
        </div>

        {/* Actions d'urgence en haut */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Bouton vocal */}
          <Card className="cursor-pointer hover:shadow-lg transition-all active:scale-95 border-2 border-green-200">
            <CardContent className="p-4" onClick={handleVoiceHelp}>
              <div className="flex items-center justify-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                  isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                }`}>
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">
                    {isListening ? 'J\'écoute...' : 'Parler du problème'}
                  </h3>
                  <p className="text-xs text-gray-600">
                    Décrivez votre problème à voix haute
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bouton appel */}
          <Card className="cursor-pointer hover:shadow-lg transition-all active:scale-95 border-2 border-blue-200">
            <CardContent className="p-4" onClick={handleCallRequest}>
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Être rappelé</h3>
                  <p className="text-xs text-gray-600">
                    Un conseiller vous appelle
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Séparateur */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-3 text-gray-500 text-xs">ou choisissez votre problème</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Catégories de problèmes avec police réduite */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROBLEM_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id}
                className="cursor-pointer hover:shadow-lg transition-all active:scale-95 border-2 hover:border-gray-300"
                onClick={() => handleProblemSelect(category)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center mr-3`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {category.label}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {category.description}
                      </p>
                      {category.urgency === 'urgent' && (
                        <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          🚨 Urgent
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Message de rassurance avec police réduite */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="text-base font-semibold text-blue-900 mb-1">
              🛡️ Vous êtes entre de bonnes mains
            </h3>
            <p className="text-blue-700 text-xs">
              Nos prestataires sont vérifiés et assurés. 
              Intervention rapide garantie.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around items-center">
          <Button 
            variant="default"
            className="flex flex-col items-center p-2 h-auto text-xs"
          >
            <Wrench className="w-5 h-5 mb-1" />
            Accueil
          </Button>
          <Button 
            variant="ghost"
            className="flex flex-col items-center p-2 h-auto text-xs"
            onClick={() => setActiveView('missions')}
          >
            <FileText className="w-5 h-5 mb-1" />
            Missions
          </Button>
          <Button 
            variant="ghost"
            className="flex flex-col items-center p-2 h-auto text-xs"
            onClick={() => setActiveView('profile')}
          >
            <User className="w-5 h-5 mb-1" />
            Profil
          </Button>
        </div>
      </div>
    </div>
  );
}
