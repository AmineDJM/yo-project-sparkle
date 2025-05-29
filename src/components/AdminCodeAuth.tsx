
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Shield } from 'lucide-react';

interface AdminCodeAuthProps {
  onSuccess: () => void;
}

export default function AdminCodeAuth({ onSuccess }: AdminCodeAuthProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const ADMIN_CODE = '065894491124012004!';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez saisir le code d'accès",
      });
      return;
    }

    setLoading(true);

    try {
      if (code === ADMIN_CODE) {
        // Stocker l'authentification admin dans localStorage
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_auth_time', Date.now().toString());
        
        toast({
          title: "Accès autorisé !",
          description: "Bienvenue dans l'espace administrateur.",
        });
        
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Code incorrect",
          description: "Le code d'accès saisi est incorrect.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la vérification du code.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">Accès Administrateur</CardTitle>
          <CardDescription>Saisissez le code d'accès pour accéder au portail admin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminCode">Code d'accès</Label>
              <Input
                id="adminCode"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Saisissez le code d'accès"
                required
                disabled={loading}
                className="text-center font-mono"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700" 
              disabled={loading}
            >
              {loading ? 'Vérification...' : 'Accéder à l\'admin'}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="text-sm text-gray-600"
              >
                Retour à l'accueil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
