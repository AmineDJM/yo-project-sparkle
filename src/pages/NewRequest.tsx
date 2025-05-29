
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Camera, MapPin } from 'lucide-react';

export default function NewRequest() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [address, setAddress] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: 'plomberie', label: 'Plomberie' },
    { value: 'electricite', label: 'Électricité' },
    { value: 'serrurerie', label: 'Serrurerie' },
    { value: 'demenagement', label: 'Déménagement' },
    { value: 'menage', label: 'Ménage' },
    { value: 'jardinage', label: 'Jardinage' },
    { value: 'bricolage', label: 'Bricolage' },
    { value: 'autre', label: 'Autre' },
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Faible' },
    { value: 'medium', label: 'Moyen' },
    { value: 'high', label: 'Élevé' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // In a real app, you would use a geocoding service here
          setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          toast({
            title: "Position détectée",
            description: "Votre position a été ajoutée à la demande",
          });
        },
        () => {
          toast({
            variant: "destructive",
            title: "Erreur de géolocalisation",
            description: "Impossible d'obtenir votre position",
          });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const requestData = {
        client_id: user.id,
        title,
        description,
        category: category as any,
        urgency: urgency as any,
        address,
        latitude: 0, // Would be set from geolocation
        longitude: 0, // Would be set from geolocation
        estimated_budget: estimatedBudget ? parseFloat(estimatedBudget) : null,
      };

      console.log('Submitting request data:', requestData);

      const { error } = await supabase.from('service_requests').insert(requestData);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Demande créée !",
        description: "Votre demande a été envoyée aux prestataires de la zone",
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = '/'}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Nouvelle demande</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Décrivez votre besoin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la demande</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Fuite d'eau sous l'évier"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le problème en détail..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgence</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Votre adresse"
                    required
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={getCurrentLocation}
                    className="px-3"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget estimé (optionnel)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  placeholder="Ex: 150"
                />
              </div>

              <div className="space-y-2">
                <Label>Photos/Vidéos (bientôt disponible)</Label>
                <Button type="button" variant="outline" className="w-full" disabled>
                  <Camera className="w-4 h-4 mr-2" />
                  Ajouter des médias
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={loading}
              >
                {loading ? 'Envoi...' : 'Publier la demande'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
