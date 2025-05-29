import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AdminLog = Database['public']['Tables']['admin_logs']['Row'];

export function useAdminData() {
  const [providers, setProviders] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'provider')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des prestataires:', error);
        return;
      }

      setProviders(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'client')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des clients:', error);
        return;
      }

      setClients(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchAdminLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          admin:profiles!admin_logs_admin_id_fkey(full_name),
          target_user:profiles!admin_logs_target_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erreur lors du chargement des logs:', error);
        return;
      }

      setAdminLogs(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Modification de la signature de la fonction pour ne prendre que 2 paramètres
  const updateProviderStatus = async (providerId: string, status: 'approved' | 'rejected') => {
    try {
      // Utiliser l'ID admin du système pour les logs
      const adminId = 'admin-system'; // ID fictif pour l'admin

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ provider_status: status })
        .eq('id', providerId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError);
        return false;
      }

      // Log l'action (sans vérifier l'admin réel pour l'instant)
      try {
        await supabase
          .from('admin_logs')
          .insert({
            admin_id: adminId,
            action: `provider_${status}`,
            target_user_id: providerId,
            details: { status }
          });
      } catch (logError) {
        console.error('Erreur lors du log:', logError);
        // Continue même si le log échoue
      }

      // Rafraîchir les données
      await fetchProviders();
      await fetchAdminLogs();

      return true;
    } catch (error) {
      console.error('Erreur:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProviders(), fetchClients(), fetchAdminLogs()]);
      setLoading(false);
    };

    loadData();

    // Écouter les changements en temps réel
    const providerChannel = supabase
      .channel('admin-providers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'user_type=eq.provider'
        },
        () => {
          fetchProviders();
        }
      )
      .subscribe();

    const clientChannel = supabase
      .channel('admin-clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'user_type=eq.client'
        },
        () => {
          fetchClients();
        }
      )
      .subscribe();

    const logsChannel = supabase
      .channel('admin-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_logs'
        },
        () => {
          fetchAdminLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(providerChannel);
      supabase.removeChannel(clientChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  return {
    providers,
    clients,
    adminLogs,
    loading,
    updateProviderStatus,
    refreshData: () => {
      fetchProviders();
      fetchClients();
      fetchAdminLogs();
    }
  };
}
