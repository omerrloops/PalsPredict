// Transaction history utilities for charts and analytics

import { createClient } from '@/lib/supabase/client';

export interface Transaction {
    id: string;
    market_id: string;
    outcome_id: string;
    user_id: string;
    amount: number;
    transaction_type: 'bet' | 'win' | 'refund';
    created_at: string;
}

export interface DailyVolume {
    market_id: string;
    outcome_id: string;
    day: string;
    total_volume: number;
    transaction_count: number;
}

/**
 * Get all transactions for a specific market
 */
export async function getMarketTransactions(marketId: string): Promise<Transaction[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('bet_transactions')
        .select('*')
        .eq('market_id', marketId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return data || [];
}

/**
 * Get daily volume data for a market (useful for charts)
 */
export async function getDailyVolumes(marketId: string): Promise<DailyVolume[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('daily_outcome_volumes')
        .select('*')
        .eq('market_id', marketId)
        .order('day', { ascending: true });

    if (error) {
        console.error('Error fetching daily volumes:', error);
        return [];
    }

    return data || [];
}

/**
 * Get transactions for a specific outcome
 */
export async function getOutcomeTransactions(
    marketId: string,
    outcomeId: string
): Promise<Transaction[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('bet_transactions')
        .select('*')
        .eq('market_id', marketId)
        .eq('outcome_id', outcomeId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching outcome transactions:', error);
        return [];
    }

    return data || [];
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(userId: string): Promise<Transaction[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('bet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user transactions:', error);
        return [];
    }

    return data || [];
}

/**
 * Calculate cumulative volume over time for chart data
 */
export function calculateCumulativeVolume(transactions: Transaction[]): Array<{
    timestamp: string;
    volume: number;
}> {
    let cumulative = 0;
    return transactions.map(tx => {
        cumulative += tx.amount;
        return {
            timestamp: tx.created_at,
            volume: cumulative
        };
    });
}
/**
 * Get total bet volume per user for a given market.
 * Returns array sorted descending by total.
 */
export async function getUserVolumesForMarket(marketId: string): Promise<Array<{ userId: string; username?: string; total: number }>> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('bet_transactions')
        .select('user_id, amount, profiles(username)')
        .eq('market_id', marketId)
        .eq('transaction_type', 'bet');

    if (error) {
        console.error('Error fetching user volumes:', error);
        return [];
    }

    const volumes: Record<string, { username?: string; total: number }> = {};
    data?.forEach((row: any) => {
        const uid = row.user_id as string;
        const amt = Number(row.amount);
        if (!volumes[uid]) {
            volumes[uid] = { username: row.profiles?.username, total: 0 };
        }
        volumes[uid].total += amt;
    });

    return Object.entries(volumes)
        .map(([userId, { username, total }]) => ({ userId, username, total }))
        .sort((a, b) => b.total - a.total);
}
