'use client';

import Link from 'next/link';
import AuthButton from './AuthButton';
import { Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
    const [balance, setBalance] = useState<number | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchBalance();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchBalance();
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchBalance = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setBalance(null);
            setIsAdmin(false);
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('balance, is_admin')
            .eq('id', user.id)
            .single();

        if (data) {
            setBalance(Number(data.balance));
            setIsAdmin(data.is_admin || false);
        }
    };

    return (
        <nav className="glass sticky top-0 z-50 w-full border-b border-white/10">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold font-heading bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                    PalsPredict
                </Link>

                <div className="flex items-center gap-6">
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/20 text-sm font-medium text-accent hover:bg-accent/30 transition-colors"
                        >
                            Admin
                        </Link>
                    )}

                    {balance !== null && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 text-sm font-medium text-secondary-foreground">
                            <Wallet size={16} className="text-accent" />
                            <span>{balance.toLocaleString()} Credits</span>
                        </div>
                    )}

                    <AuthButton />
                </div>
            </div>
        </nav>
    );
}
