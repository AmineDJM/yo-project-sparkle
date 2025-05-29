
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Euro, Zap } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

interface MissionCardProps {
  mission: ServiceRequest;
  onAccept?: (missionId: string) => void;
  isNew?: boolean;
}

const urgencyColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const categoryLabels = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  serrurerie: 'Serrurerie',
  demenagement: 'Déménagement',
  menage: 'Ménage',
  jardinage: 'Jardinage',
  bricolage: 'Bricolage',
  autre: 'Autre'
};

export default function MissionCard({ mission, onAccept, isNew = false }: MissionCardProps) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${Math.floor(diffHours / 24)}j`;
  };

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${
      isNew ? 'border-green-500 bg-green-50 animate-pulse' : 'border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {mission.title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {categoryLabels[mission.category] || mission.category}
              </Badge>
              <Badge className={`text-xs ${urgencyColors[mission.urgency || 'medium']}`}>
                {mission.urgency === 'urgent' && <Zap className="w-3 h-3 mr-1" />}
                {mission.urgency === 'urgent' ? 'URGENT' : mission.urgency?.toUpperCase()}
              </Badge>
              {isNew && (
                <Badge className="bg-green-600 text-white text-xs">
                  NOUVELLE
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            {formatTimeAgo(mission.created_at || '')}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-gray-700 text-sm line-clamp-2">
          {mission.description}
        </p>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="truncate">{mission.address}</span>
        </div>
        
        {mission.estimated_budget && (
          <div className="flex items-center text-sm text-green-600 font-medium">
            <Euro className="w-4 h-4 mr-1" />
            Budget estimé: {mission.estimated_budget}€
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            Voir détails
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => onAccept?.(mission.id)}
          >
            Postuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
