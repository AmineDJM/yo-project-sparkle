
import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';

export function useAddress() {
  const { profile, updatePreferences } = useProfile();
  const [currentAddress, setCurrentAddress] = useState('');

  useEffect(() => {
    if ((profile as any)?.preferred_address) {
      setCurrentAddress((profile as any).preferred_address);
    }
  }, [(profile as any)?.preferred_address]);

  const updateAddress = async (address: string) => {
    setCurrentAddress(address);
    
    // Sauvegarder l'adresse en base de données
    if (address.trim()) {
      await updatePreferences({ preferred_address: address });
    }
  };

  return {
    currentAddress,
    updateAddress,
    preferredAddress: (profile as any)?.preferred_address || ''
  };
}
