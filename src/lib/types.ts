export interface Market {
    id: string;
    question: string;
    image: string;
    volume: number;
    endDate: string;
    outcomes: {
        id: string;
        name: string;
        probability: number;
        color: string;
    }[];
    category: string;
    isMock?: boolean;
}

export interface User {
    id: string;
    email: string;
    balance: number;
    avatarUrl?: string;
}
