
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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

  const handleProblemSelect = (category: typeof PROBLEM_CATEGORIES[0]) => {
    navigate('/new-request', { 
      state: { 
        selectedCategory: category.id,
        urgency: category.urgency 
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = profile?.full_name?.split(' ')[0] || 'là';
    
    if (hour < 12) return `Bonjour ${firstName}`;
    if (hour < 18) return `Bonjour ${firstName}`;
    return `Bonsoir ${firstName}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header simplifié */}
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Homi</h1>
                <p className="text-sm text-gray-600">Aide à domicile</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* Message d'accueil */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {getGreeting()} ! 👋
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Quel est votre problème aujourd'hui ?
          </p>
        </div>

        {/* Actions d'urgence en haut */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Bouton vocal */}
          <Card className="cursor-pointer hover:shadow-lg transition-all active:scale-95 border-2 border-green-200">
            <CardContent className="p-6" onClick={handleVoiceHelp}>
              <div className="flex items-center justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-4 ${
                  isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                }`}>
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900">
                    {isListening ? 'J\'écoute...' : 'Parler du problème'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Décrivez votre problème à voix haute
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bouton appel */}
          <Card className="cursor-pointer hover:shadow-lg transition-all active:scale-95 border-2 border-blue-200">
            <CardContent className="p-6" onClick={handleCallRequest}>
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900">Être rappelé</h3>
                  <p className="text-sm text-gray-600">
                    Un conseiller vous appelle
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Séparateur */}
        <div className="flex items-center my-8">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-4 text-gray-500 text-sm">ou choisissez votre problème</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Catégories de problèmes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PROBLEM_CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id}
                className="cursor-pointer hover:shadow-lg transition-all active:scale-95 border-2 hover:border-gray-300"
                onClick={() => handleProblemSelect(category)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`w-16 h-16 ${category.color} rounded-xl flex items-center justify-center mr-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {category.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {category.description}
                      </p>
                      {category.urgency === 'urgent' && (
                        <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
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

        {/* Message de rassurance */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🛡️ Vous êtes entre de bonnes mains
            </h3>
            <p className="text-blue-700 text-sm">
              Nos prestataires sont vérifiés et assurés. 
              Intervention rapide garantie.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
