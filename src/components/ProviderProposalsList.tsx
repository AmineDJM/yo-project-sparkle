
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock } from 'lucide-react';
import { useRealtimeProposals } from '@/hooks/useRealtimeProposals';
import ProposalCard from './ProposalCard';
import ProviderStatusToggle from './ProviderStatusToggle';

export default function ProviderProposalsList() {
  const { proposals, loading, applyToMission, rejectProposal } = useRealtimeProposals();

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Toggle de statut en ligne/hors ligne */}
      <ProviderStatusToggle />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Propositions de missions
        </h2>
        {proposals.length > 0 && (
          <Badge className="bg-red-600 text-white animate-pulse">
            <Zap className="w-3 h-3 mr-1" />
            {proposals.length}
          </Badge>
        )}
      </div>

      {/* Message si aucune proposition */}
      {proposals.length === 0 && (
        <Card className="text-center border-dashed border-2">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              En attente de propositions...
            </h3>
            <p className="text-sm text-gray-600">
              Les nouvelles propositions de missions apparaîtront ici
            </p>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des propositions */}
      <div className="space-y-3">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            onApply={applyToMission}
            onReject={rejectProposal}
          />
        ))}
      </div>
    </div>
  );
}
