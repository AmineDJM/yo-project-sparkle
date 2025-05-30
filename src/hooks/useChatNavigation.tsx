
import { useState } from 'react';

interface ActiveChat {
  missionId: string;
  missionTitle: string;
}

export function useChatNavigation() {
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);

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
