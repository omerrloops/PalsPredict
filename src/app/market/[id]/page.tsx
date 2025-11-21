'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMarkets } from '@/lib/api';
import { Market } from '@/lib/types';
import { TrendingUp, Users, Calendar, Trophy } from 'lucide-react';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import BetModal from '@/components/BetModal';
import ResolveMarketModal from '@/components/ResolveMarketModal';
import { getUserVolumesForMarket } from '@/lib/transactions';

// This is a temporary solution since we don't have a getMarketById function yet
// In a real app, we would fetch the specific market by ID
async function getMarket(id: string): Promise<Market | undefined> {
    const markets = await getMarkets();
    return markets.find(m => m.id === id);
}

export default function MarketPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [market, setMarket] = useState<Market | null>(null);
    const [loading, setLoading] = useState(true);
    const [participantCount, setParticipantCount] = useState(0);
    const [outcomeVolumes, setOutcomeVolumes] = useState<Record<string, number>>({});
    const [userPositions, setUserPositions] = useState<Record<string, number>>({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [betModalOpen, setBetModalOpen] = useState(false);
    const [userVolumes, setUserVolumes] = useState<Array<{ userId: string; username?: string; total: number }>>([]);
    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [selectedOutcome, setSelectedOutcome] = useState<{
        id: string;
        name: string;
        color: string;
    } | null>(null);

    useEffect(() => {
        checkAuthAndLoad();
    }, [params.id]);

    const checkAuthAndLoad = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        setIsAdmin(profile?.is_admin || false);

        loadMarket();
        loadParticipants();
        loadOutcomeVolumes();
        loadUserPositions();
        // Load per-user total volumes for this market
        const volumes = await getUserVolumesForMarket(params.id);
        setUserVolumes(volumes);
    };

    const loadMarket = async () => {
        const data = await getMarket(params.id);
        if (!data) {
            notFound();
        }
        setMarket(data);
        setLoading(false);
    };

    const loadParticipants = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('bets')
            .select('user_id')
            .eq('market_id', params.id);

        if (data) {
            const uniqueUsers = new Set(data.map((bet: { user_id: string }) => bet.user_id));
            setParticipantCount(uniqueUsers.size);
        }
    };

    const loadOutcomeVolumes = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('bets')
            .select('outcome_id, amount')
            .eq('market_id', params.id);

        if (data) {
            const volumes: Record<string, number> = {};
            data.forEach((bet: { outcome_id: string; amount: number }) => {
                volumes[bet.outcome_id] = (volumes[bet.outcome_id] || 0) + bet.amount;
            });
            setOutcomeVolumes(volumes);
        }
    };

    const loadUserPositions = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        const { data } = await supabase
            .from('bets')
            .select('outcome_id, amount')
            .eq('market_id', params.id)
            .eq('user_id', user.id);

        if (data) {
            const positions: Record<string, number> = {};
            data.forEach((bet: { outcome_id: string; amount: number }) => {
                positions[bet.outcome_id] = (positions[bet.outcome_id] || 0) + bet.amount;
            });
            setUserPositions(positions);
        }
    };

    const calculateProbability = (outcomeId: string): number => {
        const totalVolume = Object.values(outcomeVolumes).reduce((sum, vol) => sum + vol, 0);
        if (totalVolume === 0) return 50; // Default equal probability

        const outcomeVol = outcomeVolumes[outcomeId] || 0;
        return Math.round((outcomeVol / totalVolume) * 100);
    };

    const handleBetClick = (outcomeId: string, outcomeName: string, outcomeColor: string) => {
        setSelectedOutcome({ id: outcomeId, name: outcomeName, color: outcomeColor });
        setBetModalOpen(true);
    };

    const handleBetPlaced = () => {
        // Refresh all data
        loadMarket();
        loadParticipants();
        loadOutcomeVolumes();
        loadUserPositions();
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (!market) {
        notFound();
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="relative h-64 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                {market.image ? (
                    <img src={market.image} alt={market.question} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-secondary/30 flex items-center justify-center text-6xl">
                        🔮
                    </div>
                )}
                <div className="absolute bottom-0 left-0 z-20 p-8 w-full">
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium border border-primary/20">
                                {market.category}
                            </span>
                            <span className="px-3 py-1 rounded-full bg-secondary/50 text-muted-foreground text-sm font-medium border border-white/5 flex items-center gap-1">
                                <Calendar size={14} />
                                Ends {new Date(market.endDate).toLocaleDateString('en-GB')}
                            </span>
                        </div>
                        {isAdmin && (
                            <button
                                onClick={() => setResolveModalOpen(true)}
                                className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition-colors flex items-center gap-2"
                            >
                                <Trophy size={16} />
                                Resolve Market
                            </button>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {market.question}
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Outcomes List */}
                    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                        <h2 className="text-xl font-semibold mb-4">Outcomes</h2>
                        {market.outcomes?.length > 0 ? (
                            <div className="space-y-3">
                                {market.outcomes.map((outcome) => {
                                    const probability = calculateProbability(outcome.id);
                                    const userPosition = userPositions[outcome.id] || 0;
                                    const outcomeVolume = outcomeVolumes[outcome.id] || 0;

                                    return (
                                        <div key={outcome.id} className="relative overflow-hidden rounded-lg bg-secondary/30 border border-white/5 p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                                            {/* Progress Bar Background */}
                                            <div
                                                className="absolute inset-0 opacity-10 transition-all duration-500 group-hover:opacity-20"
                                                style={{
                                                    backgroundColor: outcome.color,
                                                    width: `${probability}%`
                                                }}
                                            />

                                            <div className="relative space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: outcome.color }} />
                                                        <span className="font-medium">{outcome.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-lg font-bold text-primary">{probability}%</span>
                                                        <button
                                                            onClick={() => handleBetClick(outcome.id, outcome.name, outcome.color)}
                                                            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors text-sm"
                                                        >
                                                            Bet
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Show user position and volume */}
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>Volume: {outcomeVolume.toLocaleString()} credits</span>
                                                    {userPosition > 0 && (
                                                        <span className="text-primary font-medium">
                                                            Your position: {userPosition.toLocaleString()} credits
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No outcomes defined for this market yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="text-accent" size={20} />
                            Market Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-muted-foreground">Volume</span>
                                <span className="font-mono font-medium">${market.volume.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-muted-foreground">Participants</span>
                                <span className="font-mono font-medium flex items-center gap-1">
                                    <Users size={14} />
                                    {participantCount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* User Volume Table */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="text-lg font-semibold mb-4">Pals</h3>
                        {userVolumes.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No bets placed yet.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="border-b border-white/10">
                                    <tr className="text-muted-foreground">
                                        <th className="text-left py-1">User</th>
                                        <th className="text-right py-1">Volume</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userVolumes.slice(0, 10).map((u) => (
                                        <tr key={u.userId} className="border-b border-white/5">
                                            <td className="py-1">
                                                {u.username ? u.username : u.userId.slice(0, 8) + '…'}
                                            </td>
                                            <td className="text-right py-1 font-medium">
                                                {u.total.toLocaleString()} credits
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {selectedOutcome && (
                <BetModal
                    isOpen={betModalOpen}
                    onClose={() => setBetModalOpen(false)}
                    marketId={market.id}
                    outcomeName={selectedOutcome.name}
                    outcomeId={selectedOutcome.id}
                    outcomeColor={selectedOutcome.color}
                    onBetPlaced={handleBetPlaced}
                />
            )}

            {resolveModalOpen && market.outcomes && (
                <ResolveMarketModal
                    marketId={market.id}
                    outcomes={market.outcomes}
                    onClose={() => setResolveModalOpen(false)}
                    onResolved={() => {
                        loadMarket();
                        loadParticipants();
                        loadOutcomeVolumes();
                        loadUserPositions();
                    }}
                />
            )}
        </div>
    );
}
