import { createClient } from '@/lib/supabase/client';
import { Market } from '@/lib/types';

export async function getMarkets(): Promise<Market[]> {
    const supabase = createClient();

    try {
        const { data: marketsData, error: marketsError } = await supabase
            .from('markets')
            .select(`
                *,
                outcomes:market_outcomes(*)
            `)
            .eq('status', 'active')
            .order('volume', { ascending: false });

        if (marketsError) {
            console.error('Error fetching markets:', marketsError);
            return MOCK_MARKETS.map(m => ({ ...m, isMock: true }));
        }

        if (!marketsData || marketsData.length === 0) {
            return MOCK_MARKETS.map(m => ({ ...m, isMock: true }));
        }

        // Map database response to Market interface
        return marketsData.map((market: any) => ({
            id: market.id,
            question: market.question,
            image: market.image_url || 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=60', // Fallback image
            volume: Number(market.volume),
            endDate: market.end_date,
            category: market.category,
            outcomes: (market.outcomes || []).map((outcome: any) => ({
                id: outcome.id,
                name: outcome.name,
                probability: Number(outcome.probability),
                color: outcome.color || '#3b82f6' // Default color
            }))
        }));
    } catch (error) {
        console.error('Unexpected error fetching markets:', error);
        return MOCK_MARKETS.map(m => ({ ...m, isMock: true }));
    }
}

const MOCK_MARKETS: Market[] = [
    {
        id: 'mock-1',
        question: "Will Bitcoin hit $100k by the end of 2024?",
        image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop&q=60",
        volume: 1250000,
        endDate: '2024-12-31',
        category: 'Crypto',
        outcomes: [
            { id: '1a', name: 'Yes', probability: 32, color: '#22c55e' },
            { id: '1b', name: 'No', probability: 68, color: '#ef4444' }
        ]
    },
    {
        id: 'mock-2',
        question: "Who will win the 2024 US Presidential Election?",
        image: "https://images.unsplash.com/photo-1540910419868-474947ce871f?w=800&auto=format&fit=crop&q=60",
        volume: 45000000,
        endDate: '2024-11-05',
        category: 'Politics',
        outcomes: [
            { id: '2a', name: 'Candidate A', probability: 45, color: '#3b82f6' },
            { id: '2b', name: 'Candidate B', probability: 42, color: '#ef4444' }
        ]
    },
    {
        id: 'mock-3',
        question: "Will GTA VI be released before 2026?",
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&auto=format&fit=crop&q=60",
        volume: 500000,
        endDate: '2025-12-31',
        category: 'Gaming',
        outcomes: [
            { id: '3a', name: 'Yes', probability: 85, color: '#22c55e' },
            { id: '3b', name: 'No', probability: 15, color: '#ef4444' }
        ]
    }
];
