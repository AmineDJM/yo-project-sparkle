
import { supabase } from '@/integrations/supabase/client';
import { SignalingMessage } from '@/types/webrtc';

export class SignalingService {
  static async sendMessage(missionId: string, userId: string, signalData: SignalingMessage): Promise<void> {
    try {
      console.log('📡 Envoi signal WebRTC:', signalData.type);
      
      // Récupérer les informations de la mission
      const { data: missionData, error: missionError } = await supabase
        .from('service_requests')
        .select('client_id')
        .eq('id', missionId)
        .single();

      if (missionError || !missionData) {
        console.error('❌ Erreur mission pour signaling:', missionError);
        return;
      }

      // Récupérer les informations de la proposition
      const { data: proposalData, error: proposalError } = await supabase
        .from('mission_proposals')
        .select('provider_id')
        .eq('request_id', missionId)
        .in('status', ['accepted', 'confirmed'])
        .single();

      if (proposalError || !proposalData) {
        console.error('❌ Erreur proposition pour signaling:', proposalError);
        return;
      }

      // Déterminer le receiver selon le type d'utilisateur
      const isClient = userId === missionData.client_id;
      const receiverId = isClient ? proposalData.provider_id : missionData.client_id;

      console.log('📡 Envoi signal vers:', receiverId, 'de:', userId);

      await supabase
        .from('messages')
        .insert({
          request_id: missionId,
          sender_id: userId,
          receiver_id: receiverId,
          content: `WEBRTC_SIGNAL:${JSON.stringify(signalData)}`
        });

      console.log('✅ Signal WebRTC envoyé');
    } catch (error) {
      console.error('❌ Erreur envoi signal WebRTC:', error);
    }
  }

  static subscribeToMessages(
    missionId: string, 
    userId: string, 
    onMessage: (signalData: SignalingMessage) => void
  ) {
    console.log('📡 Inscription aux signaux WebRTC pour mission:', missionId);
    
    const channel = supabase
      .channel(`webrtc-${missionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${missionId}`
        },
        async (payload) => {
          const message = payload.new;
          
          // Ignorer nos propres messages
          if (message.sender_id === userId) return;

          try {
            if (message.content?.startsWith('WEBRTC_SIGNAL:')) {
              const signalData = JSON.parse(message.content.replace('WEBRTC_SIGNAL:', ''));
              console.log('📡 Signal WebRTC reçu:', signalData.type);
              onMessage(signalData);
            }
          } catch (error) {
            console.error('❌ Erreur traitement signal WebRTC:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Status subscription WebRTC:', status);
      });

    return () => {
      console.log('🔌 Fermeture subscription WebRTC');
      supabase.removeChannel(channel);
    };
  }
}
