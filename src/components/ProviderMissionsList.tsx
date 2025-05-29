
import { useState, useEffect } from 'react';
import { useRealtimeMissions } from '@/hooks/useRealtimeMissions';
import MissionCard from './MissionCard';
import ProviderStatusToggle from './ProviderStatusToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Wifi, WifiOff, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProviderMissionsList() {
  const { missions, loading, isOnline } = useRealtimeMissions();
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Marquer les nouvelles missions comme récentes pendant 5 secondes
    if (missions.length > 0) {
      const latestMission = missions[0];
      const now = new Date();
      const missionTime = new Date(latestMission.created_at || '');
      const diffSeconds = (now.getTime() - missionTime.getTime()) / 1000;
      
      if (diffSeconds < 30) { // Mission créée dans les 30 dernières secondes
        setRecentlyAdded(prev => new Set([...prev, latestMission.id]));
        
        setTimeout(() => {
          setRecentlyAdded(prev => {
            const newSet = new Set(prev);
            newSet.delete(latestMission.id);
            return newSet;
          });
        }, 5000);
      }
    }
  }, [missions]);

  const handleAcceptMission = (missionId: string) => {
    console.log('Postuler pour la mission:', missionId);
    // TODO: Implémenter la logique de candidature
  };

  return (
    <div className="p-4 space-y-4">
      {/* Toggle de statut en ligne/hors ligne */}
      <ProviderStatusToggle />

      {/* Status en temps réel */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Missions live
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
            {isOnline ? (
              <>
                <Zap className="w-3 h-3 mr-1" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
          {isOnline && (
            <Badge variant="outline" className="text-xs">
              {missions.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Message si hors ligne */}
      {!isOnline && (
        <Card className="text-center border-dashed border-2">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Vous êtes hors ligne
            </h3>
            <p className="text-sm text-gray-600">
              Activez votre statut pour recevoir des missions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading état */}
      {isOnline && loading && (
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

      {/* Liste des missions */}
      {isOnline && !loading && (
        <>
          {missions.length === 0 ? (
            <Card className="text-center border-dashed border-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  En attente de missions...
                </h3>
                <p className="text-sm text-gray-600">
                  Les nouvelles missions apparaîtront ici en temps réel
                </p>
                <div className="flex justify-center mt-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onAccept={handleAcceptMission}
                  isNew={recentlyAdded.has(mission.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
