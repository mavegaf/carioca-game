'use client';

import { useEffect, useState, useMemo } from 'react';
import { generateDeck, shuffleDeck, getCardId, Card as CardType, canGoDown, goDownInSet } from '@/lib/deck';
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

  // Highlight 
  const [player1LastDrawCardId, setPlayer1LastDrawCardId] = useState<string | null>(null);
  const [player1DeckODiscard, setPlayer1DeckODiscard] = useState<string | null>(null);
  const [player2LastDrawCardId, setPlayer2LastDrawCardId] = useState<string | null>(null);
  const [player2DeckODiscard, setPlayer2DeckODiscard] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentObjective, setCurrentObjective] = useState('2 trios');
  const [gameOver, setGameOver] = useState(false);


  const [gameLog, setGameLog] = useState<string>('');

  // TODO fix this, this is wrong, needs to be an state?
  const player1HasDraw = useMemo(
    () => (player1Cards.length + player1Sets.flat().length === 12 ? false : true),
    [player1Cards, player1Sets]
  );

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
    gameOver,
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

  /**
   * If one of the player's cards is empty, there is a winner
   */
  useEffect(() => {

    // Not initialized yet
    if (!player1Cards.length && !player2Cards.length) return;

    if (player1Cards.length == 0) {
      setGameLog('🏆 Player 1 wins!');
      setGameOver(true);
    } else if (player2Cards.length == 0) {
      setGameLog('🏆 Bot (Player 2) wins!');
      setGameOver(true);
    }
  }, [player1Cards, player2Cards]);

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
    if (gameOver) return;

    if (currentPlayer === 'p1' && player1HasDraw) return;

    const card = drawFrom(source);
    if (!card) return;

    if (currentPlayer === 'p1') {
      let newPlayer1Cards = [...player1Cards, card];

      if (player1Sets.length > 0) {
        // If I already went down, I can discard in my sets of p2 sets
        const newPlayer1Set = goDownInSet(currentObjective, newPlayer1Cards, player1Sets);
        setPlayer1Sets(newPlayer1Set);

        const idsToRemoveFromSet1 = new Set(newPlayer1Set.flat().map(getCardId));
        newPlayer1Cards = newPlayer1Cards.filter(c => !idsToRemoveFromSet1.has(getCardId(c)));

        if (player2Sets.length > 0) {
          const newPlayer2Set = goDownInSet(currentObjective, newPlayer1Cards, player2Sets);
          setPlayer2Sets(newPlayer2Set);

          const idsToRemoveFromSet2 = new Set(newPlayer2Set.flat().map(getCardId));
          newPlayer1Cards = newPlayer1Cards.filter(c => !idsToRemoveFromSet2.has(getCardId(c)));
        }
      }

      setPlayer1Cards(newPlayer1Cards);
      setGameLog('Player 1: Now discard a card');
      highlightDrawCard(setPlayer1DeckODiscard, setPlayer1LastDrawCardId, source, card)


    } else if (currentPlayer === 'p2') {
      console.log('--> draw from ', source, ' card:', card);
      highlightDrawCard(setPlayer2DeckODiscard, setPlayer2LastDrawCardId, source, card)

      setPlayer2Cards([...player2Cards, card]);
    }
  }

  function highlightDrawCard(
    setPlayer1DeckODiscard: React.Dispatch<React.SetStateAction<string | null>>,
    setPlayer1LastDrawCardId: React.Dispatch<React.SetStateAction<string | null>>,
    source: string,
    card: CardType) {
    setPlayer1DeckODiscard(source);
    setTimeout(() => {
      setPlayer1DeckODiscard(null);
      setPlayer1LastDrawCardId(getCardId(card));
      setTimeout(() => {
        setPlayer1LastDrawCardId(null);
      }, 2000);
    }, 100);
  }
  function discardCard(cardId: string) {
    if (gameOver) return;

    if (!player1HasDraw) return;

    const card = player1Cards.find(c => getCardId(c) === cardId);
    if (!card) return;

    setPlayer1Cards(player1Cards.filter(c => getCardId(c) !== cardId));
    setDiscardPile([...discardPile, card]);
    setGameLog('Player 2. Thinking...');
    setCurrentPlayer('p2');
  }

  function handlePlayer1GoDown() {
    if (gameOver) return;

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
              <Card key={i} card={c} highlight={player2LastDrawCardId === getCardId(c)} />
            ))}
          </div>
        </div>
        <PlayerSet playerSets={player2Sets} />

        <Deck
          currentPlayer={currentPlayer}
          drawFromDeck={() => handleDrawFrom('deck')}
          drawFromDiscard={() => handleDrawFrom('discard')}
          lastDiscardedFrom={player1DeckODiscard || player2DeckODiscard}
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
                    highlight={player1LastDrawCardId === getCardId(c)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <button disabled={!canGoDown(currentObjective, player1Cards)}
            //className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
            className={`mt-2 px-4 py-2 text-white rounded ${canGoDown(currentObjective, player1Cards) ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            onClick={handlePlayer1GoDown}
          >
            Go Down
          </button>
          {gameOver && (
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => window.location.reload()}
            >
              🔄 Restart Game
            </button>)}
        </div>
      </div>
    </main>
  );
}
