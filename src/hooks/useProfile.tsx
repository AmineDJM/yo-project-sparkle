
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (supabaseError) {
        console.error('Erreur lors du chargement du profil:', supabaseError);
        setProfile(null);
        setError(supabaseError.message);
      } else {
        console.log('Profil chargé:', data);
        setProfile(data);
        setError(null);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setProfile(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Écouter les changements en temps réel du profil utilisateur
    if (user) {
      console.log('Configuration de l\'écoute temps réel pour le profil:', user.id);
      
      const profileChannel = supabase
        .channel(`profile-changes-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('Changement de profil détecté:', payload.new);
            setProfile(payload.new as Profile);
          }
        )
        .subscribe();

      return () => {
        console.log('Nettoyage de l\'écoute temps réel du profil');
        supabase.removeChannel(profileChannel);
      };
    }
  }, [user]);

  // Ajouter la fonction refetch pour pouvoir actualiser les données du profil
  const refetch = () => {
    setLoading(true);
    fetchProfile();
  };

  return { profile, loading, error, refetch };
}
