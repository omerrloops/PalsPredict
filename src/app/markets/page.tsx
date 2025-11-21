'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MarketCard from '@/components/MarketCard';
import { getMarkets } from '@/lib/api';
import { Market } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function MarketsPage() {
    const router = useRouter();
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    const checkAuthAndLoad = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        const data = await getMarkets();
        setMarkets(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold">All Markets</h1>

            {markets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {markets.map((market) => (
                        <MarketCard key={market.id} market={market} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No markets available yet.</p>
                </div>
            )}
        </div>
    );
}
