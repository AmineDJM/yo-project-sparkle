import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Edit3, Save, X, Settings, LogOut, Type } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const { profile, loading, refetch, updatePreferences } = useProfile();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: ''
  });

  const isProvider = profile?.user_type === 'provider';

  // Initialiser le formulaire quand le profil est chargé
  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || ''
      });
    }
  }, [profile, isEditing]);

  const handleEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      bio: profile?.bio || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      bio: profile?.bio || ''
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "✅ Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès",
      });

      setIsEditing(false);
      refetch();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFontSizeChange = async (newSize: 'small' | 'medium' | 'large') => {
    const { error } = await updatePreferences({ font_size: newSize });
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder la préférence de police",
      });
    } else {
      toast({
        title: "✅ Préférence sauvegardée",
        description: "Taille de police mise à jour",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getFontSizeClass = () => {
    switch ((profile as any)?.font_size || 'medium') {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 ${getFontSizeClass()}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Mon profil</h2>
        <Badge variant={isProvider ? "default" : "secondary"} className="text-xs">
          {isProvider ? '🔧 Prestataire' : '👤 Client'}
        </Badge>
      </div>

      {/* Réglages de police */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Type className="w-5 h-5 mr-3" />
            Taille de police
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button
              variant={((profile as any)?.font_size || 'medium') === 'small' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFontSizeChange('small')}
            >
              Petit
            </Button>
            <Button
              variant={((profile as any)?.font_size || 'medium') === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFontSizeChange('medium')}
            >
              Moyen
            </Button>
            <Button
              variant={((profile as any)?.font_size || 'medium') === 'large' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFontSizeChange('large')}
            >
              Grand
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profil principal */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              Informations personnelles
            </CardTitle>
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit3 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSave} disabled={saving} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nom complet */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Nom complet
            </label>
            {isEditing ? (
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Votre nom complet"
              />
            ) : (
              <p className="text-gray-900">{profile?.full_name || 'Non renseigné'}</p>
            )}
          </div>

          {/* Email (non modifiable) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </label>
            <p className="text-gray-900 bg-gray-50 p-2 rounded border">
              {profile?.email}
            </p>
          </div>

          {/* Téléphone */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Téléphone
            </label>
            {isEditing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Votre numéro de téléphone"
                type="tel"
              />
            ) : (
              <p className="text-gray-900">{profile?.phone || 'Non renseigné'}</p>
            )}
          </div>

          {/* Adresse */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Adresse
            </label>
            {isEditing ? (
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Votre adresse"
              />
            ) : (
              <p className="text-gray-900">{profile?.address || 'Non renseignée'}</p>
            )}
          </div>

          {/* Bio (pour les prestataires) */}
          {isProvider && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Présentation
              </label>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Présentez vos compétences et votre expérience..."
                  rows={3}
                />
              ) : (
                <p className="text-gray-900">{profile?.bio || 'Aucune présentation'}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-3" />
              Paramètres du compte
            </Button>
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
