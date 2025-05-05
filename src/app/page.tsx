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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

import Card from '@/components/Card';
import SortableCard from '@/components/SortableCard';

export default function Home() {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [player1, setPlayer1] = useState<CardType[]>([]);
  const [player2, setPlayer2] = useState<CardType[]>([]);
  const [discardPile, setDiscardPile] = useState<CardType[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'p1' | 'p2'>('p1');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastDrawnCardId, setLastDrawnCardId] = useState<string | null>(null);
  const [currentObjective, setCurrentObjective] = useState('2 trios');
  const [player1Sets, setPlayer1Sets] = useState<CardType[][]>([]);
  const [player2Sets, setPlayer2Sets] = useState<CardType[][]>([]);
  const [hasPlayer2GoneDown, setHasPlayer2GoneDown] = useState(false);

  useEffect(() => {
    const newDeck = shuffleDeck(generateDeck());
    const p1 = newDeck.slice(0, 12);
    const p2 = newDeck.slice(12, 24);
    const firstDiscard = newDeck[24];
    const remaining = newDeck.slice(25);

    setPlayer1(p1);
    setPlayer2(p2);
    setDiscardPile([firstDiscard]);
    setDeck(remaining);
    setCurrentPlayer('p1');
  }, []);

  useEffect(() => {
    if (currentPlayer === 'p2') {
      setTimeout(() => {
        botMove();
      }, 1000); 
    }
  }, [currentPlayer]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = player1.findIndex((c) => `${c.rank}${c.suit}-${c.deckNumber}` === active.id);
      const newIndex = player1.findIndex((c) => `${c.rank}${c.suit}-${c.deckNumber}` === over.id);
      setPlayer1((items) => arrayMove(items, oldIndex, newIndex));
    }
  }

  function drawFromDeck() {
    if (currentPlayer !== 'p1' || deck.length === 0 || hasDrawn) return;
    const [card, ...rest] = deck;
    if (currentPlayer === 'p1') {
      setPlayer1([...player1, card]);
      setLastDrawnCardId(`${card.rank}${card.suit}-${card.deckNumber}`);
      setTimeout(() => {
        setLastDrawnCardId(null);
      }, 2000);
    } else {
      setPlayer2([...player2, card]);
    }
    setDeck(rest);
    setHasDrawn(true);
  }

  function drawFromDiscard() {
    if (currentPlayer !== 'p1' || discardPile.length === 0 || hasDrawn) return;
    const card = discardPile[discardPile.length - 1];
    const rest = discardPile.slice(0, -1);
    if (currentPlayer === 'p1') {
      setPlayer1([...player1, card]);
      setLastDrawnCardId(`${card.rank}${card.suit}-${card.deckNumber}`);
      setTimeout(() => {
        setLastDrawnCardId(null);
      }, 2000);
    } else {
      setPlayer2([...player2, card]);
    }
    setDiscardPile(rest);
    setHasDrawn(true);
  }

  function discardCard(cardId: string) {
    if (!hasDrawn) return;

    const card = player1.find((c) => `${c.rank}${c.suit}-${c.deckNumber}` === cardId);
    if (!card) return;

    setPlayer1(player1.filter((c) => `${c.rank}${c.suit}-${c.deckNumber}` !== cardId));
    setDiscardPile([...discardPile, card]);
    setCurrentPlayer('p2');
    setHasDrawn(false);
  }

  async function botMove() {
    try {
      const res = await fetch('/api/bot-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botHand: player2,
          discardTop: discardPile[discardPile.length - 1],
          objective: currentObjective,
        }),
      });
  
      const data = await res.json();

      if (!data || !data.decision) {
        console.error('Bot move response missing decision:', data);
        // TODO, repeat?
        return;
      }

      const { drawFrom, discardCard, canGoDown, groups } = data.decision;
  
      console.log('Bot decision:', data.decision);
  
      // Tomar carta
      if (drawFrom === 'deck') {
        const [card, ...rest] = deck;
        setPlayer2((prev) => [...prev, card]);
        setDeck(rest);
      } else if (drawFrom === 'discard') {
        const card = discardPile[discardPile.length - 1];
        const rest = discardPile.slice(0, -1);
        setPlayer2((prev) => [...prev, card]);
        setDiscardPile(rest);
      }
  
      // Descartar carta
      const [rankSuit, deckNumber] = discardCard.split('-');
      const cardToDiscard = player2.find(
        (c) =>
          `${c.rank}${c.suit}` === rankSuit &&
          `${c.deckNumber}` === deckNumber
      );
      if (cardToDiscard) {
        setPlayer2((prev) =>
          prev.filter(
            (c) =>
              !(
                c.rank === cardToDiscard.rank &&
                c.suit === cardToDiscard.suit &&
                c.deckNumber === cardToDiscard.deckNumber
              )
          )
        );
        setDiscardPile((prev) => [...prev, cardToDiscard]);
      }
  
      // Si puede bajarse, mover los grupos
      if (canGoDown) {
        const newGroups = groups.map((group: string[]) =>
          group
            .map((id) =>
              player2.find(
                (c) => `${c.rank}${c.suit}-${c.deckNumber}` === id
              )
            )
            .filter(Boolean)
        );
  
        setPlayer2Sets((prev) => [...prev, ...newGroups]);
  
        const remaining = player2.filter(
          (c) =>
            !groups
              .flat()
              .includes(`${c.rank}${c.suit}-${c.deckNumber}`)
        );
        setPlayer2(remaining);
        setHasPlayer2GoneDown(true);
      }
  
      // Turno vuelve a Player 1
      setCurrentPlayer('p1');
      setHasDrawn(false);
    } catch (error) {
      console.error('Error in botMove:', error);
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
      <div className="mt-4">
      <h3 className="font-bold mb-1">Bot Sets (Player 2)</h3>
      {player2Sets.length === 0 ? (
        <p>No sets yet.</p>
      ) : (
        player2Sets.map((set, i) => (
          <div key={i} className="flex gap-1 mb-2">
            {set.map((card, j) => (
              <Card key={j} card={card} small />
            ))}
          </div>
        ))
      )}
    </div>

      <div className="flex gap-2 mb-2">
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
          {discardPile.length > 0 ? (
            <Card card={discardPile[discardPile.length - 1]} />
          ) : (
            'Empty'
          )}
        </div>
      </div>

      {/* Player (Player 1) */}
      <div className="mt-4">
        <h3 className="font-bold mb-1">Player 1 Sets (You)</h3>
        {player1Sets.length === 0 ? (
          <p>No sets yet.</p>
        ) : (
          player1Sets.map((set, i) => (
            <div key={i} className="flex gap-1 mb-2">
              {set.map((card, j) => (
                <Card key={j} card={card} />
              ))}
            </div>
          ))
        )}
      </div>
      <div className="text-center">
        <h2 className="font-bold mb-2">Player 1 (You)</h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={player1.map((c) => `${c.rank}${c.suit}-${c.deckNumber}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex gap-1 flex-wrap justify-center">
              {player1.map((c) => (
                <SortableCard
                  key={`${c.rank}${c.suit}-${c.deckNumber}`}
                  id={`${c.rank}${c.suit}-${c.deckNumber}`}
                  card={c}
                  onDoubleClick={() => discardCard(`${c.rank}${c.suit}-${c.deckNumber}`)}
                  highlight={lastDrawnCardId === `${c.rank}${c.suit}-${c.deckNumber}`}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </main>
  );
}
