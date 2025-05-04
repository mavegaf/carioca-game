import { Card as CardType } from '@/lib/deck';

export default function Card( { card }: { card: CardType }) {
    const isRed = card.suit === '♥' || card.suit === '♦';

    return (
        <div className="{`w-16 h-24 border rounded-lg flex items-center justify-center text-2xl ${isRed ? 'text-red-500' : 'text-black-500'} bg-white shadow`}">
            {card.rank} {card.suit}
        </div>
    );

}