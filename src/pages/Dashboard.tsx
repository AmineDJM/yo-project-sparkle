
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Plus, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  full_name: string;
  user_type: 'client' | 'provider';
  avatar_url?: string;
  bio?: string;
  address?: string;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  address: string;
  estimated_budget?: number;
  created_at: string;
  status: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRequests();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le profil",
      });
    }
  };

  const fetchRequests = async () => {
    try {
      let query = supabase.from('service_requests').select('*');
      
      if (profile?.user_type === 'client') {
        query = query.eq('client_id', user?.id);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les demandes",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategory = (category: string) => {
    const categories: { [key: string]: string } = {
      'plomberie': 'Plomberie',
      'electricite': 'Électricité',
      'serrurerie': 'Serrurerie',
      'demenagement': 'Déménagement',
      'menage': 'Ménage',
      'jardinage': 'Jardinage',
      'bricolage': 'Bricolage',
      'autre': 'Autre'
    };
    return categories[category] || category;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Homi</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bonjour {profile?.full_name} 👋
          </h2>
          <p className="text-gray-600">
            {profile?.user_type === 'client' 
              ? 'Trouvez rapidement un prestataire pour vos besoins' 
              : 'Découvrez les missions disponibles près de chez vous'
            }
          </p>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <Button 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" 
            size="lg"
            onClick={() => window.location.href = profile?.user_type === 'client' ? '/new-request' : '/browse-requests'}
          >
            <Plus className="w-5 h-5 mr-2" />
            {profile?.user_type === 'client' ? 'Nouvelle demande' : 'Voir les missions'}
          </Button>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {profile?.user_type === 'client' ? 'Mes demandes' : 'Missions récentes'}
          </h3>
          
          {requests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  {profile?.user_type === 'client' 
                    ? 'Aucune demande pour le moment' 
                    : 'Aucune mission disponible'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <Badge className={getUrgencyColor(request.urgency)}>
                      {request.urgency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{request.description}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {request.address}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(request.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <Badge variant="outline">{formatCategory(request.category)}</Badge>
                    {request.estimated_budget && (
                      <span className="text-sm font-medium text-green-600">
                        ~{request.estimated_budget}€
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
