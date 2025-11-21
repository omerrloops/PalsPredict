'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Minus, Search } from 'lucide-react';

interface UserProfile {
    id: string;
    full_name: string | null;
    balance: number;
    email?: string;
}

export default function AdminPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [creditAmount, setCreditAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            router.push('/');
            return;
        }

        setIsAdmin(true);
        loadUsers();
        setLoading(false);
    };

    const loadUsers = async () => {
        // Get all users from auth
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, balance')
            .order('full_name');

        if (profiles) {
            // Get emails from auth.users
            const usersWithEmails = await Promise.all(
                profiles.map(async (profile) => {
                    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
                    return {
                        ...profile,
                        email: user?.email
                    };
                })
            );
            setUsers(usersWithEmails as UserProfile[]);
        }
    };

    const handleUpdateCredits = async (userId: string, newBalance: number) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const confirmed = window.confirm(
            `Update ${user.full_name || user.email}'s balance from ${Number(user.balance).toLocaleString()} to ${newBalance.toLocaleString()} credits?`
        );

        if (!confirmed) {
            setSelectedUser(null);
            setCreditAmount('');
            return;
        }

        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', userId);

            if (error) throw error;

            await loadUsers();
            setCreditAmount('');
            setSelectedUser(null);
            alert(`Successfully updated balance to ${newBalance.toLocaleString()} credits!`);
        } catch (error: any) {
            console.error('Error updating credits:', error);
            alert('Error updating credits: ' + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium border border-accent/20">
                    Admin Access
                </span>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-semibold mb-4">Manage User Credits</h2>

                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="p-4 rounded-lg bg-secondary/30 border border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-medium">{user.full_name || 'Unknown User'}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <div className="text-right">
                                    {selectedUser === user.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="New balance"
                                                className="w-32 px-3 py-1.5 rounded-lg bg-background border border-primary focus:outline-none text-foreground font-mono text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={creditAmount}
                                                onChange={(e) => setCreditAmount(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleUpdateCredits(user.id, Number(creditAmount))}
                                                disabled={!creditAmount || isProcessing}
                                                className="px-3 py-1.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'Save'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(null);
                                                    setCreditAmount('');
                                                }}
                                                className="px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user.id);
                                                setCreditAmount(user.balance.toString());
                                            }}
                                            className="font-mono font-bold hover:text-primary transition-colors cursor-pointer"
                                        >
                                            {Number(user.balance).toLocaleString()} credits
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
