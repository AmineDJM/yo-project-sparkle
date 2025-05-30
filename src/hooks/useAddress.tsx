
import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';

export function useAddress() {
  const { profile, updatePreferences } = useProfile();
  const [currentAddress, setCurrentAddress] = useState('');

  useEffect(() => {
    if (profile?.preferred_address) {
      setCurrentAddress(profile.preferred_address);
    }
  }, [profile?.preferred_address]);

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
    preferredAddress: profile?.preferred_address || ''
  };
}
