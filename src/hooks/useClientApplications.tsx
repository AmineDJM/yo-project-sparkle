
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];
type MissionProposal = Database['public']['Tables']['mission_proposals']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface ApplicationWithDetails extends MissionProposal {
  service_request: ServiceRequest;
  provider: Profile;
}

export function useClientApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchApplications = async () => {
      try {
        // Récupérer toutes les candidatures pour les missions du client
        const { data, error } = await supabase
          .from('mission_proposals')
          .select(`
            *,
            service_request:service_requests(*),
            provider:profiles(*)
          `)
          .eq('service_requests.client_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erreur lors du chargement des candidatures:', error);
          return;
        }

        const applicationsWithDetails = (data || []).map(item => ({
          ...item,
          service_request: item.service_request as ServiceRequest,
          provider: item.provider as Profile
        }));

        setApplications(applicationsWithDetails);
        console.log('📨 Candidatures client chargées:', applicationsWithDetails.length);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();

    // Écouter les nouvelles candidatures en temps réel
    const channel = supabase
      .channel('client-applications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mission_proposals'
        },
        async (payload) => {
          if (payload.new.status === 'accepted') {
            // Charger les détails complets de la candidature
            const { data: fullData } = await supabase
              .from('mission_proposals')
              .select(`
                *,
                service_request:service_requests(*),
                provider:profiles(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (fullData && fullData.service_request?.client_id === user.id) {
              const newApplication = {
                ...fullData,
                service_request: fullData.service_request as ServiceRequest,
                provider: fullData.provider as Profile
              };

              setApplications(prev => {
                const exists = prev.find(app => app.id === newApplication.id);
                if (exists) {
                  return prev.map(app => app.id === newApplication.id ? newApplication : app);
                } else {
                  return [newApplication, ...prev];
                }
              });

              console.log('🔔 Nouvelle candidature reçue:', newApplication.provider?.full_name);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const confirmProvider = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('mission_proposals')
        .update({ status: 'confirmed' })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'confirmed' } 
            : app
        )
      );

      console.log('✅ Prestataire confirmé');
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
    }
  };

  return { applications, loading, confirmProvider };
}
