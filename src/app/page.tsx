'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarketCard from '@/components/MarketCard';
import { getMarkets } from '@/lib/api';
import { Market } from '@/lib/types';
import { TrendingUp, Zap, Users, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        checkAuth();
        loadMarkets();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
    };

    const loadMarkets = async () => {
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

    // Landing page for unauthenticated users
    if (!isAuthenticated) {
        return (
            <div className="space-y-16">
                {/* Hero Section */}
                <section className="text-center space-y-6 py-12">
                    <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                        🎯 Predict. Bet. Win.
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold font-heading bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                        Bet on Anything<br />with Your Pals
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Create prediction markets, place bets with credits, and compete with friends. No real money, just pure fun.
                    </p>
                    <div className="flex gap-4 justify-center pt-4">
                        <Link href="/login">
                            <button className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all hover:scale-105">
                                Sign In to Start
                            </button>
                        </Link>
                    </div>
                </section>

                {/* Features */}
                <section className="grid md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-xl bg-card border border-border text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                            <TrendingUp className="text-primary" size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Live Markets</h3>
                        <p className="text-muted-foreground">
                            Real-time prediction markets on anything from crypto to sports
                        </p>
                    </div>
                    <div className="p-6 rounded-xl bg-card border border-border text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
                            <Zap className="text-accent" size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Instant Betting</h3>
                        <p className="text-muted-foreground">
                            Place bets instantly with your credit balance
                        </p>
                    </div>
                    <div className="p-6 rounded-xl bg-card border border-border text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                            <Users className="text-primary" size={24} />
                        </div>
                        <h3 className="text-xl font-bold">Compete with Friends</h3>
                        <p className="text-muted-foreground">
                            Create private markets and challenge your friends
                        </p>
                    </div>
                </section>

                {/* Market Preview */}
                <section className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold">Active Markets</h2>
                        <p className="text-muted-foreground">Sign in to place bets and join the action</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {markets.slice(0, 6).map((market) => (
                            <div key={market.id} className="relative">
                                <div className="pointer-events-none opacity-75">
                                    <MarketCard market={market} />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
                                    <div className="text-center space-y-2">
                                        <Lock className="mx-auto text-primary" size={32} />
                                        <p className="font-semibold">Sign in to view</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center pt-4">
                        <Link href="/login">
                            <button className="px-6 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-semibold">
                                Sign In to Explore All Markets
                            </button>
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    // Authenticated user view
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="text-center space-y-6 py-8">
                <h1 className="text-5xl md:text-6xl font-bold font-heading bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Predict the Future
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Trade on your beliefs. Create markets. Win big.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/markets">
                        <button className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all hover:scale-105">
                            Start Trading
                        </button>
                    </Link>
                    <Link href="/create">
                        <button className="px-6 py-3 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground font-bold transition-all">
                            Create Market
                        </button>
                    </Link>
                </div>
            </section>

            {/* Featured Markets */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">🔥 Trending Markets</h2>
                    <Link href="/markets" className="text-primary hover:text-primary/80 font-medium">
                        View All →
                    </Link>
                </div>

                {markets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {markets.slice(0, 6).map((market) => (
                            <MarketCard key={market.id} market={market} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No markets available yet. Be the first to create one!</p>
                    </div>
                )}
            </section>
        </div>
    );
}
