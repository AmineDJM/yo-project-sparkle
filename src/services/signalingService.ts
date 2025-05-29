
import { supabase } from '@/integrations/supabase/client';
import { SignalingMessage } from '@/types/webrtc';

export class SignalingService {
  static async sendMessage(missionId: string, userId: string, signalData: SignalingMessage): Promise<void> {
    try {
      const { data: missionData } = await supabase
        .from('service_requests')
        .select('client_id')
        .eq('id', missionId)
        .single();

      if (!missionData) return;

      await supabase
        .from('messages')
        .insert({
          request_id: missionId,
          sender_id: userId,
          receiver_id: missionData.client_id,
          content: `WEBRTC_SIGNAL:${JSON.stringify(signalData)}`
        });
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  }

  static subscribeToMessages(
    missionId: string, 
    userId: string, 
    onMessage: (signalData: SignalingMessage) => void
  ) {
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
          if (message.sender_id === userId) return;

          try {
            if (message.content?.startsWith('WEBRTC_SIGNAL:')) {
              const signalData = JSON.parse(message.content.replace('WEBRTC_SIGNAL:', ''));
              onMessage(signalData);
            }
          } catch (error) {
            console.error('Error handling signaling message:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
