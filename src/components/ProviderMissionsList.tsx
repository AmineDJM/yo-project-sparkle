
import { useState, useEffect } from 'react';
import { useRealtimeMissions } from '@/hooks/useRealtimeMissions';
import MissionCard from './MissionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProviderMissionsList() {
  const { missions, loading } = useRealtimeMissions();
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status en temps réel */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Missions disponibles
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                En ligne
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Hors ligne
              </>
            )}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {missions.length} mission{missions.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Liste des missions */}
      {missions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune mission disponible
            </h3>
            <p className="text-gray-600">
              Les nouvelles missions apparaîtront ici en temps réel
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
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
    </div>
  );
}
