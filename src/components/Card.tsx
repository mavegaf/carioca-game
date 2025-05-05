import { Card as CardType } from '@/lib/deck';

export default function Card( { card, small }: { card: CardType, small?: boolean }) {
    const isRed = card.suit === '♥' || card.suit === '♦';

    return (
        <div
            className={`${
                small ? 'w-10 h-16 text-sm' : 'w-16 h-24 text-2xl'
            } border rounded-lg flex items-center justify-center ${
                card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-black'
            } bg-white shadow`}
            >
            {card.rank}{card.suit}
        </div>
    );

}