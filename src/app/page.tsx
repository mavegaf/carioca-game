'use client';

import { useEffect, useState } from 'react';
import { generateDeck, shuffleDeck, Card as CardType } from '@/lib/deck';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import Card from '@/components/Card'
import SortableCard from '@/components/SortableCard'


export default function Home() {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [player1, setPlayer1] = useState<CardType[]>([]);
  const [player2, setPlayer2] = useState<CardType[]>([]);

  useEffect(() => {
    const newDeck = shuffleDeck(generateDeck());
    const p1 = newDeck.slice(0, 12);
    const p2 = newDeck.slice(12, 24);
    const remaining = newDeck.slice(24);

    setPlayer1(p1);
    setPlayer2(p2);
    setDeck(remaining);
  }, []);

  const drawCard = (player: 'p1' | 'p2') => {
    if (deck.length == 0) return;

    const [card, ...rest] = deck;
    setDeck(rest);

    if (player == 'p1') {
      setPlayer1([...player1, card]);
    } else {
      setPlayer2([...player2, card]);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = player1.findIndex((c) => c.rank + c.suit === active.id);
      const newIndex = player1.findIndex((c) => c.rank + c.suit === over?.id);
      setPlayer1((items) => arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Bot (Player 2) */}
      <div className="mb-4 text-center">
        <h2 className="font-bold mb-2">Bot (Player 2)</h2>
        <div className="flex gap-1 flex-wrap justify-center h-24">
          {player2.map((c, i) => <Card key={i} card={c} />)}
        </div>
      </div>

      <div className="mb-4">
        <button onClick={ () => drawCard('p1')} className="px-4 py-2 m-2 bg-blue-500 text-white rounded">Player 1 Draw</button>
        <button onClick={ () => drawCard('p2')} className="px-4 py-2 m-2 bg-red-500 text-white rounded">Player 2 Draw</button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="w-16 h-24 bg-gray-300 rounded-lg flex items-center justify-center">Deck</div>
        <div className="w-16 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
          {deck.length}
        </div>
      </div>

      {/* Player (Player 1) */}
      <div className="text-center">
        <h2 className="font-bold mb-2">Player 1 (You)</h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={player1.map((c) => c.rank + c.suit)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex gap-1 flex-wrap justify-center">
            {player1.map((c) => (
              <SortableCard key={c.rank + c.suit} id={c.rank + c.suit} card={c} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      </div>

    </main>
  );
}
