import { Card as CardType } from '@/lib/deck';

export default function Card({ card, highlight = false }: { card: CardType, highlight?: boolean }) {
  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div
      className={`
        w-14 h-20 bg-white border rounded-xl shadow-md 
        flex items-center justify-center text-xl font-semibold 
        ${isRed ? 'text-red-500' : 'text-black'} 
        ${highlight ? 'ring-4 ring-yellow-300' : ''}
        transition-transform duration-150 ease-in-out 
        hover:scale-105
        `}
    >
      {card.rank} {card.suit}
    </div>
  );
}
