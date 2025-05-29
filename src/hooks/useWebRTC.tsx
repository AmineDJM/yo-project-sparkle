
import { useEffect, useRef } from 'react';
import { webrtcService } from '@/services/webrtcService';
import { SignalingService } from '@/services/signalingService';
import { useAuth } from '@/hooks/useAuth';
import { useCallTimer } from '@/hooks/useCallTimer';
import { useWebRTCState } from '@/hooks/useWebRTCState';
import { SignalingMessage } from '@/types/webrtc';

export function useWebRTC(missionId: string) {
  const { user } = useAuth();
  const { state, updateState, resetCall } = useWebRTCState();
  const { callDuration, formatCallDuration } = useCallTimer(state.isCallActive);
  const callPartner = useRef<string>('');

  // Écouter les événements WebRTC
  useEffect(() => {
    const handleSignaling = (event: CustomEvent) => {
      if (user) {
        SignalingService.sendMessage(missionId, user.id, event.detail);
      }
    };

    window.addEventListener('webrtc-signaling', handleSignaling as EventListener);
    
    return () => {
      window.removeEventListener('webrtc-signaling', handleSignaling as EventListener);
    };
  }, [missionId, user]);

  // Écouter les messages de signalisation via Supabase
  useEffect(() => {
    if (!user) return;

    const unsubscribe = SignalingService.subscribeToMessages(
      missionId,
      user.id,
      handleSignalingMessage
    );

    return unsubscribe;
  }, [missionId, user?.id]);

  // Configurer les callbacks WebRTC
  useEffect(() => {
    webrtcService.onRemoteStream((stream) => {
      console.log('Remote stream received');
      updateState({
        remoteStream: stream,
        isCallActive: true,
        isOutgoingCall: false,
        isIncomingCall: false,
      });
    });

    webrtcService.onCallEnd(() => {
      console.log('Call ended');
      resetCall();
    });
  }, []);

  const handleSignalingMessage = async (signalData: SignalingMessage) => {
    try {
      switch (signalData.type) {
        case 'offer':
          console.log('Received call offer');
          updateState({
            incomingOffer: signalData.offer || null,
            isIncomingCall: true,
          });
          callPartner.current = signalData.from || '';
          break;

        case 'answer':
          console.log('Received call answer');
          if (signalData.answer) {
            await webrtcService.handleAnswer(signalData.answer);
          }
          break;

        case 'ice-candidate':
          console.log('Received ICE candidate');
          if (signalData.candidate) {
            await webrtcService.handleIceCandidate(signalData.candidate);
          }
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
      updateState({
        isOutgoingCall: true,
        isVideoOn: withVideo,
      });
      
      const stream = await webrtcService.startCall(withVideo);
      updateState({ localStream: stream });
    } catch (error) {
      console.error('Error starting call:', error);
      updateState({ isOutgoingCall: false });
    }
  };

  const acceptCall = async (withVideo: boolean = false) => {
    try {
      if (!state.incomingOffer) return;
      
      console.log('Accepting call with video:', withVideo);
      updateState({ isVideoOn: withVideo });
      
      const stream = await webrtcService.answerCall(state.incomingOffer, withVideo);
      updateState({
        localStream: stream,
        incomingOffer: null,
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      updateState({ isIncomingCall: false });
    }
  };

  const endCall = () => {
    webrtcService.endCall();
  };

  const toggleMute = () => {
    const muted = webrtcService.toggleMute();
    updateState({ isMuted: muted });
  };

  const toggleVideo = () => {
    const videoOn = webrtcService.toggleVideo();
    updateState({ isVideoOn: videoOn });
  };

  const rejectCall = () => {
    updateState({
      isIncomingCall: false,
      incomingOffer: null,
    });
  };

  return {
    ...state,
    callDuration,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    rejectCall,
    formatCallDuration
  };
}
