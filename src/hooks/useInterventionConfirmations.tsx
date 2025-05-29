
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface InterventionConfirmation {
  id: string;
  request_id: string;
  provider_id: string;
  client_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  provider_message?: string;
  client_response?: string;
  created_at: string;
  updated_at: string;
}

export function useInterventionConfirmations(missionId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmations, setConfirmations] = useState<InterventionConfirmation[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les confirmations existantes
  useEffect(() => {
    if (!user || !missionId) return;

    const loadConfirmations = async () => {
      try {
        // Utiliser une requête SQL brute pour éviter les problèmes de types
        const { data, error } = await supabase
          .rpc('sql', {
            query: `
              SELECT * FROM intervention_confirmations 
              WHERE request_id = $1 
              ORDER BY created_at DESC
            `,
            params: [missionId]
          });

        if (error) {
          console.error('❌ Erreur chargement confirmations:', error);
          // Fallback: essayer une requête directe
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('intervention_confirmations' as any)
            .select('*')
            .eq('request_id', missionId)
            .order('created_at', { ascending: false });

          if (fallbackError) {
            console.error('❌ Erreur fallback:', fallbackError);
            return;
          }

          console.log('✅ Confirmations chargées (fallback):', fallbackData);
          setConfirmations(fallbackData || []);
          return;
        }

        console.log('✅ Confirmations chargées:', data);
        setConfirmations(data || []);
      } catch (error) {
        console.error('❌ Erreur:', error);
        setConfirmations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConfirmations();

    // Écouter les mises à jour en temps réel
    const channel = supabase
      .channel(`intervention-confirmations-${missionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intervention_confirmations',
          filter: `request_id=eq.${missionId}`
        },
        (payload) => {
          console.log('🔄 Confirmation mise à jour:', payload);
          
          if (payload.eventType === 'INSERT') {
            setConfirmations(prev => [payload.new as InterventionConfirmation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConfirmations(prev => 
              prev.map(conf => 
                conf.id === payload.new.id ? payload.new as InterventionConfirmation : conf
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, missionId]);

  const createConfirmationRequest = async (providerId: string, clientId: string, message?: string) => {
    if (!user) return;

    try {
      // Utiliser une insertion SQL brute
      const { data, error } = await supabase
        .rpc('sql', {
          query: `
            INSERT INTO intervention_confirmations (request_id, provider_id, client_id, provider_message)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `,
          params: [missionId, providerId, clientId, message]
        });

      if (error) {
        console.error('❌ Erreur création confirmation:', error);
        // Fallback: essayer une insertion directe
        const { error: fallbackError } = await supabase
          .from('intervention_confirmations' as any)
          .insert({
            request_id: missionId,
            provider_id: providerId,
            client_id: clientId,
            provider_message: message
          });

        if (fallbackError) {
          console.error('❌ Erreur fallback insertion:', fallbackError);
          toast({
            title: "Erreur",
            description: "Impossible de créer la demande de confirmation",
            variant: "destructive"
          });
          return;
        }
      }

      console.log('✅ Demande de confirmation créée');
      toast({
        title: "Demande envoyée",
        description: "La demande de confirmation a été envoyée au client"
      });
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  };

  const respondToConfirmation = async (confirmationId: string, status: 'accepted' | 'rejected', response?: string) => {
    if (!user) return;

    try {
      // Utiliser une mise à jour SQL brute
      const { data, error } = await supabase
        .rpc('sql', {
          query: `
            UPDATE intervention_confirmations 
            SET status = $1, client_response = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING *
          `,
          params: [status, response, confirmationId]
        });

      if (error) {
        console.error('❌ Erreur réponse confirmation:', error);
        // Fallback: essayer une mise à jour directe
        const { error: fallbackError } = await supabase
          .from('intervention_confirmations' as any)
          .update({
            status,
            client_response: response,
            updated_at: new Date().toISOString()
          })
          .eq('id', confirmationId);

        if (fallbackError) {
          console.error('❌ Erreur fallback update:', fallbackError);
          toast({
            title: "Erreur",
            description: "Impossible de répondre à la confirmation",
            variant: "destructive"
          });
          return;
        }
      }

      console.log('✅ Réponse confirmation envoyée');
      toast({
        title: status === 'accepted' ? "Intervention confirmée" : "Intervention refusée",
        description: status === 'accepted' 
          ? "L'intervention a été confirmée avec succès" 
          : "L'intervention a été refusée"
      });
    } catch (error) {
      console.error('❌ Erreur:', error);
    }
  };

  return {
    confirmations,
    loading,
    createConfirmationRequest,
    respondToConfirmation
  };
}
