
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type ServiceProposal = Database['public']['Tables']['service_proposals']['Row'];
type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

interface ApplicationWithRequest extends ServiceProposal {
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
        console.log('📋 Récupération des candidatures pour:', user.id);
        
        // Récupérer les candidatures acceptées
        const { data: proposals, error: proposalsError } = await supabase
          .from('service_proposals')
          .select(`
            *,
            service_request:service_requests(*)
          `)
          .eq('provider_id', user.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false });

        if (proposalsError) {
          console.error('❌ Erreur lors du chargement des candidatures:', proposalsError);
          return;
        }

        console.log('📊 Candidatures trouvées:', proposals?.length || 0);

        // Filtrer pour exclure celles qui ont une intervention confirmée
        const applicationsWithoutConfirmedInterventions = [];
        
        for (const proposal of proposals || []) {
          // Vérifier s'il y a une intervention confirmée pour cette mission
          const { data: confirmation } = await supabase
            .from('intervention_confirmations')
            .select('id')
            .eq('request_id', proposal.request_id)
            .eq('provider_id', user.id)
            .eq('status', 'accepted')
            .single();

          // Si pas d'intervention confirmée, inclure dans les candidatures
          if (!confirmation) {
            applicationsWithoutConfirmedInterventions.push(proposal as ApplicationWithRequest);
          }
        }

        setApplications(applicationsWithoutConfirmedInterventions);
        console.log('✅ Candidatures sans intervention confirmée:', applicationsWithoutConfirmedInterventions.length);
      } catch (error) {
        console.error('❌ Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();

    // Écouter les nouvelles candidatures
    const channel = supabase
      .channel('provider-applications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_proposals',
          filter: `provider_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('🔔 Changement candidature:', payload);
          fetchApplications(); // Refetch pour s'assurer de la cohérence
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intervention_confirmations'
        },
        async (payload) => {
          console.log('🔔 Changement confirmation intervention:', payload);
          fetchApplications(); // Refetch car cela peut affecter la liste des candidatures
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { applications, loading };
}
