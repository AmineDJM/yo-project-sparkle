
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Euro, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

export default function ClientMissionsList() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchMissions = async () => {
      try {
        const { data, error } = await supabase
          .from('service_requests')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur lors du chargement des missions:', error);
          return;
        }

        setMissions(data || []);
        console.log('📝 Missions client chargées:', data?.length || 0);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();

    // Écouter les mises à jour en temps réel
    const channel = supabase
      .channel('client-missions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `client_id=eq.${user.id}`
        },
        (payload) => {
          const updatedMission = payload.new as ServiceRequest;
          setMissions(prev => 
            prev.map(mission => 
              mission.id === updatedMission.id ? updatedMission : mission
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'plomberie': '🔧',
      'electricite': '⚡',
      'serrurerie': '🔑',
      'demenagement': '📦',
      'menage': '🧹',
      'jardinage': '🌱',
      'bricolage': '🔨',
      'autre': '⚙️'
    };
    return emojis[category] || '⚙️';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ En attente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">🔄 En cours</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">✅ Terminée</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">❌ Annulée</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">❓ Statut inconnu</Badge>;
    }
  };

  const getMaskedAddress = (address: string) => {
    const parts = address.split(',');
    if (parts.length > 1) {
      return `${parts[parts.length - 2]?.trim() || 'Zone non spécifiée'}`;
    }
    return 'Zone non spécifiée';
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Mes missions
        </h2>
        <Button 
          onClick={() => navigate('/new-request')}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle mission
        </Button>
      </div>

      {/* Message si aucune mission */}
      {missions.length === 0 && (
        <Card className="text-center border-dashed border-2">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune mission
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Commencez par poster votre première mission !
            </p>
            <Button 
              onClick={() => navigate('/new-request')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Poster une mission
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des missions */}
      <div className="space-y-3">
        {missions.map((mission) => (
          <Card key={mission.id} className="border transition-all hover:shadow-md">
            <CardContent className="p-4">
              {/* Status et timing */}
              <div className="flex justify-between items-start mb-3">
                {getStatusBadge(mission.status)}
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTimeAgo(mission.created_at || '')}
                </span>
              </div>

              {/* Titre avec emoji */}
              <div className="flex items-start mb-3">
                <span className="text-2xl mr-3">
                  {getCategoryEmoji(mission.category || 'autre')}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {mission.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {mission.description}
                  </p>
                </div>
              </div>

              {/* Localisation */}
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">{getMaskedAddress(mission.address || '')}</span>
              </div>

              {/* Budget */}
              {mission.estimated_budget && (
                <div className="flex items-center text-sm font-medium text-green-600 mb-4">
                  <Euro className="w-4 h-4 mr-1" />
                  Budget estimé: {mission.estimated_budget}€
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Voir les détails
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
