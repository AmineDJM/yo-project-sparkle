
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];
type NewMessage = Database['public']['Tables']['messages']['Insert'];

export function useChat(requestId: string, providerId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId || !user) return;

    const fetchMessages = async () => {
      try {
        let query = supabase
          .from('messages')
          .select('*')
          .eq('request_id', requestId)
          .order('created_at', { ascending: true });

        // Si un providerId est spécifié, filtrer les messages pour cette conversation
        if (providerId) {
          query = query.or(`sender_id.eq.${providerId},receiver_id.eq.${providerId}`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          console.error('Erreur lors du chargement des messages:', fetchError);
          setError(fetchError.message);
          return;
        }

        setMessages(data || []);
        console.log('Messages chargés:', data?.length || 0);
      } catch (err: any) {
        console.error('Erreur:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Écouter les nouveaux messages en temps réel
    const channel = supabase
      .channel(`messages-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('Nouveau message reçu:', newMessage);
          
          // Ajouter le message seulement s'il correspond au filtre providerId
          if (!providerId || newMessage.sender_id === providerId || newMessage.receiver_id === providerId) {
            setMessages(prev => {
              // Éviter les doublons
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, providerId, user]);

  const sendMessage = async (content: string, receiverId?: string) => {
    if (!user || !requestId || !content.trim()) {
      return { error: 'Paramètres manquants' };
    }

    try {
      const messageData: NewMessage = {
        content: content.trim(),
        sender_id: user.id,
        receiver_id: receiverId || null,
        request_id: requestId
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        return { error: error.message };
      }

      console.log('Message envoyé avec succès');
      return { error: null };
    } catch (err: any) {
      console.error('Erreur:', err);
      return { error: err.message };
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage
  };
}
