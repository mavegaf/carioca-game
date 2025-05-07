import Card from '@/components/Card';
import { Card as CardType } from '@/lib/deck';

export default function Deck({
  deck,
  discardPile,
  drawFromDeck,
  drawFromDiscard,
}: {
  deck: CardType[];
  discardPile: CardType[];
  drawFromDeck: () => void;
  drawFromDiscard: () => void;
}) {
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
