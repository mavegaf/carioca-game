import Card from '@/components/Card';
import { useDeck } from '@/contexts/DeckContext';


export default function Deck({
  currentPlayer,
  drawFromDeck,
  drawFromDiscard,
  lastDiscardedFrom,
  children,
}: {
  currentPlayer: string;
  drawFromDeck: () => void;
  drawFromDiscard: () => void;
  lastDiscardedFrom: string | null,
  children?: React.ReactNode;
}) {
  const { deck, discardPile } = useDeck();

  const card = deck.length > 0 ? deck[0] : null;

  return (
    <div className="flex gap-2 items-start gap-6 justify-center ">
      <div className="bg-gray-300 rounded-xl p-2 flex gap-4 items-start">
        <div
          className={`
      flex flex-col items-center justify-center cursor-pointer
      ${lastDiscardedFrom === 'deck' ? 'ring-4 ring-yellow-200' : ''}
    `}
          onClick={currentPlayer === 'p1' ? drawFromDeck : undefined}
        >
          <div className="w-16 h-24 rounded-lg flex items-center justify-center">
            {card && <Card card={deck[0]} back />}
          </div>
          <p className="text-xs mt-1 text-center text-black">({deck.length})</p>
        </div>

        <div
          className={`
      flex flex-col items-center justify-center cursor-pointer
      ${lastDiscardedFrom === 'discard' ? 'ring-4 ring-yellow-200' : ''}
    `}
          onClick={currentPlayer === 'p1' ? drawFromDiscard : undefined}
        >
          <div className="w-16 h-24 rounded-lg flex items-center justify-center">
            {discardPile.length > 0 && <Card card={discardPile[discardPile.length - 1]} />}
          </div>
          <p className="text-xs mt-1 text-center text-black">({discardPile.length})</p>
        </div>
      </div>
      {children}
    </div>

  );
}
