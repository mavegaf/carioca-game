import Card from '@/components/Card';
import { Card as CardType } from '@/lib/deck';

export default function PlayerSets({ player, playerSets }: { player: string; playerSets: CardType[][] }) {
  return (
    <div className="mt-4">
      <h3 className="font-bold mb-1">{player}</h3>
      {playerSets.length === 0 ? (
        <p>No sets yet.</p>
      ) : (
        playerSets.map((set, i) => (
          <div key={i} className="flex gap-1 mb-1 scale-75">
            {set.map((card, j) => (
              <Card key={j} card={card} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
