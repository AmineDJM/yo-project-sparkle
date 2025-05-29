
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onCallEndCallback: (() => void) | null = null;
  
  constructor() {
    this.initializePeerConnection();
  }

  private initializePeerConnection() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Envoyer le candidat ICE via Supabase realtime
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      if (this.peerConnection?.connectionState === 'disconnected' || 
          this.peerConnection?.connectionState === 'failed') {
        this.endCall();
      }
    };
  }

  async startCall(isVideo: boolean = false): Promise<void> {
    try {
      console.log('Starting call with video:', isVideo);
      
      // Obtenir le stream local
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });

      // Ajouter le stream à la connexion
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Créer l'offre
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Envoyer l'offre via Supabase
      this.sendSignalingMessage({
        type: 'offer',
        offer: offer
      });

      return this.localStream;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async answerCall(offer: RTCSessionDescriptionInit, isVideo: boolean = false): Promise<void> {
    try {
      console.log('Answering call with video:', isVideo);

      // Obtenir le stream local
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });

      // Ajouter le stream à la connexion
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Définir la description distante
      await this.peerConnection!.setRemoteDescription(offer);

      // Créer la réponse
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Envoyer la réponse via Supabase
      this.sendSignalingMessage({
        type: 'answer',
        answer: answer
      });

      return this.localStream;
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection!.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.peerConnection!.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  endCall(): void {
    console.log('Ending call');

    // Arrêter tous les tracks locaux
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Fermer la connexion peer
    if (this.peerConnection) {
      this.peerConnection.close();
      this.initializePeerConnection(); // Réinitialiser pour le prochain appel
    }

    this.remoteStream = null;
    
    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }

    // Signaler la fin d'appel
    this.sendSignalingMessage({
      type: 'call-end'
    });
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // retourne true si muté
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled; // retourne true si vidéo activée
      }
    }
    return false;
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  onCallEnd(callback: () => void): void {
    this.onCallEndCallback = callback;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Cette méthode sera utilisée pour envoyer des messages de signalisation via Supabase
  private sendSignalingMessage(message: any): void {
    // Cette méthode sera implémentée dans le composant qui utilise ce service
    // pour envoyer des messages via Supabase realtime
    console.log('Signaling message to send:', message);
    
    // Émettre un événement personnalisé que le composant peut écouter
    window.dispatchEvent(new CustomEvent('webrtc-signaling', {
      detail: message
    }));
  }
}

export const webrtcService = new WebRTCService();
