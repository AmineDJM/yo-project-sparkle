
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Clock, MapPin, MessageCircle, X, CheckCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface ProviderApplication {
  id: string;
  provider_id: string;
  created_at: string;
  message: string;
  provider: {
    full_name: string;
    avatar_url?: string;
  };
}

interface ProviderSearchScreenProps {
  requestId: string;
  requestTitle: string;
  onBack: () => void;
}

export default function ProviderSearchScreen({ requestId, requestTitle, onBack }: ProviderSearchScreenProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(true);
  const [applications, setApplications] = useState<ProviderApplication[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Écouter les nouvelles candidatures
  useEffect(() => {
    const fetchApplications = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          created_at,
          sender:profiles!sender_id(full_name, avatar_url)
        `)
        .eq('request_id', requestId)
        .eq('receiver_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur candidatures:', error);
        return;
      }

      // Grouper par prestataire (premier message = candidature)
      const providerApps: ProviderApplication[] = [];
      const seenProviders = new Set();

      data?.forEach((msg) => {
        if (!seenProviders.has(msg.sender_id) && msg.sender_id !== user?.id) {
          seenProviders.add(msg.sender_id);
          providerApps.push({
            id: msg.id,
            provider_id: msg.sender_id!,
            created_at: msg.created_at!,
            message: msg.content,
            provider: msg.sender as any
          });
        }
      });

      setApplications(providerApps);
      
      if (providerApps.length > 0) {
        setSearching(false);
      }
    };

    fetchApplications();

    // Écouter les nouveaux messages en temps réel
    const channel = supabase
      .channel('provider-applications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`
        },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, user?.id]);

  const openChat = async (providerId: string) => {
    setActiveChat(providerId);
    
    // Charger les messages avec ce prestataire
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .or(`sender_id.eq.${providerId},receiver_id.eq.${providerId}`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        request_id: requestId,
        sender_id: user!.id,
        receiver_id: activeChat,
        content: newMessage
      });

    if (!error) {
      setNewMessage('');
      // Recharger les messages
      openChat(activeChat);
    }
  };

  const confirmProvider = async (providerId: string) => {
    // Créer une confirmation d'intervention
    const { error } = await supabase
      .from('intervention_confirmations')
      .insert({
        request_id: requestId,
        client_id: user!.id,
        provider_id: providerId,
        status: 'accepted'
      });

    if (!error) {
      // Mettre à jour le statut de la mission
      await supabase
        .from('service_requests')
        .update({ status: 'in_progress' })
        .eq('id', requestId);

      navigate('/');
    }
  };

  const cancelSearch = async () => {
    // Annuler la mission
    await supabase
      .from('service_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId);
    
    onBack();
  };

  // Vue du chat
  if (activeChat) {
    const provider = applications.find(app => app.provider_id === activeChat);
    
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header du chat */}
        <header className="bg-white shadow-sm border-b p-4 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveChat(null)}
                className="mr-3 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {provider?.provider.full_name}
                </h2>
                <p className="text-sm text-gray-600">Prestataire</p>
              </div>
            </div>
            <Button 
              onClick={() => confirmProvider(activeChat)}
              className="bg-green-600 hover:bg-green-700 text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmer
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.sender_id === user?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at!).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Zone de saisie */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="mr-3 p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-gray-900">
                {searching ? 'Recherche en cours...' : 'Prestataires trouvés'}
              </h1>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cancelSearch}
              className="text-red-600 border-red-300"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Info mission */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-900 mb-2">{requestTitle}</h2>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              Demande envoyée il y a quelques instants
            </div>
          </CardContent>
        </Card>

        {searching ? (
          // État de recherche
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              🔍 Recherche en cours...
            </h3>
            <p className="text-gray-600 mb-6">
              Nous recherchons les meilleurs prestataires près de chez vous
            </p>
            
            {/* Animation de points */}
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                ⚡ Vous recevrez une notification dès qu'un prestataire sera trouvé
              </p>
            </div>
          </div>
        ) : (
          // Liste des candidatures
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎉 {applications.length} prestataire{applications.length > 1 ? 's' : ''} disponible{applications.length > 1 ? 's' : ''} !
              </h3>
              <p className="text-gray-600">
                Discutez avec eux pour choisir le meilleur
              </p>
            </div>

            {applications.map((app) => (
              <Card key={app.id} className="border-2 hover:border-blue-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-semibold text-lg">
                          {app.provider.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {app.provider.full_name}
                        </h4>
                        <p className="text-sm text-gray-600">Prestataire vérifié</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      ✅ Disponible maintenant
                    </Badge>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700 italic">
                      "{app.message}"
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      variant="outline"
                      onClick={() => openChat(app.provider_id)}
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Discuter
                    </Button>
                    <Button 
                      onClick={() => confirmProvider(app.provider_id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Choisir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
