import { useEffect, useState } from 'react';
import { getCardId, Card, goDown, goDownInSet } from '@/lib/deck';
import { useDeck } from '@/contexts/DeckContext';

type CardSourceType = 'deck' | 'discard';

type Props = {
    currentPlayer: 'p1' | 'p2';
    currentObjective: string;
    gameOver: boolean
    player2Cards: Card[];
    player1Sets: Card[][];
    player2Sets: Card[][];
    handleDrawFrom: (source: CardSourceType) => void;
    setPlayer2Cards: React.Dispatch<React.SetStateAction<Card[]>>;
    setPlayer1Sets: React.Dispatch<React.SetStateAction<Card[][]>>;
    setPlayer2Sets: React.Dispatch<React.SetStateAction<Card[][]>>;
    setCurrentPlayer: (player: 'p1' | 'p2') => void;
    setGameLog: (log: string) => void;
    setHighLightDeckODiscard: React.Dispatch<React.SetStateAction<string | null>>;
};

type BotPhases = 'idle' | 'drawing' | 'go-down' | 'discarding';

export function useBotPlayer({
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
    setHighLightDeckODiscard,
}: Props) {

    const { discardPile, setDiscardPile } = useDeck();
    const [botPhase, setBotPhase] = useState<BotPhases>('idle');

    /**
     * When changes from player p1 to p2, we start the flow
     * 
     */
    useEffect(() => {

        if (gameOver) return;

        if (currentPlayer === 'p2') {
            setBotPhase('drawing');
        }
    }, [currentPlayer, gameOver]);

    /**
     * Player 2 draw a card from deck or discard pile.
     *
     */
    useEffect(() => {

        if (gameOver) return;

        if (botPhase !== 'drawing') return;

        console.log('player2 ' + botPhase);

        // Current player is p2 (bot) it needs to pick a card
        const player2BotDrawACard = async () => {
            try {
                setGameLog('Player 2: Deciding which card to draw...');
                const res = await fetch('/api/bot-draw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        botHand: player2Cards,
                        discardTop: discardPile[discardPile.length - 1],
                        objective: currentObjective,
                    }),
                });

                const data = await res.json();

                const drawFromDecision = data?.decision?.drawFrom ?? 'deck';
                console.log(drawFromDecision);

                handleDrawFrom(drawFromDecision);
            } catch (error) {
                console.error('Error in botDraw:', error);
                handleDrawFrom('deck');
            }
            setBotPhase('go-down');
        };

        player2BotDrawACard();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [botPhase, gameOver]);

    /**
     * Player 2 go down if meet the current objetive
     */
    useEffect(() => {
        if (gameOver) return;

        if (botPhase !== 'go-down') return;

        console.log('player2 ' + botPhase);

        if (player2Sets.length > 0) {
            // If already went down, I can discard in my sets or player 1 set.
            const newPlayer2Set = goDownInSet(currentObjective, player2Cards, player2Sets);
            setPlayer2Sets(newPlayer2Set);

            const idsToRemoveFromSet2 = new Set(newPlayer2Set.flat().map(getCardId));
            let newPlayer2Cards = player2Cards.filter(c => !idsToRemoveFromSet2.has(getCardId(c)));

            if (player1Sets.length > 0) {
                const newPlayer1Set = goDownInSet(currentObjective, newPlayer2Cards, player1Sets);
                setPlayer1Sets(newPlayer1Set);

                const idsToRemoveFromSet1 = new Set(newPlayer1Set.flat().map(getCardId));
                newPlayer2Cards = newPlayer2Cards.filter(c => !idsToRemoveFromSet1.has(getCardId(c)));
            }
            setPlayer2Cards(newPlayer2Cards);

        } else {
            const cardsToGoDown = goDown(currentObjective, player2Cards);

            if (cardsToGoDown?.length > 0) {
                setPlayer2Sets(prev => [...prev, ...cardsToGoDown]);

                const idsToRemove = new Set(cardsToGoDown.flat().map(getCardId));
                const remaining = player2Cards.filter(c => !idsToRemove.has(getCardId(c)));
                setPlayer2Cards(remaining);
            }
        }


        setBotPhase('discarding');

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [botPhase, gameOver]);

    /**
       * Player2 discard a card
       *
       */
    useEffect(() => {
        if (gameOver) return;

        if (botPhase !== 'discarding') return;

        console.log('player2 ' + botPhase);

        const player2BotDiscard = async () => {
            try {
                setGameLog('Player 2: Deciding which card to discard...');
                const res = await fetch('/api/bot-discard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        botHand: player2Cards,
                        objective: currentObjective,
                    }),
                });

                let data = await res.json();
                setGameLog('Player 2: Playing');

                if (!data || !data.decision) {
                    console.error('Bot move response missing decision:', data);
                    // lets do anything so don't block the game
                    data = {
                        canGoDown: false,
                        groups: [],
                        discardCard: `${player2Cards[0].rank}${player2Cards[0].suit}${player2Cards[0].deckNumber}`,
                    };
                }

                const { discardCard } = data.decision;

                console.log('Bot decision:', data.decision);

                const cardToDiscard = player2Cards.find(c => getCardId(c) === discardCard);
                if (cardToDiscard) {
                    setPlayer2Cards(prev =>
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

                    setHighLightDeckODiscard('discard');
                    setTimeout(() => {
                        setHighLightDeckODiscard(null);
                    }, 100);

                    setCurrentPlayer('p1');
                    setGameLog('Player 1. Take a card');
                }
            } catch (error) {
                console.error('Error in botMove:', error);
            }

            setBotPhase('idle');
        };

        player2BotDiscard();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [botPhase, gameOver]);

}
