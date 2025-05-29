import { useState, useEffect } from 'react';
import { useProviderApplications } from '@/hooks/useProviderApplications';
import { useChat } from '@/hooks/useChat';
import MissionChat from './MissionChat';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle, Clock, User, Euro } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

interface ApplicationWithRequest {
  id: string;
  request_id: string;
  created_at: string;
  status: string;
  service_request: ServiceRequest;
}

export default function ProviderMessagesList() {
  const { applications, loading } = useProviderApplications();
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

  const getMaskedAddress = (address: string) => {
    const parts = address.split(',');
    if (parts.length > 1) {
      return `${parts[parts.length - 2]?.trim() || 'Zone non spécifiée'}`;
    }
    return 'Zone non spécifiée';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">✅ Candidature envoyée</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800">🤝 Intervention confirmée</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">⏳ En attente</Badge>;
    }
  };

  const handleOpenChat = (application: ApplicationWithRequest) => {
    openChat(application.request_id, application.service_request.title || 'Mission');
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Mes candidatures
        </h2>
        {applications.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {applications.length} candidature{applications.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Message si aucune candidature */}
      {applications.length === 0 && (
        <Card className="text-center border-dashed border-2">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune candidature
            </h3>
            <p className="text-sm text-gray-600">
              Vos candidatures aux missions apparaîtront ici
            </p>
            <p className="text-xs text-gray-500 mt-2">
              💡 Consultez les propositions pour postuler à des missions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liste des candidatures */}
      <div className="space-y-3">
        {applications.map((application) => (
          <Card key={application.id} className="border transition-all hover:shadow-md">
            <CardContent className="p-4">
              {/* Status et timing */}
              <div className="flex justify-between items-start mb-3">
                {getStatusBadge(application.status)}
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTimeAgo(application.created_at)}
                </span>
              </div>

              {/* Titre avec emoji */}
              <div className="flex items-start mb-3">
                <span className="text-2xl mr-3">
                  {getCategoryEmoji(application.service_request.category || 'autre')}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {application.service_request.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {application.service_request.description}
                  </p>
                </div>
              </div>

              {/* Localisation */}
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                <span className="font-medium">{getMaskedAddress(application.service_request.address || '')}</span>
              </div>

              {/* Budget et info client */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">Client vérifié</span>
                </div>
                {application.service_request.estimated_budget && (
                  <div className="flex items-center text-sm font-medium text-green-600">
                    <Euro className="w-4 h-4 mr-1" />
                    {application.service_request.estimated_budget}€ estimé
                  </div>
                )}
              </div>

              {/* Bouton messagerie */}
              <Button 
                onClick={() => handleOpenChat(application)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Ouvrir la conversation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
