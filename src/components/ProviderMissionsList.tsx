
import { useState, useEffect } from 'react';
import { useConfirmedMissions } from '@/hooks/useConfirmedMissions';
import { useChat } from '@/hooks/useChat';
import MissionCard from './MissionCard';
import MissionChat from './MissionChat';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, WifiOff, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProviderMissionsList() {
  const { missions, loading, isOnline } = useConfirmedMissions();
  const { activeChat, openChat, closeChat } = useChat();

  // Si un chat est actif, afficher le composant de chat
  if (activeChat) {
    return (
      <MissionChat
        missionId={activeChat.missionId}
        missionTitle={activeChat.missionTitle}
        onBack={closeChat}
      />
    );
  }

  const handleOpenMessage = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      openChat(missionId, mission.title || 'Mission');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Mes interventions confirmées
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
            {isOnline ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                En ligne
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Hors ligne
              </>
            )}
          </Badge>
          {missions.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {missions.length} mission{missions.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Loading état */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Liste des missions confirmées */}
      {!loading && (
        <>
          {missions.length === 0 ? (
            <Card className="text-center border-dashed border-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune intervention confirmée
                </h3>
                <p className="text-sm text-gray-600">
                  Vos missions confirmées apparaîtront ici
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Consultez vos propositions pour postuler à de nouvelles missions
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 px-2">
                ✅ Interventions confirmées par le client
              </p>
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onMessage={handleOpenMessage}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
