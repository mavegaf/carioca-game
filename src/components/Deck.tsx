import Card from '@/components/Card';
import { useDeck } from '@/contexts/DeckContext';


export default function Deck({
  currentPlayer,
  drawFromDeck,
  drawFromDiscard,
}: {
  currentPlayer: string;
  drawFromDeck: () => void;
  drawFromDiscard: () => void;
}) {
  const { deck, discardPile } = useDeck();


  return (
    <div className="flex gap-2 mb-2 justify-center">
      <div
        className="w-16 h-24 bg-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
        onClick={currentPlayer === 'p1' ? drawFromDeck : undefined}
      >
        Deck ({deck.length})
      </div>

      <div
        className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
        onClick={currentPlayer === 'p1' ? drawFromDiscard : undefined}
      >
        {discardPile.length > 0 ? <Card card={discardPile[discardPile.length - 1]} /> : 'Empty'}
      </div>
    </div>
  );
}
