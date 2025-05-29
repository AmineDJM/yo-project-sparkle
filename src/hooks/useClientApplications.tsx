
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
        console.log('🔍 Récupération des candidatures pour le client:', user.id);
        
        // Récupérer toutes les candidatures pour les missions du client
        const { data, error } = await supabase
          .from('mission_proposals')
          .select(`
            *,
            service_request:service_requests!inner(*),
            provider:profiles!mission_proposals_provider_id_fkey(*)
          `)
          .eq('service_requests.client_id', user.id)
          .in('status', ['accepted', 'confirmed'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erreur lors du chargement des candidatures:', error);
          return;
        }

        console.log('📊 Données candidatures client brutes reçues:', data);

        const applicationsWithDetails = (data || []).map(item => ({
          ...item,
          service_request: item.service_request as ServiceRequest,
          provider: item.provider as Profile
        }));

        setApplications(applicationsWithDetails);
        console.log('✅ Candidatures client chargées:', applicationsWithDetails.length, applicationsWithDetails);
      } catch (error) {
        console.error('❌ Erreur:', error);
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
          console.log('🔔 Changement en temps réel sur mission_proposals pour client:', payload);
          
          // Traiter les INSERT et UPDATE pour status accepted/confirmed
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && 
              (payload.new.status === 'accepted' || payload.new.status === 'confirmed')) {
            
            console.log('📋 Nouvelle candidature détectée, récupération des détails...');
            
            // Charger les détails complets de la candidature
            const { data: fullData, error: detailError } = await supabase
              .from('mission_proposals')
              .select(`
                *,
                service_request:service_requests!inner(*),
                provider:profiles!mission_proposals_provider_id_fkey(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (detailError) {
              console.error('❌ Erreur récupération détails:', detailError);
              return;
            }

            console.log('📋 Détails candidature récupérés:', fullData);

            // Vérifier que c'est bien pour ce client
            if (fullData && fullData.service_request?.client_id === user.id) {
              const newApplication: ApplicationWithDetails = {
                ...fullData,
                service_request: fullData.service_request as ServiceRequest,
                provider: fullData.provider as Profile
              };

              setApplications(prev => {
                const exists = prev.find(app => app.id === newApplication.id);
                if (exists) {
                  console.log('🔄 Mise à jour candidature existante');
                  return prev.map(app => app.id === newApplication.id ? newApplication : app);
                } else {
                  console.log('➕ Nouvelle candidature ajoutée pour le client');
                  return [newApplication, ...prev];
                }
              });

              console.log('🔔 Candidature client mise à jour:', newApplication.provider?.full_name, 'Status:', newApplication.status);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status subscription candidatures client:', status);
      });

    return () => {
      console.log('🔌 Fermeture subscription candidatures client');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const confirmProvider = async (applicationId: string) => {
    try {
      console.log('✅ Confirmation du prestataire:', applicationId);
      
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

      console.log('✅ Prestataire confirmé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la confirmation:', error);
    }
  };

  return { applications, loading, confirmProvider };
}
