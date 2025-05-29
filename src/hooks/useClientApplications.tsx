
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
        console.log('🔍 CLIENT: Récupération des candidatures pour le client:', user.id);
        
        // Récupérer d'abord toutes les missions du client
        const { data: userMissions, error: missionsError } = await supabase
          .from('service_requests')
          .select('id')
          .eq('client_id', user.id);

        if (missionsError) {
          console.error('❌ CLIENT: Erreur récupération missions:', missionsError);
          return;
        }

        console.log('📋 CLIENT: Missions du client trouvées:', userMissions?.length || 0);

        if (!userMissions || userMissions.length === 0) {
          setApplications([]);
          return;
        }

        const missionIds = userMissions.map(m => m.id);

        // Récupérer toutes les candidatures acceptées et confirmées pour ces missions
        const { data, error } = await supabase
          .from('mission_proposals')
          .select(`
            *,
            service_request:service_requests(*),
            provider:profiles!mission_proposals_provider_id_fkey(*)
          `)
          .in('request_id', missionIds)
          .in('status', ['accepted', 'confirmed'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ CLIENT: Erreur lors du chargement des candidatures:', error);
          return;
        }

        console.log('📊 CLIENT: Données candidatures brutes reçues:', data);

        const applicationsWithDetails = (data || []).map(item => ({
          ...item,
          service_request: item.service_request as ServiceRequest,
          provider: item.provider as Profile
        }));

        setApplications(applicationsWithDetails);
        console.log('✅ CLIENT: Candidatures chargées:', applicationsWithDetails.length, applicationsWithDetails);
      } catch (error) {
        console.error('❌ CLIENT: Erreur:', error);
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
          event: '*',
          schema: 'public',
          table: 'mission_proposals'
        },
        async (payload) => {
          console.log('🔔 CLIENT: Changement temps réel mission_proposals:', payload);
          
          // Traiter tous les changements qui concernent les status accepted/confirmed
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && 
              (payload.new.status === 'accepted' || payload.new.status === 'confirmed')) {
            
            console.log('📋 CLIENT: Candidature détectée, vérification si elle concerne ce client...');
            
            // Vérifier d'abord si cette mission appartient au client connecté
            const { data: missionData, error: missionError } = await supabase
              .from('service_requests')
              .select('client_id')
              .eq('id', payload.new.request_id)
              .single();

            if (missionError || !missionData || missionData.client_id !== user.id) {
              console.log('📋 CLIENT: Cette candidature ne concerne pas ce client');
              return;
            }

            console.log('📋 CLIENT: Candidature pour ce client, récupération des détails...');
            
            // Charger les détails complets de la candidature
            const { data: fullData, error: detailError } = await supabase
              .from('mission_proposals')
              .select(`
                *,
                service_request:service_requests(*),
                provider:profiles!mission_proposals_provider_id_fkey(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (detailError) {
              console.error('❌ CLIENT: Erreur récupération détails:', detailError);
              return;
            }

            console.log('📋 CLIENT: Détails candidature récupérés:', fullData);

            if (fullData) {
              const newApplication: ApplicationWithDetails = {
                ...fullData,
                service_request: fullData.service_request as ServiceRequest,
                provider: fullData.provider as Profile
              };

              setApplications(prev => {
                const exists = prev.find(app => app.id === newApplication.id);
                if (exists) {
                  console.log('🔄 CLIENT: Mise à jour candidature existante');
                  return prev.map(app => app.id === newApplication.id ? newApplication : app);
                } else {
                  console.log('➕ CLIENT: Nouvelle candidature ajoutée');
                  return [newApplication, ...prev];
                }
              });

              console.log('🔔 CLIENT: Candidature mise à jour:', newApplication.provider?.full_name, 'Status:', newApplication.status);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 CLIENT: Status subscription candidatures:', status);
      });

    return () => {
      console.log('🔌 CLIENT: Fermeture subscription candidatures');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const confirmProvider = async (applicationId: string) => {
    try {
      console.log('✅ CLIENT: Confirmation du prestataire:', applicationId);
      
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

      console.log('✅ CLIENT: Prestataire confirmé avec succès');
    } catch (error) {
      console.error('❌ CLIENT: Erreur lors de la confirmation:', error);
    }
  };

  return { applications, loading, confirmProvider };
}
