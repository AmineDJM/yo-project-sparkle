
import { useState } from 'react';
import { useClientApplications } from '@/hooks/useClientApplications';
import { useChat } from '@/hooks/useChat';
import MissionChat from './MissionChat';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle, Clock, User, Euro, CheckCircle2, Star } from 'lucide-react';

export default function ClientApplicationsList() {
  const { applications, loading, confirmProvider } = useClientApplications();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">💬 Candidature reçue</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">✅ Prestataire confirmé</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">⏳ En attente</Badge>;
    }
  };

  const handleOpenChat = (application: any) => {
    openChat(application.request_id, application.service_request.title || 'Mission');
  };

  const handleConfirmProvider = (applicationId: string) => {
    confirmProvider(applicationId);
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
          Candidatures reçues
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
              Les prestataires intéressés par vos missions apparaîtront ici
            </p>
            <p className="text-xs text-gray-500 mt-2">
              💡 Vous recevrez une notification dès qu'un prestataire postulera
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

              {/* Info mission */}
              <div className="flex items-start mb-3">
                <span className="text-2xl mr-3">
                  {getCategoryEmoji(application.service_request.category || 'autre')}
                </span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {application.service_request.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Candidature de <span className="font-medium">{application.provider?.full_name}</span>
                  </p>
                </div>
              </div>

              {/* Info prestataire */}
              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">{application.provider?.full_name}</p>
                    <div className="flex items-center text-sm text-blue-700">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      <span>Prestataire vérifié</span>
                    </div>
                  </div>
                </div>
                {application.provider?.bio && (
                  <p className="text-sm text-blue-800 mt-2">{application.provider.bio}</p>
                )}
              </div>

              {/* Budget */}
              {application.service_request.estimated_budget && (
                <div className="flex items-center text-sm font-medium text-green-600 mb-4">
                  <Euro className="w-4 h-4 mr-1" />
                  Budget estimé: {application.service_request.estimated_budget}€
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-1 gap-3">
                {application.status === 'accepted' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleOpenChat(application)}
                      variant="outline"
                      className="font-medium py-3 rounded-xl"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Discuter
                    </Button>
                    <Button 
                      onClick={() => handleConfirmProvider(application.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Confirmer
                    </Button>
                  </div>
                )}
                
                {application.status === 'confirmed' && (
                  <Button 
                    onClick={() => handleOpenChat(application)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Ouvrir la conversation
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
