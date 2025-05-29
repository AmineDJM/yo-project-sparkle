
import { useEffect, useRef } from 'react';

interface VideoCallProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoOn: boolean;
  className?: string;
}

export default function VideoCall({ localStream, remoteStream, isVideoOn, className = "" }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!isVideoOn && !remoteStream) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Vidéo distante (principal) */}
      {remoteStream && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-lg bg-gray-900"
        />
      )}
      
      {/* Vidéo locale (petit écran en overlay) */}
      {localStream && isVideoOn && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-4 right-4 w-24 h-32 object-cover rounded-lg border-2 border-white shadow-lg"
        />
      )}
      
      {/* Placeholder si pas de vidéo */}
      {!remoteStream && (
        <div className="w-full h-full bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <p>En attente de la vidéo...</p>
          </div>
        </div>
      )}
    </div>
  );
}
