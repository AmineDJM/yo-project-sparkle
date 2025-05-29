
import { useState } from 'react';
import { WebRTCState } from '@/types/webrtc';

export function useWebRTCState() {
  const [state, setState] = useState<WebRTCState>({
    isCallActive: false,
    isOutgoingCall: false,
    isIncomingCall: false,
    isMuted: false,
    isVideoOn: false,
    callDuration: 0,
    localStream: null,
    remoteStream: null,
    incomingOffer: null,
  });

  const updateState = (updates: Partial<WebRTCState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetCall = () => {
    updateState({
      isCallActive: false,
      isOutgoingCall: false,
      isIncomingCall: false,
      localStream: null,
      remoteStream: null,
      callDuration: 0,
      isMuted: false,
      isVideoOn: false,
      incomingOffer: null,
    });
  };

  return { state, updateState, resetCall };
}
