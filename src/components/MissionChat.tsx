
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
  const [callDuration, setCallDuration] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const callStartTime = useRef<number>(0);

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
            callStartTime.current = Date.now();
          }
          
          if (updatedMessage.content?.includes('CALL_ENDED')) {
            setIsCallActive(false);
            setIsOutgoingCall(false);
            setIsIncomingCall(false);
            setCallDuration(0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [missionId, user?.id]);

  // Timer pour la durée d'appel
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

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

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
            <p className="text-xs text-gray-500">
              {isCallActive ? `En communication - ${formatCallDuration(callDuration)}` : 'Conversation'}
            </p>
          </div>
        </div>
        
        {/* Boutons d'appel */}
        <div className="flex items-center space-x-2">
          {!isCallActive && !isOutgoingCall && !isIncomingCall && (
            <Button onClick={startCall} className="bg-green-600 hover:bg-green-700 p-2">
              <Phone className="w-5 h-5" />
            </Button>
          )}
          
          {(isCallActive || isOutgoingCall) && (
            <Button onClick={endCall} variant="destructive" className="p-2">
              <PhoneOff className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Interface d'appel entrant */}
      {isIncomingCall && (
        <div className="bg-blue-600 text-white p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Appel entrant</h3>
            <p className="text-blue-100 mb-6">Quelqu'un vous appelle...</p>
            <div className="flex justify-center space-x-4">
              <Button onClick={acceptCall} className="bg-green-600 hover:bg-green-700 px-8 py-3">
                <Phone className="w-5 h-5 mr-2" />
                Décrocher
              </Button>
              <Button 
                onClick={() => setIsIncomingCall(false)} 
                variant="destructive" 
                className="px-8 py-3"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                Refuser
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Interface d'appel sortant */}
      {isOutgoingCall && (
        <div className="bg-blue-600 text-white p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Appel en cours...</h3>
            <p className="text-blue-100 mb-6">En attente de réponse</p>
            <Button onClick={endCall} variant="destructive" className="px-8 py-3">
              <PhoneOff className="w-5 h-5 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Interface d'appel actif */}
      {isCallActive && (
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Communication en cours</p>
              <p className="text-green-100 text-sm">{formatCallDuration(callDuration)}</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setIsMuted(!isMuted)}
                variant={isMuted ? "destructive" : "secondary"}
                size="sm"
                className="w-10 h-10 p-0"
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setIsVideoOn(!isVideoOn)}
                variant={isVideoOn ? "default" : "secondary"}
                size="sm"
                className="w-10 h-10 p-0"
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              <Button onClick={endCall} variant="destructive" size="sm" className="w-10 h-10 p-0">
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Note explicative */}
      {(isCallActive || isOutgoingCall || isIncomingCall) && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <p className="text-yellow-800 text-xs text-center">
            💡 Simulation d'appel - Les boutons simulent une interface d'appel réelle
          </p>
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

      {/* Actions en bas */}
      <div className="bg-white border-t p-4 space-y-3">
        {/* Bouton de confirmation */}
        <Button 
          onClick={sendConfirmationRequest}
          className="w-full bg-green-600 hover:bg-green-700"
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
