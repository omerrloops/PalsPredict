'use client';

import { Market } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, Users } from 'lucide-react';

interface MarketCardProps {
    market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
    const topOutcome = market.outcomes?.length > 0
        ? market.outcomes.reduce((prev, current) => (prev.probability > current.probability) ? prev : current)
        : null;

    return (
        <Link href={`/market/${market.id}`} className="block group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
            {/* Image Section */}
            <div className="relative h-32 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent z-10" />
                {/* Placeholder for actual image - using a colored div for now if no image */}
                <div className="h-full w-full bg-secondary/30 flex items-center justify-center text-4xl">
                    {market.image ? (
                        <img src={market.image} alt={market.question} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                        <span>🔮</span>
                    )}
                </div>
                <div className="absolute top-2 right-2 z-20 flex gap-2">
                    {market.isMock && (
                        <span className="bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-black border border-yellow-400 shadow-sm">
                            MOCK
                        </span>
                    )}
                    <span className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-muted-foreground border border-white/5">
                        {market.category}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-4">
                <h3 className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {market.question}
                </h3>

                {/* Top Outcome */}
                {topOutcome ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: topOutcome.color }} />
                            <span className="text-sm font-medium">{topOutcome.name}</span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                            {topOutcome.probability}%
                        </span>
                    </div>
                ) : (
                    <div className="p-3 rounded-lg bg-secondary/30 border border-white/5 text-center text-sm text-muted-foreground">
                        No outcomes yet
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1">
                        <TrendingUp size={14} />
                        <span>Vol: ${market.volume.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>Ends {new Date(market.endDate).toLocaleDateString('en-GB')}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
