
import { useLocation, useNavigate } from 'react-router-dom';
import ProviderSearchScreen from '@/components/ProviderSearchScreen';

export default function ProviderSearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { requestId, requestTitle } = location.state || {};

  if (!requestId) {
    navigate('/');
    return null;
  }

  return (
    <ProviderSearchScreen
      requestId={requestId}
      requestTitle={requestTitle}
      onBack={() => navigate('/')}
    />
  );
}
