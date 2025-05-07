'use client';

import { useEffect, useState, useCallback } from 'react';
import { generateDeck, shuffleDeck, getCardId, Card as CardType } from '@/lib/deck';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

import Card from '@/components/Card';
import Deck from '@/components/Deck';
import PlayerSet from '@/components/PlayerSets';
import SortableCard from '@/components/SortableCard';

export default function Home() {
  const [deck, setDeck] = useState<CardType[]>([]);
  const [player1, setPlayer1] = useState<CardType[]>([]);
  const [player2, setPlayer2] = useState<CardType[]>([]);
  const [discardPile, setDiscardPile] = useState<CardType[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'p1' | 'p2'>('p1');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastDrawnCardId, setLastDrawnCardId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentObjective, setCurrentObjective] = useState('2 trios');
  const [player1Sets, setPlayer1Sets] = useState<CardType[][]>([]);
  const [player2Sets, setPlayer2Sets] = useState<CardType[][]>([]);
  const [gameLog, setGameLog] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasPlayer1GoneDown, setHasPlayer1GoneDown] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasPlayer2GoneDown, setHasPlayer2GoneDown] = useState(false);

  const botMove = useCallback(async () => {
    try {
      setGameLog('Player 2: Calculating best move...');
      const res = await fetch('/api/bot-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botHand: player2,
          discardTop: discardPile[discardPile.length - 1],
          objective: currentObjective,
        }),
      });

      setGameLog('Player 2: Calculating best move...');
      let data = await res.json();
      setGameLog('Player 2: Playing');

      if (!data || !data.decision) {
        console.error('Bot move response missing decision:', data);
        // lets do anything so don't block the game
        data = {
          canGoDown: false,
          groups: [],
          drawFrom: 'deck',
          discardCard: `${player2[0].rank}${player2[0].suit}${player2[0].deckNumber}`,
        };
      }

      const { drawFrom, discardCard, canGoDown, groups } = data.decision;

      console.log('Bot decision:', data.decision);

      if (drawFrom === 'deck') {
        const [card, ...rest] = deck;
        setPlayer2(prev => [...prev, card]);
        setDeck(rest);
      } else if (drawFrom === 'discard') {
        const card = discardPile[discardPile.length - 1];
        const rest = discardPile.slice(0, -1);
        setPlayer2(prev => [...prev, card]);
        setDiscardPile(rest);
      }

      const cardToDiscard = player2.find(c => getCardId(c) === discardCard);
      if (cardToDiscard) {
        setPlayer2(prev =>
          prev.filter(
            c =>
              !(
                c.rank === cardToDiscard.rank &&
                c.suit === cardToDiscard.suit &&
                c.deckNumber === cardToDiscard.deckNumber
              )
          )
        );
        setDiscardPile(prev => [...prev, cardToDiscard]);
      }

      if (canGoDown) {
        const newGroups = groups.map((group: string[]) =>
          group.map(id => player2.find(c => getCardId(c) === id)).filter(Boolean)
        );

        setPlayer2Sets(prev => [...prev, ...newGroups]);

        const remaining = player2.filter(c => !groups.flat().includes(getCardId(c)));
        setPlayer2(remaining);
        setHasPlayer2GoneDown(true);
      }

      setCurrentPlayer('p1');
      setGameLog('Player 1. Take a card');
      setHasDrawn(false);
    } catch (error) {
      console.error('Error in botMove:', error);
    }
  }, [player2, discardPile, currentObjective, deck]);

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
    setGameLog('Player 1. Take a card');
  }, []);

  useEffect(() => {
    if (currentPlayer === 'p2') {
      setTimeout(() => {
        botMove();
      }, 1000);
    }
  }, [currentPlayer, botMove]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = player1.findIndex(c => getCardId(c) === active.id);
      const newIndex = player1.findIndex(c => getCardId(c) === over.id);
      setPlayer1(items => arrayMove(items, oldIndex, newIndex));
    }
  }

  function drawFromDeck() {
    if (currentPlayer !== 'p1' || deck.length === 0 || hasDrawn) return;
    const [card, ...rest] = deck;
    if (currentPlayer === 'p1') {
      setPlayer1([...player1, card]);
      setGameLog('Player 1: Now discard a card');
      // To highlight the last card
      setLastDrawnCardId(getCardId(card));
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
      setGameLog('Player 1: Now discard a card');
      setLastDrawnCardId(getCardId(card));
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

    const card = player1.find(c => getCardId(c) === cardId);
    if (!card) return;

    setPlayer1(player1.filter(c => getCardId(c) !== cardId));
    setDiscardPile([...discardPile, card]);
    setCurrentPlayer('p2');
    setGameLog('Player 2. Thinking...');
    setHasDrawn(false);
  }

  function handlePlayer1GoDown() {
    const rankGroups: { [key: string]: CardType[] } = {};
    player1.forEach(card => {
      const key = card.rank;
      if (!rankGroups[key]) rankGroups[key] = [];
      rankGroups[key].push(card);
    });

    const trios = Object.values(rankGroups).filter(group => group.length >= 3);

    if (trios.length >= 2) {
      const newSets = trios.slice(0, 2).map(group => group.slice(0, 3));

      setPlayer1Sets(prev => [...prev, ...newSets]);

      const remaining = player1.filter(c => !newSets.flat().includes(c));
      setPlayer1(remaining);

      setHasPlayer1GoneDown(true);
    } else {
      alert('Not ready to go down. You need: ' + currentObjective);
    }
  }

  return (
    <main className="flex w-full max-w-6xl mx-auto">
      <div className="w-1/4 p-4 bg-gray-50 rounded">
        <h3 className="font-bold mb-2">
          <a href="https://es.wikipedia.org/wiki/Carioca_(juego)">Carioca</a>
        </h3>
        <ul className="text-sm list-disc list-inside mb-4">
          <li>Built with Next.js.</li>
          <li>Uses the OpenAI API for bot logic.</li>
          <li>Hosted on Vercel.</li>
        </ul>
        <h3 className="font-bold mb-2">In Development</h3>
        <ul className="text-sm list-disc list-inside mb-4">
          <li>Only supports &quot;trios&ldquo; fow now</li>
          <li>You can lay down once, but no other cards can be played after.</li>
          <li>No win condition implemented yet.</li>
        </ul>
        <h3 className="font-bold mb-2">Instructions</h3>
        <ul className="text-sm list-disc list-inside mb-4">
          <li>Draw one card (from the deck or discard pile).</li>
          <li>Rearrange your hand (optional).</li>
          <li>Discard one card to end your turn (double click).</li>
          <li>Lay down when you meet the objective.</li>
        </ul>
        <h3 className="font-bold mb-2">Game status</h3>
        <div className="text-sm max-h-96 overflow-y-auto bg-white p-2 rounded border">
          <div>{gameLog}</div>
        </div>
      </div>
      <div className="w-3/4 p-4 justify-center text-center">
        {/* Bot (Player 2) */}
        <div className="mb-4 text-center">
          <h2 className="font-bold mb-2">
            <span className={` ${currentPlayer == 'p2' ? 'border-2 border-green-500 p-1' : ''}`}>
              Bot (Player 2)
            </span>
          </h2>
          <div className="flex gap-1 flex-wrap justify-center h-24">
            {player2.map((c, i) => (
              <Card key={i} card={c} />
            ))}
          </div>
        </div>
        <PlayerSet 
          player="Bot Sets (Player 2)"
          playerSets={ player2Sets }
        />

        <Deck
          deck={deck}
          discardPile={discardPile}
          drawFromDeck={drawFromDeck}
          drawFromDiscard={drawFromDiscard}
        />

        {/* Player (Player 1) */}
        <div className="mt-4">
          <h3 className="font-bold mb-1">Player 1 Sets (You)</h3>
          {player1Sets.length === 0 ? (
            <p>No sets yet.</p>
          ) : (
            player1Sets.map((set, i) => (
              <div key={i} className="flex gap-1 mb-1 scale-75">
                {set.map((card, j) => (
                  <Card key={j} card={card} />
                ))}
              </div>
            ))
          )}
        </div>
        <div className="text-center">
          <h2 className="font-bold mb-2">
            <span className={` ${currentPlayer == 'p1' ? 'border-2 border-green-500 p-1' : ''}`}>
              Player 1 (You)
            </span>
          </h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={player1.map(c => getCardId(c))}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex gap-1 flex-wrap justify-center">
                {player1.map(c => (
                  <SortableCard
                    key={getCardId(c)}
                    id={getCardId(c)}
                    card={c}
                    onDoubleClick={() => discardCard(getCardId(c))}
                    highlight={lastDrawnCardId === getCardId(c)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
            onClick={handlePlayer1GoDown}
          >
            Lay Down
          </button>
        </div>
      </div>
    </main>
  );
}
