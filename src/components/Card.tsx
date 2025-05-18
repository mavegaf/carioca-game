import { Card as CardType } from '@/lib/deck';

export default function Card({ card, highlight = false }: { card: CardType, highlight?: boolean }) {
  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div
      className={`
        w-12 h-18 border rounded-lg flex items-center justify-center text-xl 
        ${isRed ? 'text-red-500' : 'text-black'} bg-white shadow
        ${highlight ? 'ring-4 ring-yellow-200' : ''}
        `}
    >
      {card.rank} {card.suit}
    </div>
  );
}
