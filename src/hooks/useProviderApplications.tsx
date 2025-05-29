
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];
type MissionProposal = Database['public']['Tables']['mission_proposals']['Row'];

interface ApplicationWithRequest extends MissionProposal {
  service_request: ServiceRequest;
}

export function useProviderApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchApplications = async () => {
      try {
        console.log('🔍 Récupération des candidatures pour le prestataire:', user.id);
        
        // Récupérer toutes les propositions acceptées et confirmées
        const { data, error } = await supabase
          .from('mission_proposals')
          .select(`
            *,
            service_request:service_requests(*)
          `)
          .eq('provider_id', user.id)
          .in('status', ['accepted', 'confirmed'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erreur lors du chargement des candidatures prestataire:', error);
          return;
        }

        console.log('📊 Candidatures prestataire données brutes:', data);

        const applicationsWithRequest = (data || []).map(item => ({
          ...item,
          service_request: item.service_request as ServiceRequest
        }));

        setApplications(applicationsWithRequest);
        console.log('✅ Candidatures prestataire chargées:', applicationsWithRequest.length, applicationsWithRequest);
      } catch (error) {
        console.error('❌ Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();

    // Écouter les mises à jour en temps réel
    const channel = supabase
      .channel('provider-applications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mission_proposals',
          filter: `provider_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('🔔 Changement temps réel mission_proposals prestataire:', payload);
          
          if (payload.eventType === 'UPDATE' && (payload.new.status === 'accepted' || payload.new.status === 'confirmed')) {
            // Charger les détails de la mission
            const { data: requestData } = await supabase
              .from('service_requests')
              .select('*')
              .eq('id', payload.new.request_id)
              .single();

            if (requestData) {
              const newApplication: ApplicationWithRequest = {
                ...payload.new as MissionProposal,
                service_request: requestData as ServiceRequest
              };

              setApplications(prev => {
                const exists = prev.find(app => app.id === newApplication.id);
                if (exists) {
                  console.log('🔄 Mise à jour candidature prestataire existante');
                  return prev.map(app => app.id === newApplication.id ? newApplication : app);
                } else {
                  console.log('➕ Nouvelle candidature prestataire ajoutée');
                  return [newApplication, ...prev];
                }
              });

              console.log('🔔 Candidature prestataire mise à jour:', newApplication.service_request.title, 'Status:', newApplication.status);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status subscription candidatures prestataire:', status);
      });

    return () => {
      console.log('🔌 Fermeture subscription candidatures prestataire');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { applications, loading };
}
