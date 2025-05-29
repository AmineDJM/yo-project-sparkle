
export interface WebRTCState {
  isCallActive: boolean;
  isOutgoingCall: boolean;
  isIncomingCall: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  callDuration: number;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  incomingOffer: RTCSessionDescriptionInit | null;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-end';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  from?: string;
}
