
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, MapPin, Navigation, Euro } from 'lucide-react';

export default function NewRequest() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [address, setAddress] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const categories = [
    { value: 'plomberie', label: '🔧 Plomberie', emoji: '🔧' },
    { value: 'electricite', label: '⚡ Électricité', emoji: '⚡' },
    { value: 'serrurerie', label: '🔑 Serrurerie', emoji: '🔑' },
    { value: 'demenagement', label: '📦 Déménagement', emoji: '📦' },
    { value: 'menage', label: '🧹 Ménage', emoji: '🧹' },
    { value: 'jardinage', label: '🌱 Jardinage', emoji: '🌱' },
    { value: 'bricolage', label: '🔨 Bricolage', emoji: '🔨' },
    { value: 'autre', label: '⚙️ Autre', emoji: '⚙️' },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Faible', color: 'text-green-600' },
    { value: 'medium', label: 'Moyen', color: 'text-yellow-600' },
    { value: 'high', label: 'Élevé', color: 'text-orange-600' },
    { value: 'urgent', label: '🚨 Urgent', color: 'text-red-600' },
  ];

  const getCurrentLocation = () => {
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation",
      });
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        
        // Dans une vraie application, on utiliserait un service de géocodage inversé
        setAddress(`📍 Position détectée (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        
        toast({
          title: "📍 Position détectée",
          description: "Votre position a été ajoutée à la demande",
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        toast({
          variant: "destructive",
          title: "Erreur de géolocalisation",
          description: "Impossible d'obtenir votre position. Saisissez votre adresse manuellement.",
        });
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!address.trim()) {
      toast({
        variant: "destructive",
        title: "Adresse requise",
        description: "Veuillez saisir une adresse ou utiliser votre position actuelle",
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        client_id: user.id,
        title,
        description,
        category: category as any,
        urgency: urgency as any,
        address,
        latitude: coordinates?.lat || 0,
        longitude: coordinates?.lng || 0,
        estimated_budget: estimatedBudget ? parseFloat(estimatedBudget) : null,
      };

      console.log('Submitting request data:', requestData);

      const { error } = await supabase.from('service_requests').insert(requestData);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "🎉 Mission publiée !",
        description: "Les prestataires de votre zone vont recevoir votre demande",
      });

      // Redirect to dashboard
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = '/'}
              className="mr-3 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">Nouvelle mission</h1>
          </div>
        </div>
      </header>

      <div className="p-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <Card>
            <CardContent className="p-4">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2 block">
                Titre de votre demande
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Fuite d'eau sous l'évier"
                required
                className="text-base"
              />
            </CardContent>
          </Card>

          {/* Catégorie */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Catégorie
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    type="button"
                    variant={category === cat.value ? "default" : "outline"}
                    onClick={() => setCategory(cat.value)}
                    className="h-auto p-3 text-left justify-start"
                  >
                    <span className="text-lg mr-2">{cat.emoji}</span>
                    <span className="text-sm">{cat.label.replace(cat.emoji + ' ', '')}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                Description détaillée
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre problème en détail..."
                rows={4}
                required
                className="text-base resize-none"
              />
            </CardContent>
          </Card>

          {/* Urgence */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Niveau d'urgence
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {urgencyLevels.map((level) => (
                  <Button
                    key={level.value}
                    type="button"
                    variant={urgency === level.value ? "default" : "outline"}
                    onClick={() => setUrgency(level.value)}
                    className={`h-auto p-3 text-left justify-start ${
                      urgency === level.value ? '' : level.color
                    }`}
                  >
                    <span className="text-sm font-medium">{level.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Votre adresse
              </Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Saisissez votre adresse complète"
                    required
                    className="text-base flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="px-3 flex-shrink-0"
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
                    🔒 <span className="ml-1">Votre adresse exacte ne sera visible qu'après acceptation</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardContent className="p-4">
              <Label htmlFor="budget" className="text-sm font-medium text-gray-700 mb-2 block">
                Budget estimé (optionnel)
              </Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="budget"
                  type="number"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  placeholder="150"
                  className="pl-10 text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Photos (bientôt) */}
          <Card className="opacity-60">
            <CardContent className="p-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Photos/Vidéos
              </Label>
              <Button type="button" variant="outline" className="w-full h-12" disabled>
                <Camera className="w-5 h-5 mr-2" />
                Ajouter des médias (bientôt)
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <Button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium rounded-xl" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Publication...
            </div>
          ) : (
            '🚀 Publier ma mission'
          )}
        </Button>
      </div>
    </div>
  );
}
