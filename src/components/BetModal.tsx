'use client';

import { createClient } from '@/lib/supabase/client';
import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BetModalProps {
    isOpen: boolean;
    onClose: () => void;
    marketId: string;
    outcomeName: string;
    outcomeId: string;
    outcomeColor: string;
    onBetPlaced: () => void;
}

export default function BetModal({
    isOpen,
    onClose,
    marketId,
    outcomeName,
    outcomeId,
    outcomeColor,
    onBetPlaced
}: BetModalProps) {
    const [amount, setAmount] = useState('');
    const [balance, setBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            fetchBalance();
        }
    }, [isOpen]);

    const fetchBalance = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', user.id)
            .single();

        if (data) {
            setBalance(Number(data.balance));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('You must be logged in to place a bet');
                return;
            }

            const betAmount = Number(amount);
            if (betAmount <= 0) {
                alert('Bet amount must be greater than 0');
                setIsLoading(false);
                return;
            }

            if (betAmount > balance) {
                alert('Insufficient balance');
                setIsLoading(false);
                return;
            }

            // Place bet
            const { error: betError } = await supabase
                .from('bets')
                .insert({
                    user_id: user.id,
                    market_id: marketId,
                    outcome_id: outcomeId,
                    amount: betAmount
                });

            if (betError) throw betError;

            // Record transaction for historical tracking
            const { error: transactionError } = await supabase
                .from('bet_transactions')
                .insert({
                    user_id: user.id,
                    market_id: marketId,
                    outcome_id: outcomeId,
                    amount: betAmount,
                    transaction_type: 'bet'
                });

            if (transactionError) {
                console.error('Error recording transaction:', transactionError);
                // Don't throw - transaction recording is not critical for bet placement
            }

            // Update balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ balance: balance - betAmount })
                .eq('id', user.id);

            if (balanceError) throw balanceError;

            // Update market volume
            const { data: market } = await supabase
                .from('markets')
                .select('volume')
                .eq('id', marketId)
                .single();

            if (market) {
                await supabase
                    .from('markets')
                    .update({ volume: Number(market.volume) + betAmount })
                    .eq('id', marketId);
            }

            onBetPlaced();
            onClose();
            setAmount('');
        } catch (error: any) {
            console.error('Error placing bet:', error);
            alert('Error placing bet: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-secondary/50 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-6">Place Bet</h2>

                <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: outcomeColor }} />
                        <span className="font-semibold">{outcomeName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Your current balance: <span className="font-mono font-bold text-foreground">{balance.toLocaleString()}</span> credits
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Bet Amount</label>
                        <input
                            type="number"
                            required
                            min="1"
                            max={balance}
                            placeholder="Enter amount..."
                            className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground text-lg font-mono"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <div className="flex gap-2 mt-2">
                            {[10, 50, 100, 500].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setAmount(preset.toString())}
                                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                    disabled={preset > balance}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !amount}
                        className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                Placing Bet...
                            </>
                        ) : (
                            `Place Bet`
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
