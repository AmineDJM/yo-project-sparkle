
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Euro, User, Zap } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

interface MissionCardProps {
  mission: ServiceRequest;
  onAccept: (missionId: string) => void;
  isNew?: boolean;
}

export default function MissionCard({ mission, onAccept, isNew }: MissionCardProps) {
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'plomberie': '🔧',
      'electricite': '⚡',
      'serrurerie': '🔑',
      'demenagement': '📦',
      'menage': '🧹',
      'jardinage': '🌱',
      'bricolage': '🔨',
      'autre': '⚙️'
    };
    return emojis[category] || '⚙️';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800 animate-pulse'
    };
    return colors[urgency] || colors.medium;
  };

  // Masquer l'adresse complète - ne montrer que l'arrondissement
  const getMaskedAddress = (address: string) => {
    // Extraction simplifiée de l'arrondissement (à améliorer avec une vraie API)
    const parts = address.split(',');
    if (parts.length > 1) {
      return `${parts[parts.length - 2]?.trim() || 'Zone non spécifiée'}`;
    }
    return 'Zone non spécifiée';
  };

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-lg active:scale-95 ${
      isNew ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg animate-pulse' : ''
    }`}>
      <CardContent className="p-4">
        {/* Header avec badge nouveau et urgence */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {isNew && (
              <Badge className="bg-green-500 text-white text-xs animate-bounce">
                <Zap className="w-3 h-3 mr-1" />
                Nouveau
              </Badge>
            )}
            <Badge className={`text-xs ${getUrgencyColor(mission.urgency || 'medium')}`}>
              {mission.urgency === 'urgent' && '🚨 '}
              {mission.urgency === 'high' ? 'Élevé' : 
               mission.urgency === 'medium' ? 'Moyen' : 
               mission.urgency === 'low' ? 'Faible' : 'Urgent'}
            </Badge>
          </div>
          <span className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeAgo(mission.created_at || '')}
          </span>
        </div>

        {/* Titre avec emoji de catégorie */}
        <div className="flex items-start mb-3">
          <span className="text-2xl mr-3">
            {getCategoryEmoji(mission.category || 'autre')}
          </span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {mission.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {mission.description}
            </p>
          </div>
        </div>

        {/* Informations de localisation */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mr-2 text-blue-600" />
          <span className="font-medium">{getMaskedAddress(mission.address || '')}</span>
          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
            📍 Zone masquée
          </span>
        </div>

        {/* Budget et client */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-sm">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-gray-600">Client vérifié</span>
          </div>
          {mission.estimated_budget && (
            <div className="flex items-center text-sm font-medium text-green-600">
              <Euro className="w-4 h-4 mr-1" />
              {mission.estimated_budget}€ estimé
            </div>
          )}
        </div>

        {/* Action button */}
        <Button 
          onClick={() => onAccept(mission.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all active:scale-95"
        >
          Je postule à cette mission
        </Button>
      </CardContent>
    </Card>
  );
}
