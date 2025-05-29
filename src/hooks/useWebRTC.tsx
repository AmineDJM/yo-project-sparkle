
import { useState, useEffect, useRef } from 'react';
import { webrtcService } from '@/services/webrtcService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useWebRTC(missionId: string) {
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isOutgoingCall, setIsOutgoingCall] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null);
  
  const callStartTime = useRef<number>(0);
  const callPartner = useRef<string>('');

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

  // Écouter les événements WebRTC
  useEffect(() => {
    const handleSignaling = (event: CustomEvent) => {
      sendSignalingMessage(event.detail);
    };

    window.addEventListener('webrtc-signaling', handleSignaling as EventListener);
    
    return () => {
      window.removeEventListener('webrtc-signaling', handleSignaling as EventListener);
    };
  }, [missionId, user]);

  // Écouter les messages de signalisation via Supabase
  useEffect(() => {
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
          if (message.sender_id === user?.id) return; // Ignorer ses propres messages

          try {
            if (message.content?.startsWith('WEBRTC_SIGNAL:')) {
              const signalData = JSON.parse(message.content.replace('WEBRTC_SIGNAL:', ''));
              await handleSignalingMessage(signalData);
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
  }, [missionId, user?.id]);

  // Configurer les callbacks WebRTC
  useEffect(() => {
    webrtcService.onRemoteStream((stream) => {
      console.log('Remote stream received');
      setRemoteStream(stream);
      setIsCallActive(true);
      setIsOutgoingCall(false);
      setIsIncomingCall(false);
      callStartTime.current = Date.now();
    });

    webrtcService.onCallEnd(() => {
      console.log('Call ended');
      setIsCallActive(false);
      setIsOutgoingCall(false);
      setIsIncomingCall(false);
      setLocalStream(null);
      setRemoteStream(null);
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOn(false);
    });
  }, []);

  const sendSignalingMessage = async (signalData: any) => {
    try {
      const { data: missionData } = await supabase
        .from('service_requests')
        .select('client_id')
        .eq('id', missionId)
        .single();

      if (!missionData || !user) return;

      await supabase
        .from('messages')
        .insert({
          request_id: missionId,
          sender_id: user.id,
          receiver_id: missionData.client_id,
          content: `WEBRTC_SIGNAL:${JSON.stringify(signalData)}`
        });
    } catch (error) {
      console.error('Error sending signaling message:', error);
    }
  };

  const handleSignalingMessage = async (signalData: any) => {
    try {
      switch (signalData.type) {
        case 'offer':
          console.log('Received call offer');
          setIncomingOffer(signalData.offer);
          setIsIncomingCall(true);
          callPartner.current = signalData.from || '';
          break;

        case 'answer':
          console.log('Received call answer');
          await webrtcService.handleAnswer(signalData.answer);
          break;

        case 'ice-candidate':
          console.log('Received ICE candidate');
          await webrtcService.handleIceCandidate(signalData.candidate);
          break;

        case 'call-end':
          console.log('Call ended by remote peer');
          webrtcService.endCall();
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  };

  const startCall = async (withVideo: boolean = false) => {
    try {
      console.log('Starting call with video:', withVideo);
      setIsOutgoingCall(true);
      setIsVideoOn(withVideo);
      
      const stream = await webrtcService.startCall(withVideo);
      setLocalStream(stream);
    } catch (error) {
      console.error('Error starting call:', error);
      setIsOutgoingCall(false);
    }
  };

  const acceptCall = async (withVideo: boolean = false) => {
    try {
      if (!incomingOffer) return;
      
      console.log('Accepting call with video:', withVideo);
      setIsVideoOn(withVideo);
      
      const stream = await webrtcService.answerCall(incomingOffer, withVideo);
      setLocalStream(stream);
      setIncomingOffer(null);
    } catch (error) {
      console.error('Error accepting call:', error);
      setIsIncomingCall(false);
    }
  };

  const endCall = () => {
    webrtcService.endCall();
  };

  const toggleMute = () => {
    const muted = webrtcService.toggleMute();
    setIsMuted(muted);
  };

  const toggleVideo = () => {
    const videoOn = webrtcService.toggleVideo();
    setIsVideoOn(videoOn);
  };

  const rejectCall = () => {
    setIsIncomingCall(false);
    setIncomingOffer(null);
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
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
  };
}
