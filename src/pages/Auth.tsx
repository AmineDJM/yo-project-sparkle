
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'client' | 'provider'>('client');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Connexion réussie !",
          description: "Vous êtes maintenant connecté.",
        });
      } else {
        // Validation pour l'inscription
        if (!phone.trim()) {
          throw new Error('Le numéro de téléphone est requis');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: userType,
              phone: phone,
            },
          },
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Compte créé !",
          description: userType === 'provider' 
            ? "Vérifiez votre email et attendez la validation de votre inscription." 
            : "Vérifiez votre email pour confirmer votre compte.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <Home className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-900">
              {isLogin ? 'Connexion' : 'Inscription'} - Homi
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Connectez-vous à votre compte' 
                : 'Créez votre compte pour commencer'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet *</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Numéro de téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0123456789"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userType">Type de compte</Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="client"
                          checked={userType === 'client'}
                          onChange={(e) => setUserType(e.target.value as 'client' | 'provider')}
                          disabled={loading}
                        />
                        <span>Client</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          value="provider"
                          checked={userType === 'provider'}
                          onChange={(e) => setUserType(e.target.value as 'client' | 'provider')}
                          disabled={loading}
                        />
                        <span>Prestataire</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={loading}
              >
                {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
              >
                {isLogin 
                  ? "Pas de compte ? S'inscrire" 
                  : "Déjà un compte ? Se connecter"
                }
              </Button>
            </div>

            {/* Lien discret vers l'admin */}
            <div className="mt-6 text-center">
              <div className="text-xs text-gray-400 mb-2">•</div>
              <Link 
                to="/admin" 
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Accès Administrateur
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
