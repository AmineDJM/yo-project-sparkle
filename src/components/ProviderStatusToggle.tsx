
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { MapPin, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProviderStatusToggle() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const { toast } = useToast();

  // Vérifier le statut initial
  useEffect(() => {
    checkOnlineStatus();
  }, [user]);

  const checkOnlineStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        return;
      }

      const online = !!(data?.latitude && data?.longitude);
      setIsOnline(online);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Géolocalisation non supportée'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const toggleOnlineStatus = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      if (!isOnline) {
        // Se mettre en ligne - obtenir la géolocalisation
        setLocationLoading(true);
        
        try {
          const location = await getCurrentLocation();
          
          const { error } = await supabase
            .from('profiles')
            .update({
              latitude: location.lat,
              longitude: location.lng,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (error) throw error;

          setIsOnline(true);
          toast({
            title: "✅ Vous êtes en ligne",
            description: "Vous recevrez maintenant les missions en temps réel",
          });

        } catch (locationError) {
          console.error('Erreur de géolocalisation:', locationError);
          toast({
            variant: "destructive",
            title: "Erreur de géolocalisation",
            description: "Impossible d'obtenir votre position. Veuillez autoriser la géolocalisation.",
          });
        } finally {
          setLocationLoading(false);
        }

      } else {
        // Se mettre hors ligne
        const { error } = await supabase
          .from('profiles')
          .update({
            latitude: null,
            longitude: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;

        setIsOnline(false);
        toast({
          title: "📴 Vous êtes hors ligne",
          description: "Vous ne recevrez plus de nouvelles missions",
        });
      }

    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
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
    <Card className={`transition-all ${isOnline ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              {locationLoading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : isOnline ? (
                <Wifi className="w-6 h-6 text-white" />
              ) : (
                <WifiOff className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </h3>
              <p className="text-sm text-gray-600">
                {isOnline ? 'Vous recevez les missions' : 'Activez pour recevoir des missions'}
              </p>
            </div>
          </div>
          
          <Switch
            checked={isOnline}
            onCheckedChange={toggleOnlineStatus}
            disabled={loading || locationLoading}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        {!isOnline && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center text-sm text-blue-700">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Activez votre statut pour commencer à recevoir des missions près de vous</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
