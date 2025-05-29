
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function ProviderStatusToggle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Charger le statut actuel du prestataire
    loadProviderStatus();
  }, [user]);

  const loadProviderStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du statut:', error);
        return;
      }

      if (data?.latitude && data?.longitude) {
        setLocation({ lat: data.latitude, lng: data.longitude });
        setIsOnline(true);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const getCurrentLocation = () => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
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

  const toggleOnlineStatus = async (checked: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      if (checked) {
        // Passer en ligne - obtenir la géolocalisation
        const position = await getCurrentLocation();
        
        const { error } = await supabase
          .from('profiles')
          .update({
            latitude: position.lat,
            longitude: position.lng,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;

        setLocation(position);
        setIsOnline(true);
        
        toast({
          title: "Statut mis à jour",
          description: "Vous êtes maintenant en ligne et recevrez les missions",
        });
      } else {
        // Passer hors ligne
        const { error } = await supabase
          .from('profiles')
          .update({
            latitude: null,
            longitude: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;

        setLocation(null);
        setIsOnline(false);
        
        toast({
          title: "Statut mis à jour",
          description: "Vous êtes maintenant hors ligne",
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de changer le statut. Vérifiez vos permissions de géolocalisation.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">Statut professionnel</span>
          <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                En ligne
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Hors ligne
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isOnline ? 'Disponible pour recevoir des missions' : 'Non disponible'}
            </p>
            <p className="text-xs text-gray-500">
              {isOnline 
                ? 'Les clients peuvent voir votre disponibilité' 
                : 'Activez pour recevoir les nouvelles missions'
              }
            </p>
          </div>
          <Switch
            checked={isOnline}
            onCheckedChange={toggleOnlineStatus}
            disabled={loading}
          />
        </div>

        {isOnline && location && (
          <div className="pt-2 border-t">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Position: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Clock className="w-3 h-3 mr-1" />
              <span>Dernière mise à jour: maintenant</span>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="pt-2 border-t text-xs text-gray-500">
            💡 Activez votre statut en ligne pour commencer à recevoir des missions dans votre zone
          </div>
        )}
      </CardContent>
    </Card>
  );
}
