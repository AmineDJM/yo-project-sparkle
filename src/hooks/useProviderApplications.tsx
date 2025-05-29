
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

interface ApplicationWithRequest {
  id: string;
  request_id: string;
  created_at: string;
  status: string;
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
        // Récupérer toutes les propositions acceptées (= candidatures)
        const { data, error } = await supabase
          .from('mission_proposals')
          .select(`
            id,
            request_id,
            created_at,
            status,
            service_request:service_requests(*)
          `)
          .eq('provider_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur lors du chargement des candidatures:', error);
          return;
        }

        const applicationsWithRequest = (data || []).map(item => ({
          id: item.id,
          request_id: item.request_id,
          created_at: item.created_at,
          status: item.status,
          service_request: item.service_request as ServiceRequest
        }));

        setApplications(applicationsWithRequest);
        console.log('📋 Candidatures chargées:', applicationsWithRequest.length);
      } catch (error) {
        console.error('Erreur:', error);
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
          event: 'UPDATE',
          schema: 'public',
          table: 'mission_proposals',
          filter: `provider_id=eq.${user.id}`
        },
        async (payload) => {
          if (payload.new.status === 'accepted') {
            // Charger les détails de la mission
            const { data: requestData } = await supabase
              .from('service_requests')
              .select('*')
              .eq('id', payload.new.request_id)
              .single();

            if (requestData) {
              const newApplication = {
                id: payload.new.id,
                request_id: payload.new.request_id,
                created_at: payload.new.created_at,
                status: payload.new.status,
                service_request: requestData
              };

              setApplications(prev => {
                const exists = prev.find(app => app.id === newApplication.id);
                if (exists) {
                  return prev.map(app => app.id === newApplication.id ? newApplication : app);
                } else {
                  return [newApplication, ...prev];
                }
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

  return { applications, loading };
}
