
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type MissionProposal = Database['public']['Tables']['mission_proposals']['Row'];
type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

interface ProposalWithRequest extends MissionProposal {
  service_request: ServiceRequest;
  timeLeft: number;
}

export function useRealtimeProposals() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<ProposalWithRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les propositions actives au démarrage
  useEffect(() => {
    if (!user) return;

    const loadActiveProposals = async () => {
      try {
        const { data, error } = await supabase
          .from('mission_proposals')
          .select(`
            *,
            service_request:service_requests(*)
          `)
          .eq('provider_id', user.id)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());

        if (error) {
          console.error('Erreur lors du chargement des propositions:', error);
          return;
        }

        const proposalsWithTime = (data || []).map(proposal => ({
          ...proposal,
          service_request: proposal.service_request as ServiceRequest,
          timeLeft: Math.max(0, Math.floor((new Date(proposal.expires_at).getTime() - Date.now()) / 1000))
        }));

        setProposals(proposalsWithTime);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActiveProposals();
  }, [user]);

  // Écouter les nouvelles propositions en temps réel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('mission-proposals-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mission_proposals',
          filter: `provider_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('🚨 Nouvelle proposition reçue!', payload);
          
          // Charger les détails de la mission
          const { data: requestData } = await supabase
            .from('service_requests')
            .select('*')
            .eq('id', payload.new.request_id)
            .single();

          if (requestData) {
            const newProposal: ProposalWithRequest = {
              ...payload.new as MissionProposal,
              service_request: requestData,
              timeLeft: 60 // 60 secondes
            };

            setProposals(prev => [newProposal, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Timer pour décompter le temps restant
  useEffect(() => {
    const interval = setInterval(() => {
      setProposals(prev => 
        prev.map(proposal => {
          const newTimeLeft = Math.max(0, proposal.timeLeft - 1);
          
          // Si le temps est écoulé, marquer comme expiré
          if (newTimeLeft === 0 && proposal.status === 'pending') {
            handleExpireProposal(proposal.id);
          }
          
          return { ...proposal, timeLeft: newTimeLeft };
        }).filter(proposal => proposal.timeLeft > 0 || proposal.status !== 'pending')
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleExpireProposal = async (proposalId: string) => {
    try {
      await supabase
        .from('mission_proposals')
        .update({ status: 'expired' })
        .eq('id', proposalId);

      setProposals(prev => prev.filter(p => p.id !== proposalId));
    } catch (error) {
      console.error('Erreur lors de l\'expiration:', error);
    }
  };

  const acceptProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('mission_proposals')
        .update({ status: 'accepted' })
        .eq('id', proposalId);

      if (error) throw error;

      setProposals(prev => prev.filter(p => p.id !== proposalId));
      console.log('✅ Proposition acceptée!');
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
    }
  };

  const rejectProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('mission_proposals')
        .update({ status: 'rejected' })
        .eq('id', proposalId);

      if (error) throw error;

      setProposals(prev => prev.filter(p => p.id !== proposalId));
      console.log('❌ Proposition refusée');
    } catch (error) {
      console.error('Erreur lors du refus:', error);
    }
  };

  return {
    proposals,
    loading,
    acceptProposal,
    rejectProposal
  };
}
