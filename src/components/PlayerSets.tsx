import Card from '@/components/Card';
import { Card as CardType } from '@/lib/deck';

export default function PlayerSets({ playerSets }: { playerSets: CardType[][] }) {
  return (
    <div className="mt-4 min-h-30">
      {playerSets.length > 0 &&
        playerSets.map((set, i) => (
          <div key={i} className="flex gap-1 mb-1 scale-75">
            {set.map((card, j) => (
              <Card key={j} card={card} />
            ))}
          </div>
        ))}
    </div>
  );
}
