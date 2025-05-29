
import { useState, useEffect, useRef } from 'react';

export function useCallTimer(isCallActive: boolean) {
  const [callDuration, setCallDuration] = useState(0);
  const callStartTime = useRef<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      callStartTime.current = Date.now();
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return { callDuration, formatCallDuration };
}
