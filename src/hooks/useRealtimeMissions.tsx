
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

export function useRealtimeMissions(userLat?: number, userLng?: number, radius = 10) {
  const [missions, setMissions] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les missions initiales
    const fetchInitialMissions = async () => {
      try {
        const { data, error } = await supabase
          .from('service_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur lors du chargement des missions:', error);
          return;
        }

        setMissions(data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMissions();

    // Écouter les nouvelles missions en temps réel
    const channel = supabase
      .channel('service-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_requests'
        },
        (payload) => {
          console.log('🚨 Nouvelle mission reçue en temps réel!', payload);
          const newMission = payload.new as ServiceRequest;
          
          // Ajouter la nouvelle mission en haut de la liste
          setMissions(prev => [newMission, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests'
        },
        (payload) => {
          console.log('Mission mise à jour:', payload);
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
  }, [userLat, userLng, radius]);

  return { missions, loading };
}
