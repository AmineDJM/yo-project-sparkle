
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useInterventionConfirmations } from '@/hooks/useInterventionConfirmations';
import VideoCall from './VideoCall';
import InterventionConfirmationComponent from './InterventionConfirmation';
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
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [userType, setUserType] = useState<'client' | 'provider' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isCallActive,
    isOutgoingCall,
    isIncomingCall,
    isMuted,
    isVideoOn,
    callDuration,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    rejectCall,
    formatCallDuration
  } = useWebRTC(missionId);

  const {
    confirmations,
    loading: confirmationsLoading,
    createConfirmationRequest,
    respondToConfirmation
  } = useInterventionConfirmations(missionId);

  useEffect(() => {
    loadMessages();
    loadReceiverId();
    
    // Subscription pour les messages avec amélioration du temps réel
    const messagesChannel = supabase
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
          console.log('💬 CHAT: Nouveau message reçu:', newMessage);
          // Filtrer les messages de signalisation WebRTC
          if (!newMessage.content?.startsWith('WEBRTC_SIGNAL:')) {
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
      .subscribe((status) => {
        console.log('📡 CHAT: Status subscription messages:', status);
      });

    return () => {
      console.log('🔌 CHAT: Fermeture subscription messages');
      supabase.removeChannel(messagesChannel);
    };
  }, [missionId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadReceiverId = async () => {
    try {
      console.log('🔍 CHAT: Chargement du receiver ID pour mission:', missionId);
      
      // Récupérer les informations de la mission
      const { data: missionData, error: missionError } = await supabase
        .from('service_requests')
        .select('client_id')
        .eq('id', missionId)
        .single();

      if (missionError) {
        console.error('❌ CHAT: Erreur mission:', missionError);
        return;
      }

      // Récupérer les informations de la proposition acceptée/confirmée
      const { data: proposalData, error: proposalError } = await supabase
        .from('mission_proposals')
        .select('provider_id')
        .eq('request_id', missionId)
        .in('status', ['accepted', 'confirmed'])
        .single();

      if (proposalError) {
        console.error('❌ CHAT: Erreur proposition:', proposalError);
        return;
      }

      // Déterminer le type d'utilisateur et le receiver_id
      const isClient = user?.id === missionData.client_id;
      const isProvider = user?.id === proposalData.provider_id;
      
      if (isClient) {
        setUserType('client');
        setReceiverId(proposalData.provider_id);
        console.log('👤 CHAT: Utilisateur = CLIENT, Receiver = PROVIDER:', proposalData.provider_id);
      } else if (isProvider) {
        setUserType('provider');
        setReceiverId(missionData.client_id);
        console.log('👤 CHAT: Utilisateur = PROVIDER, Receiver = CLIENT:', missionData.client_id);
      } else {
        console.error('❌ CHAT: Utilisateur non autorisé pour cette mission');
      }
    } catch (error) {
      console.error('❌ CHAT: Erreur lors du chargement du receiver:', error);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('💬 CHAT: Chargement des messages pour mission:', missionId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', missionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ CHAT: Erreur chargement messages:', error);
        return;
      }
      
      console.log('📨 CHAT: Messages chargés:', data?.length || 0, data);
      
      // Filtrer les messages de signalisation WebRTC
      const filteredMessages = (data || []).filter(
        msg => !msg.content?.startsWith('WEBRTC_SIGNAL:')
      );
      setMessages(filteredMessages);
    } catch (error) {
      console.error('❌ CHAT: Erreur lors du chargement des messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !receiverId || isLoading) {
      console.log('❌ CHAT: Impossible d\'envoyer le message - manque des données:', {
        message: newMessage.trim(),
        user: !!user,
        receiverId: !!receiverId,
        isLoading
      });
      return;
    }

    setIsLoading(true);
    const messageContent = newMessage.trim();

    // Déclarer optimisticMessage au niveau supérieur pour qu'elle soit accessible partout
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      request_id: missionId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: messageContent,
      created_at: new Date().toISOString(),
      media_url: null
    };

    try {
      console.log('📤 CHAT: Envoi du message:', {
        request_id: missionId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: messageContent
      });

      // Ajouter le message immédiatement à l'interface pour une sensation temps réel
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      const { error } = await supabase
        .from('messages')
        .insert({
          request_id: missionId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: messageContent
        });

      if (error) {
        console.error('❌ CHAT: Erreur envoi message:', error);
        // Supprimer le message optimiste en cas d'erreur
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        setNewMessage(messageContent); // Remettre le texte dans l'input
        return;
      }
      
      console.log('✅ CHAT: Message envoyé avec succès');
    } catch (error) {
      console.error('❌ CHAT: Erreur lors de l\'envoi du message:', error);
      // Supprimer le message optimiste en cas d'erreur
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageContent); // Remettre le texte dans l'input
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmationRequest = async () => {
    if (!user || !receiverId) return;

    // Vérifier si une demande existe déjà
    const existingConfirmation = confirmations.find(conf => conf.status === 'pending');
    if (existingConfirmation) {
      console.log('⚠️ Une demande de confirmation existe déjà');
      return;
    }

    await createConfirmationRequest(user.id, receiverId, 'Je confirme que l\'intervention est terminée. Pouvez-vous valider ?');
  };

  const handleAcceptConfirmation = (confirmationId: string) => {
    respondToConfirmation(confirmationId, 'accepted', 'Intervention confirmée et validée');
  };

  const handleRejectConfirmation = (confirmationId: string) => {
    respondToConfirmation(confirmationId, 'rejected', 'Intervention non validée');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartVideoCall = () => startCall(true);
  const handleStartAudioCall = () => startCall(false);
  const handleAcceptVideoCall = () => acceptCall(true);
  const handleAcceptAudioCall = () => acceptCall(false);

  const pendingConfirmation = confirmations.find(conf => conf.status === 'pending');
  const hasConfirmationRequest = confirmations.length > 0;

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
              {userType && <span className="ml-2 text-blue-600">({userType === 'client' ? 'Client' : 'Prestataire'})</span>}
            </p>
          </div>
        </div>
        
        {/* Boutons d'appel */}
        <div className="flex items-center space-x-2">
          {!isCallActive && !isOutgoingCall && !isIncomingCall && (
            <>
              <Button onClick={handleStartAudioCall} className="bg-green-600 hover:bg-green-700 p-2">
                <Phone className="w-5 h-5" />
              </Button>
              <Button onClick={handleStartVideoCall} className="bg-blue-600 hover:bg-blue-700 p-2">
                <Video className="w-5 h-5" />
              </Button>
            </>
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
              <Button onClick={handleAcceptAudioCall} className="bg-green-600 hover:bg-green-700 px-6 py-3">
                <Phone className="w-5 h-5 mr-2" />
                Audio
              </Button>
              <Button onClick={handleAcceptVideoCall} className="bg-blue-500 hover:bg-blue-600 px-6 py-3">
                <Video className="w-5 h-5 mr-2" />
                Vidéo
              </Button>
              <Button onClick={rejectCall} variant="destructive" className="px-6 py-3">
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
              {isVideoOn ? <Video className="w-8 h-8" /> : <Phone className="w-8 h-8" />}
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

      {/* Interface d'appel actif avec vidéo */}
      {isCallActive && (
        <div className="flex-1 flex flex-col">
          <div className="bg-green-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Communication en cours</p>
                <p className="text-green-100 text-sm">{formatCallDuration(callDuration)}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={toggleMute}
                  variant={isMuted ? "destructive" : "secondary"}
                  size="sm"
                  className="w-10 h-10 p-0"
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={toggleVideo}
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
          
          {/* Zone vidéo */}
          {(isVideoOn || remoteStream) && (
            <VideoCall
              localStream={localStream}
              remoteStream={remoteStream}
              isVideoOn={isVideoOn}
              className="flex-1 p-4"
            />
          )}
        </div>
      )}

      {/* Messages et confirmations */}
      <div className={`${isCallActive ? 'h-32' : 'flex-1'} overflow-y-auto p-4 space-y-3`}>
        {/* Affichage des confirmations d'intervention */}
        {hasConfirmationRequest && (
          <div className="space-y-3 mb-4">
            {confirmations.map((confirmation) => (
              <InterventionConfirmationComponent
                key={confirmation.id}
                confirmation={confirmation}
                userType={userType}
                userId={user?.id || ''}
                onAccept={handleAcceptConfirmation}
                onReject={handleRejectConfirmation}
              />
            ))}
          </div>
        )}

        {messages.length === 0 && !hasConfirmationRequest && (
          <div className="text-center py-8">
            <p className="text-gray-500">💬 Aucun message pour l'instant</p>
            <p className="text-gray-400 text-sm">Commencez la conversation !</p>
          </div>
        )}
        
        {messages.map((message) => {
          const isMyMessage = message.sender_id === user?.id;
          const isOptimistic = message.id.startsWith('temp-');
          
          return (
            <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isMyMessage 
                  ? `bg-blue-600 text-white ${isOptimistic ? 'opacity-70' : ''}` 
                  : 'bg-white border'
              }`}>
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  isMyMessage ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.created_at || '')}
                  {isOptimistic && <span className="ml-1">⏳</span>}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Actions en bas */}
      <div className="bg-white border-t p-4 space-y-3">
        {/* Bouton de confirmation seulement pour les prestataires */}
        {userType === 'provider' && !pendingConfirmation && (
          <Button 
            onClick={handleConfirmationRequest}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            ✅ Demander la confirmation de l'intervention
          </Button>
        )}

        {/* Input de message */}
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || !newMessage.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
