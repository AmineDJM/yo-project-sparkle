
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

interface MissionChatProps {
  missionId: string;
  missionTitle: string;
  onBack: () => void;
}

export default function MissionChat({ missionId, missionTitle, onBack }: MissionChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [isOutgoingCall, setIsOutgoingCall] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [callPartner, setCallPartner] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    
    // Écouter les nouveaux messages
    const channel = supabase
      .channel(`mission-chat-${missionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${missionId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${missionId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          
          // Gérer les demandes d'appel
          if (updatedMessage.content?.includes('CALL_REQUEST') && updatedMessage.sender_id !== user?.id) {
            setIsIncomingCall(true);
            setCallPartner(updatedMessage.sender_id || '');
          }
          
          if (updatedMessage.content?.includes('CALL_ACCEPTED')) {
            setIsCallActive(true);
            setIsOutgoingCall(false);
            setIsIncomingCall(false);
          }
          
          if (updatedMessage.content?.includes('CALL_ENDED')) {
            setIsCallActive(false);
            setIsOutgoingCall(false);
            setIsIncomingCall(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [missionId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', missionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      // Récupérer l'ID du destinataire
      const { data: missionData } = await supabase
        .from('service_requests')
        .select('client_id')
        .eq('id', missionId)
        .single();

      if (!missionData) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: missionId,
          sender_id: user.id,
          receiver_id: missionData.client_id,
          content: newMessage
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    }
  };

  const sendConfirmationRequest = async () => {
    if (!user) return;

    try {
      const { data: missionData } = await supabase
        .from('service_requests')
        .select('client_id')
        .eq('id', missionId)
        .single();

      if (!missionData) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: missionId,
          sender_id: user.id,
          receiver_id: missionData.client_id,
          content: '🤝 Je confirme l\'intervention - Êtes-vous d\'accord pour valider cette mission ?'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la confirmation:', error);
    }
  };

  const startCall = async () => {
    if (!user) return;

    try {
      const { data: missionData } = await supabase
        .from('service_requests')
        .select('client_id')
        .eq('id', missionId)
        .single();

      if (!missionData) return;

      setIsOutgoingCall(true);

      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: missionId,
          sender_id: user.id,
          receiver_id: missionData.client_id,
          content: 'CALL_REQUEST - Demande d\'appel'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'appel:', error);
    }
  };

  const acceptCall = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: missionId,
          sender_id: user.id,
          receiver_id: callPartner,
          content: 'CALL_ACCEPTED - Appel accepté'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'appel:', error);
    }
  };

  const endCall = async () => {
    if (!user) return;

    try {
      const { data: missionData } = await supabase
        .from('service_requests')
        .select('client_id')
        .eq('id', missionId)
        .single();

      if (!missionData) return;

      const receiverId = callPartner || missionData.client_id;

      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: missionId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: 'CALL_ENDED - Appel terminé'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la fin de l\'appel:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-gray-900">{missionTitle}</h1>
            <p className="text-xs text-gray-500">Conversation</p>
          </div>
        </div>
        
        {/* Bouton d'appel */}
        {!isCallActive && !isOutgoingCall && !isIncomingCall && (
          <Button onClick={startCall} className="bg-green-600 hover:bg-green-700 p-2">
            <Phone className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Interface d'appel entrant */}
      {isIncomingCall && (
        <div className="bg-blue-600 text-white p-4 text-center">
          <p className="mb-3">📞 Appel entrant...</p>
          <div className="flex justify-center space-x-3">
            <Button onClick={acceptCall} className="bg-green-600 hover:bg-green-700">
              <Phone className="w-4 h-4 mr-2" />
              Accepter
            </Button>
            <Button onClick={() => setIsIncomingCall(false)} variant="destructive">
              <PhoneOff className="w-4 h-4 mr-2" />
              Refuser
            </Button>
          </div>
        </div>
      )}

      {/* Interface d'appel sortant */}
      {isOutgoingCall && (
        <div className="bg-blue-600 text-white p-4 text-center">
          <p className="mb-3">📞 Appel en cours...</p>
          <Button onClick={endCall} variant="destructive">
            <PhoneOff className="w-4 h-4 mr-2" />
            Raccrocher
          </Button>
        </div>
      )}

      {/* Interface d'appel actif */}
      {isCallActive && (
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <p>📞 En communication</p>
            <div className="flex space-x-2">
              <Button
                onClick={() => setIsMuted(!isMuted)}
                variant={isMuted ? "destructive" : "secondary"}
                size="sm"
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setIsVideoOn(!isVideoOn)}
                variant={isVideoOn ? "default" : "secondary"}
                size="sm"
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              <Button onClick={endCall} variant="destructive" size="sm">
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isMyMessage = message.sender_id === user?.id;
          const isSystemMessage = message.content?.includes('CALL_') || message.content?.includes('🤝');
          
          if (message.content?.includes('CALL_REQUEST') || 
              message.content?.includes('CALL_ACCEPTED') || 
              message.content?.includes('CALL_ENDED')) {
            return null; // Ne pas afficher les messages système d'appel
          }
          
          return (
            <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isSystemMessage 
                  ? 'bg-blue-100 text-blue-800 text-center w-full' 
                  : isMyMessage 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  isSystemMessage ? 'text-blue-600' : isMyMessage ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.created_at || '')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Bouton de confirmation */}
      <div className="bg-white border-t p-4">
        <Button 
          onClick={sendConfirmationRequest}
          className="w-full bg-green-600 hover:bg-green-700 mb-3"
        >
          🤝 Demander la confirmation de l'intervention
        </Button>

        {/* Input de message */}
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
