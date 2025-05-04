export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export type Card = {
    suit: Suit;
    rank: Rank;
    deckNumber: number;
}

const suits: Suit[] = ['♠', '♥', '♦', '♣'];
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function generateDeck(): Card[] {
    const singleDesk = suits.flatMap((suit) => ranks.map((rank) => ({suit, rank})));

    const deck1 = singleDesk.map((card) => ({ ...card, deckNumber: 1}));
    const deck2 = singleDesk.map((card) => ({ ...card, deckNumber: 2}));
    return [...deck1, ...deck2];
}

export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length-1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // swap
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;

}