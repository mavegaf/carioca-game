import { createContext, useContext, useState } from 'react';
import type { Card } from '@/lib/deck';

type CardSource = 'deck' | 'discard';

type DeckContextType = {
    deck: Card[];
    discardPile: Card[];
    drawFrom: (from: CardSource) => Card | null;
    setDeck: React.Dispatch<React.SetStateAction<Card[]>>;
    setDiscardPile: React.Dispatch<React.SetStateAction<Card[]>>;
};

const DeckContext = createContext<DeckContextType | null>(null);

export function useDeck() {
    const context = useContext(DeckContext);

    if (!context) {
        throw new Error('useDeck must be used within a DeckProvider');
    }
    return context;

}

export function DeckProvider({ children }: { children: React.ReactNode }) {
    const [deck, setDeck] = useState<Card[]>([]);
    const [discardPile, setDiscardPile] = useState<Card[]>([]);

    const drawFrom = (from: CardSource): Card | null => {
        if (from === 'deck' && deck.length > 0) {
            const [card, ...rest] = deck;
            setDeck(rest);
            return card;
        }
        if (from === 'discard' && discardPile.length > 0) {
            const card = discardPile[discardPile.length - 1];
            setDiscardPile(discardPile.slice(0, -1));
            return card;
        }
        return null;
    };

    return (
        <DeckContext.Provider
            value={{ deck, discardPile, drawFrom, setDeck, setDiscardPile }}
        >
            {children}
        </DeckContext.Provider>
    );
}