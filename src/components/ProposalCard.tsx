
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Euro, User, Zap, MessageCircle, XCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];
type MissionProposal = Database['public']['Tables']['mission_proposals']['Row'];

interface ProposalWithRequest extends MissionProposal {
  service_request: ServiceRequest;
  timeLeft: number;
}

interface ProposalCardProps {
  proposal: ProposalWithRequest;
  onApply: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
}

export default function ProposalCard({ proposal, onApply, onReject }: ProposalCardProps) {
  const { service_request: mission, timeLeft } = proposal;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[urgency] || colors.medium;
  };

  const getMaskedAddress = (address: string) => {
    const parts = address.split(',');
    if (parts.length > 1) {
      return `${parts[parts.length - 2]?.trim() || 'Zone non spécifiée'}`;
    }
    return 'Zone non spécifiée';
  };

  const isUrgent = timeLeft <= 10;

  return (
    <Card className={`border-2 transition-all ${
      isUrgent ? 'border-red-500 bg-red-50 animate-pulse' : 'border-blue-500 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        {/* Timer en haut */}
        <div className="flex justify-between items-center mb-3">
          <Badge className={`text-sm font-bold ${
            isUrgent ? 'bg-red-600 text-white animate-bounce' : 'bg-blue-600 text-white'
          }`}>
            <Zap className="w-4 h-4 mr-1" />
            Mission proposée
          </Badge>
          <div className={`flex items-center text-lg font-bold ${
            isUrgent ? 'text-red-600' : 'text-blue-600'
          }`}>
            <Clock className="w-5 h-5 mr-1" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Urgence */}
        <div className="flex justify-between items-start mb-3">
          <Badge className={`text-xs ${getUrgencyColor(mission.urgency || 'medium')}`}>
            {mission.urgency === 'urgent' && '🚨 '}
            {mission.urgency === 'high' ? 'Élevé' : 
             mission.urgency === 'medium' ? 'Moyen' : 
             mission.urgency === 'low' ? 'Faible' : 'Urgent'}
          </Badge>
          <span className="text-xs text-gray-500">
            Il y a {Math.floor((Date.now() - new Date(mission.created_at || '').getTime()) / 60000)}min
          </span>
        </div>

        {/* Titre avec emoji */}
        <div className="flex items-start mb-3">
          <span className="text-3xl mr-3">
            {getCategoryEmoji(mission.category || 'autre')}
          </span>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">
              {mission.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {mission.description}
            </p>
          </div>
        </div>

        {/* Localisation */}
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

        {/* Boutons d'action */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => onReject(proposal.id)}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Refuser la mission
          </Button>
          <Button 
            onClick={() => onApply(proposal.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Postuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
