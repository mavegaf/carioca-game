'use client';

import { useEffect, useState, useMemo } from 'react';
import { generateDeck, shuffleDeck, getCardId, Card as CardType } from '@/lib/deck';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useDeck } from '@/contexts/DeckContext';

import Card from '@/components/Card';
import Deck from '@/components/Deck';
import PlayerSet from '@/components/PlayerSets';
import SortableCard from '@/components/SortableCard';
import { useBotPlayer } from '@/hooks/useBotPlayer';

let didInit = false;
type CardSourceType = 'deck' | 'discard';
type CurrentPlayerType = 'p1' | 'p2';

export default function Home() {

  // Deck
  const { discardPile, drawFrom, setDeck, setDiscardPile } = useDeck();

  // Players
  const [currentPlayer, setCurrentPlayer] = useState<CurrentPlayerType>('p1');
  const [player1Cards, setPlayer1Cards] = useState<CardType[]>([]);
  const [player1Sets, setPlayer1Sets] = useState<CardType[][]>([]);
  const [player2Cards, setPlayer2Cards] = useState<CardType[]>([]);
  const [player2Sets, setPlayer2Sets] = useState<CardType[][]>([]);

  const [lastDrawnCardId, setLastDrawnCardId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentObjective, setCurrentObjective] = useState('2 trios');


  const [gameLog, setGameLog] = useState<string>('');

  const player1HasDrawn = useMemo(
    () => (player1Cards.length + player1Sets.flat().length === 12 ? false : true),
    [player1Cards, player1Sets]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const player1GoneDown = player1Sets.reduce((acc, s) => acc + s.length, 0) > 0 ? true : false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const player2GoneDown = player2Sets.reduce((acc, s) => acc + s.length, 0) > 0 ? true : false;

  useEffect(() => {
    if (!didInit) {
      didInit = true;

      const newDeck = shuffleDeck(generateDeck());
      const p1 = newDeck.slice(0, 12);
      const p2 = newDeck.slice(12, 24);
      const firstDiscard = newDeck[24];
      const remaining = newDeck.slice(25);

      setPlayer1Cards(p1);
      setPlayer2Cards(p2);
      setDiscardPile([firstDiscard]);
      setDeck(remaining);
      setCurrentPlayer('p1');
      setGameLog('Player 1. Take a card');
    }
  }, [setDeck, setDiscardPile]);

  useBotPlayer({
    currentPlayer,
    currentObjective,
    player2Cards,
    player1Sets,
    player2Sets,
    handleDrawFrom,
    setPlayer2Cards,
    setPlayer1Sets,
    setPlayer2Sets,
    setCurrentPlayer,
    setGameLog,
  });

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = player1Cards.findIndex(c => getCardId(c) === active.id);
      const newIndex = player1Cards.findIndex(c => getCardId(c) === over.id);
      setPlayer1Cards(items => arrayMove(items, oldIndex, newIndex));
    }
  }

  function handleDrawFrom(source: CardSourceType) {
    if (currentPlayer === 'p1' && player1HasDrawn) return;

    const card = drawFrom(source);
    if (!card) return;

    if (currentPlayer === 'p1') {
      setPlayer1Cards([...player1Cards, card]);
      setGameLog('Player 1: Now discard a card');
      setLastDrawnCardId(getCardId(card));
      setTimeout(() => {
        setLastDrawnCardId(null);
      }, 2000);
    } else if (currentPlayer === 'p2') {
      console.log('--> draw from ', source, ' card:', card);
      setPlayer2Cards([...player2Cards, card]);
    }
  }

  function discardCard(cardId: string) {
    if (!player1HasDrawn) return;

    const card = player1Cards.find(c => getCardId(c) === cardId);
    if (!card) return;

    setPlayer1Cards(player1Cards.filter(c => getCardId(c) !== cardId));
    setDiscardPile([...discardPile, card]);
    setGameLog('Player 2. Thinking...');
    setCurrentPlayer('p2');
  }

  function handlePlayer1GoDown() {
    const rankGroups: { [key: string]: CardType[] } = {};
    player1Cards.forEach(card => {
      const key = card.rank;
      if (!rankGroups[key]) rankGroups[key] = [];
      rankGroups[key].push(card);
    });

    const trios = Object.values(rankGroups).filter(group => group.length >= 3);

    if (trios.length >= 2) {
      const newSets = trios.slice(0, 2).map(group => group.slice(0, 3));

      setPlayer1Sets(prev => [...prev, ...newSets]);

      const remaining = player1Cards.filter(c => !newSets.flat().includes(c));
      setPlayer1Cards(remaining);
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
            <span
              className={` ${currentPlayer == 'p2' ? 'border-2 border-green-500 p-1 rounded-lg' : ''}`}
            >
              Bot (Player 2)
            </span>
          </h2>
          <div className="flex gap-1 flex-wrap justify-center">
            {player2Cards.map((c, i) => (
              <Card key={i} card={c} />
            ))}
          </div>
        </div>
        <PlayerSet playerSets={player2Sets} />

        <Deck
          currentPlayer={currentPlayer}
          drawFromDeck={() => handleDrawFrom('deck')}
          drawFromDiscard={() => handleDrawFrom('discard')}
        />

        <PlayerSet playerSets={player1Sets} />
        <div className="text-center">
          <h2 className="font-bold mb-2">
            <span
              className={` ${currentPlayer == 'p1' ? 'border-2 border-green-500 p-1 rounded-lg' : ''}`}
            >
              Player 1 (You)
            </span>
          </h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={player1Cards.map(c => getCardId(c))}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex gap-1 flex-wrap justify-center">
                {player1Cards.map(c => (
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
