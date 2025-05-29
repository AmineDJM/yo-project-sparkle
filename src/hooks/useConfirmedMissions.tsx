
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

export function useConfirmedMissions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Vérifier si le prestataire est en ligne
  useEffect(() => {
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

    checkOnlineStatus();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchConfirmedMissions = async () => {
      try {
        // Récupérer les missions où le prestataire a postulé et qui sont confirmées
        // Pour l'instant, on simule avec status = 'in_progress' ou 'completed'
        const { data, error } = await supabase
          .from('service_requests')
          .select(`
            *
          `)
          .in('status', ['in_progress', 'completed'])
          .eq('client_id', user.id); // Temporaire - il faudra une vraie relation

        if (error) {
          console.error('Erreur lors du chargement des missions confirmées:', error);
          return;
        }

        console.log('📋 Missions confirmées chargées:', data?.length || 0);
        setMissions(data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmedMissions();

    // Écouter les mises à jour en temps réel
    const channel = supabase
      .channel('confirmed-missions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests'
        },
        (payload) => {
          const updatedMission = payload.new as ServiceRequest;
          
          if (['in_progress', 'completed'].includes(updatedMission.status || '')) {
            setMissions(prev => {
              const exists = prev.find(m => m.id === updatedMission.id);
              if (exists) {
                return prev.map(m => m.id === updatedMission.id ? updatedMission : m);
              } else {
                return [updatedMission, ...prev];
              }
            });
          } else {
            // Retirer de la liste si plus confirmée
            setMissions(prev => prev.filter(m => m.id !== updatedMission.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { missions, loading, isOnline };
}
