
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Mail, Phone } from 'lucide-react';

export default function ProviderPendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            En attente de validation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Votre inscription en tant que prestataire est en cours de validation par notre équipe.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 font-medium">
              ⏱️ Délai de validation : Maximum 24 heures
            </p>
          </div>
          
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>Vous recevrez un email de confirmation</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Notre équipe peut vous contacter</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-6">
            Des questions ? Contactez-nous à support@homi.fr
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
