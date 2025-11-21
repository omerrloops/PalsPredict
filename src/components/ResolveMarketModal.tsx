'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Trophy, AlertCircle } from 'lucide-react';

interface ResolveMarketModalProps {
    marketId: string;
    outcomes: Array<{ id: string; name: string; color: string }>;
    onClose: () => void;
    onResolved: () => void;
}

export default function ResolveMarketModal({ marketId, outcomes, onClose, onResolved }: ResolveMarketModalProps) {
    const [selectedOutcome, setSelectedOutcome] = useState<string>('');
    const [isResolving, setIsResolving] = useState(false);
    const [error, setError] = useState<string>('');

    const handleResolve = async () => {
        if (!selectedOutcome) {
            setError('Please select a winning outcome');
            return;
        }

        setIsResolving(true);
        setError('');

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Not authenticated');
            }

            // Call the resolve_market function
            const { data, error: rpcError } = await supabase.rpc('resolve_market', {
                p_market_id: marketId,
                p_winning_outcome_id: selectedOutcome,
                p_admin_user_id: user.id
            });

            if (rpcError) throw rpcError;

            // Show success message
            alert(`Market resolved! ${data.winners_count} winners received ${data.total_payout} credits total.`);

            onResolved();
            onClose();
        } catch (err: any) {
            console.error('Error resolving market:', err);
            setError(err.message || 'Failed to resolve market');
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="text-primary" size={24} />
                        <h2 className="text-2xl font-bold">Resolve Market</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Warning */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
                    <div className="text-sm text-yellow-200">
                        <p className="font-semibold mb-1">This action cannot be undone</p>
                        <p className="text-yellow-200/80">Winners will be paid out proportionally based on their bets.</p>
                    </div>
                </div>

                {/* Outcome Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">
                        Select Winning Outcome
                    </label>
                    <div className="space-y-2">
                        {outcomes.map((outcome) => (
                            <button
                                key={outcome.id}
                                onClick={() => setSelectedOutcome(outcome.id)}
                                className={`w-full p-4 rounded-lg border-2 transition-all ${selectedOutcome === outcome.id
                                        ? 'border-primary bg-primary/10'
                                        : 'border-white/5 bg-secondary/30 hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: outcome.color }}
                                    />
                                    <span className="font-medium">{outcome.name}</span>
                                    {selectedOutcome === outcome.id && (
                                        <Trophy className="ml-auto text-primary" size={18} />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                        disabled={isResolving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleResolve}
                        disabled={isResolving || !selectedOutcome}
                        className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResolving ? 'Resolving...' : 'Resolve Market'}
                    </button>
                </div>
            </div>
        </div>
    );
}
