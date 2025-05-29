
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];
type InterventionConfirmation = Database['public']['Tables']['intervention_confirmations']['Row'];

interface ConfirmedMissionWithRequest extends InterventionConfirmation {
  service_request: ServiceRequest;
}

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
        console.log('📋 Récupération des missions confirmées pour:', user.id);
        
        // Récupérer les confirmations d'intervention acceptées
        const { data: confirmations, error: confirmationsError } = await supabase
          .from('intervention_confirmations')
          .select(`
            *,
            service_request:service_requests(*)
          `)
          .eq('status', 'accepted')
          .or(`provider_id.eq.${user.id},client_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (confirmationsError) {
          console.error('❌ Erreur lors du chargement des confirmations:', confirmationsError);
          return;
        }

        console.log('📊 Confirmations trouvées:', confirmations?.length || 0);

        // Extraire les missions depuis les confirmations
        const confirmedMissions = (confirmations || [])
          .map(conf => (conf as any).service_request)
          .filter(mission => mission) as ServiceRequest[];

        setMissions(confirmedMissions);
        console.log('✅ Missions confirmées chargées:', confirmedMissions.length);
      } catch (error) {
        console.error('❌ Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmedMissions();

    // Écouter les nouvelles confirmations d'intervention
    const channel = supabase
      .channel('confirmed-missions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intervention_confirmations'
        },
        async (payload) => {
          console.log('🔔 Changement confirmation intervention:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new.status === 'accepted') {
            // Récupérer les détails de la mission
            const { data: mission, error } = await supabase
              .from('service_requests')
              .select('*')
              .eq('id', payload.new.request_id)
              .single();

            if (!error && mission) {
              setMissions(prev => {
                const exists = prev.find(m => m.id === mission.id);
                if (!exists) {
                  return [mission, ...prev];
                }
                return prev;
              });
            }
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
