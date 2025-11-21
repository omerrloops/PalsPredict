'use client';

import { createClient } from '@/lib/supabase/client';
import { UserCircle, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export default function AuthButton() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return (
            <div className="h-10 w-32 bg-secondary/50 animate-pulse rounded-lg" />
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium hidden md:block">{user.email}</span>
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg border border-border text-foreground hover:bg-secondary/50 transition-colors"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
        >
            <UserCircle size={20} />
            <span>Sign In</span>
        </button>
    );
}
