import { Card as CardType } from '@/lib/deck';

export default function Card({ card, highlight = false, back = false }: { card: CardType, highlight?: boolean, back?: boolean }) {
  const isRed = card.suit === '♥' || card.suit === '♦';

  const backColor = card.deckNumber == 1 ? 'red' : 'blue';
  if (back) {
    return (
      <div className="w-14 h-20 border rounded-lg bg-white p-0.5 hover:scale-105">
        <div
          className="w-full h-full rounded-md"
          style={{
            backgroundImage: `url(/pattern-${backColor}.svg)`,
            backgroundSize: '30%',
            backgroundRepeat: 'repeat',
            backgroundColor: backColor === 'red' ? '#b91c1c' : '#1e3a8a',
          }}
        />
      </div>
    );
  }
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
