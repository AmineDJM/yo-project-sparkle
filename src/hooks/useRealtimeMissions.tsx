
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

export function useRealtimeMissions(userLat?: number, userLng?: number, radius = 10) {
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
        
        if (online) {
          console.log('🟢 Prestataire en ligne, écoute des missions...');
        } else {
          console.log('🔴 Prestataire hors ligne');
          setMissions([]);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erreur:', error);
        setLoading(false);
      }
    };

    checkOnlineStatus();
  }, [user]);

  useEffect(() => {
    if (!isOnline) {
      setMissions([]);
      setLoading(false);
      return;
    }

    // Charger les missions initiales seulement si en ligne
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

        console.log('📋 Missions chargées:', data?.length || 0);
        setMissions(data || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMissions();

    // Écouter les nouvelles missions en temps réel seulement si en ligne
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
          console.log('📝 Mission mise à jour:', payload);
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
  }, [isOnline, userLat, userLng, radius]);

  return { missions, loading, isOnline };
}
