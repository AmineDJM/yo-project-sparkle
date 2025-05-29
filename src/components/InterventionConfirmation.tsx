
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { InterventionConfirmation } from '@/hooks/useInterventionConfirmations';

interface InterventionConfirmationProps {
  confirmation: InterventionConfirmation;
  userType: 'client' | 'provider' | null;
  userId: string;
  onAccept: (confirmationId: string) => void;
  onReject: (confirmationId: string) => void;
}

export default function InterventionConfirmationComponent({
  confirmation,
  userType,
  userId,
  onAccept,
  onReject
}: InterventionConfirmationProps) {
  const isClient = userType === 'client' && userId === confirmation.client_id;
  const isProvider = userType === 'provider' && userId === confirmation.provider_id;
  const canRespond = isClient && confirmation.status === 'pending';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Acceptée
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Refusée
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Inconnu
          </Badge>
        );
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {isProvider ? 'Votre demande de confirmation' : 'Demande de confirmation d\'intervention'}
              </h4>
              <p className="text-xs text-gray-500">{formatTime(confirmation.created_at)}</p>
            </div>
          </div>
          {getStatusBadge(confirmation.status)}
        </div>

        {confirmation.provider_message && (
          <div className="mb-3 p-3 bg-white rounded-lg border">
            <p className="text-sm text-gray-700">
              <strong>Message du prestataire :</strong> {confirmation.provider_message}
            </p>
          </div>
        )}

        {confirmation.client_response && confirmation.status !== 'pending' && (
          <div className="mb-3 p-3 bg-white rounded-lg border">
            <p className="text-sm text-gray-700">
              <strong>Réponse du client :</strong> {confirmation.client_response}
            </p>
          </div>
        )}

        {canRespond && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 font-medium">
              Le prestataire demande votre confirmation. L'intervention est-elle terminée à votre satisfaction ?
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={() => onAccept(confirmation.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <ThumbsUp className="w-5 h-5 mr-2" />
                OUI - Valider l'intervention
              </Button>
              <Button 
                onClick={() => onReject(confirmation.id)}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <ThumbsDown className="w-5 h-5 mr-2" />
                NON - Refuser
              </Button>
            </div>
          </div>
        )}

        {confirmation.status === 'pending' && isProvider && (
          <div className="text-center py-2">
            <p className="text-sm text-blue-600">⏳ En attente de la réponse du client</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
