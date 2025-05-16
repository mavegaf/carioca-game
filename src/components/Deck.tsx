import Card from '@/components/Card';
import { useDeck } from '@/contexts/DeckContext';


export default function Deck({
  drawFromDeck,
  drawFromDiscard,
}: {
  drawFromDeck: () => void;
  drawFromDiscard: () => void;
}) {
  const { deck, discardPile } = useDeck();


  return (
    <div className="flex gap-2 mb-2 justify-center">
      <div
        className="w-16 h-24 bg-gray-300 rounded-lg flex items-center justify-center cursor-pointer"
        onClick={drawFromDeck}
      >
        Deck ({deck.length})
      </div>

      <div
        className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
        onClick={drawFromDiscard}
      >
        {discardPile.length > 0 ? <Card card={discardPile[discardPile.length - 1]} /> : 'Empty'}
      </div>
    </div>
  );
}
