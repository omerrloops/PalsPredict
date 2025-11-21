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
    // 1. Get bet transactions for the market
    const { data: bets, error: betsError } = await supabase
        .from('bet_transactions')
        .select('user_id, amount')
        .eq('market_id', marketId)
        .eq('transaction_type', 'bet');

    if (betsError) {
        console.error('Error fetching bet transactions:', betsError);
        return [];
    }

    // 2. Aggregate total amount per user
    const volumes: Record<string, { total: number }> = {};
    const userIds: Set<string> = new Set();
    bets?.forEach((row: any) => {
        const uid = row.user_id as string;
        const amt = Number(row.amount);
        userIds.add(uid);
        if (!volumes[uid]) volumes[uid] = { total: 0 };
        volumes[uid].total += amt;
    });

    // 3. Fetch usernames/emails for those users
    let profilesMap: Record<string, { username?: string; email?: string }> = {};
    if (userIds.size > 0) {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, email')
            .in('id', Array.from(userIds));
        if (!profilesError && profiles) {
            profiles.forEach((p: any) => {
                profilesMap[p.id] = { username: p.username, email: p.email };
            });
        } else {
            console.error('Error fetching profiles:', profilesError);
        }
    }

    // 4. Build final array with username fallback to email
    const result = Object.entries(volumes).map(([userId, { total }]) => {
        const profile = profilesMap[userId] || {};
        const name = profile.username || profile.email;
        return { userId, username: name, total };
    });

    // 5. Sort descending by total volume
    return result.sort((a, b) => b.total - a.total);
}
