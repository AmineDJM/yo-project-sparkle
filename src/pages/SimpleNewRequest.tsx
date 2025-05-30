import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MapPin, Navigation, Phone, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const URGENCY_LEVELS = [
  { 
    value: 'urgent', 
    label: '🚨 Très urgent', 
    description: 'Intervention immédiate',
    color: 'bg-red-500',
    textColor: 'text-red-700'
  },
  { 
    value: 'high', 
    label: '⚡ Urgent', 
    description: 'Dans les 2h',
    color: 'bg-orange-500',
    textColor: 'text-orange-700'
  },
  { 
    value: 'medium', 
    label: '⏰ Aujourd\'hui', 
    description: 'Dans la journée',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700'
  },
  { 
    value: 'low', 
    label: '📅 Pas pressé', 
    description: 'Quand c\'est possible',
    color: 'bg-green-500',
    textColor: 'text-green-700'
  }
];

export default function SimpleNewRequest() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const { toast } = useToast();

  // États simplifiés
  const [problem, setProblem] = useState('');
  const [address, setAddress] = useState(location.state?.address || '');
  const [phone, setPhone] = useState('');
  const [urgency, setUrgency] = useState(location.state?.urgency || 'medium');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const selectedCategory = location.state?.selectedCategory;

  useEffect(() => {
    // Auto-remplir le problème selon la catégorie
    if (selectedCategory) {
      const categoryTitles = {
        plomberie: 'J\'ai une fuite d\'eau',
        electricite: 'J\'ai une panne électrique',
        serrurerie: 'Je ne peux pas ouvrir ma porte',
        chauffage: 'Mon chauffage ne fonctionne plus',
        bricolage: 'J\'ai besoin d\'aide pour du bricolage',
        autre: 'J\'ai un autre problème'
      };
      setProblem(categoryTitles[selectedCategory as keyof typeof categoryTitles] || '');
    }
  }, [selectedCategory]);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Géolocalisation non disponible",
        description: "Saisissez votre adresse manuellement",
      });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setAddress(`📍 Position détectée automatiquement`);
        
        toast({
          title: "📍 Position détectée",
          description: "Votre adresse a été ajoutée",
        });
        setLocationLoading(false);
      },
      (error) => {
        toast({
          variant: "destructive",
          title: "Erreur de position",
          description: "Saisissez votre adresse manuellement",
        });
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!problem.trim() || !address.trim() || !phone.trim()) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        client_id: user.id,
        title: problem,
        description: `${problem}\n\nTéléphone de contact: ${phone}`,
        category: selectedCategory || 'autre',
        urgency: urgency as any,
        address,
        latitude: coordinates?.lat || 0,
        longitude: coordinates?.lng || 0,
        estimated_budget: null,
      };

      const { data, error } = await supabase.from('service_requests').insert(requestData).select().single();

      if (error) throw error;

      toast({
        title: "🎉 Demande envoyée !",
        description: "Nous recherchons un prestataire pour vous",
      });

      // Rediriger vers l'écran de recherche avec l'ID de la demande
      navigate('/provider-search', { 
        state: { 
          requestId: data.id,
          requestTitle: problem 
        } 
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer votre demande",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="mr-3 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">Décrivez votre problème</h1>
          </div>
        </div>
      </header>

      <div className="p-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description du problème */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                1. Quel est votre problème ?
              </h2>
              <Textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Décrivez simplement ce qui ne va pas..."
                rows={4}
                required
                className="text-base resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Plus vous êtes précis, mieux nous pourrons vous aider
              </p>
            </CardContent>
          </Card>

          {/* Urgence */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                2. C'est urgent ?
              </h2>
              <div className="grid grid-cols-1 gap-3">
                {URGENCY_LEVELS.map((level) => (
                  <Button
                    key={level.value}
                    type="button"
                    variant={urgency === level.value ? "default" : "outline"}
                    onClick={() => setUrgency(level.value)}
                    className={`h-auto p-4 text-left justify-start ${
                      urgency === level.value ? '' : level.textColor
                    }`}
                  >
                    <div className="flex items-center w-full">
                      <div className="flex-1">
                        <div className="font-medium text-base">{level.label}</div>
                        <div className="text-sm opacity-70">{level.description}</div>
                      </div>
                      <Clock className="w-5 h-5 ml-2" />
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Adresse */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                3. Où êtes-vous ?
              </h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Votre adresse complète"
                    required
                    className="text-base flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="px-4"
                  >
                    {locationLoading ? (
                      <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    ) : (
                      <Navigation className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 flex items-center">
                    🔒 <span className="ml-1">Votre adresse exacte reste privée jusqu'à confirmation</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Téléphone */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                4. Votre numéro de téléphone
              </h2>
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400 mr-3" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  required
                  className="text-base"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                📞 Pour que le prestataire puisse vous contacter rapidement
              </p>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Bouton fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <Button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg font-medium rounded-xl" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Envoi en cours...
            </div>
          ) : (
            '🚀 Envoyer ma demande'
          )}
        </Button>
        <p className="text-center text-xs text-gray-500 mt-2">
          Gratuit • Réponse rapide garantie
        </p>
      </div>
    </div>
  );
}
