
import { useState } from 'react';

export function useChat() {
  const [activeChat, setActiveChat] = useState<{
    missionId: string;
    missionTitle: string;
  } | null>(null);

  const openChat = (missionId: string, missionTitle: string) => {
    setActiveChat({ missionId, missionTitle });
  };

  const closeChat = () => {
    setActiveChat(null);
  };

  return {
    activeChat,
    openChat,
    closeChat
  };
}
