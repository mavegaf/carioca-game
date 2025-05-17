export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export type Card = {
  suit: Suit;
  rank: Rank;
  deckNumber: number;
};

const suits: Suit[] = ['♠', '♥', '♦', '♣'];
const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function generateDeck(): Card[] {
  const singleDesk = suits.flatMap(suit => ranks.map(rank => ({ suit, rank })));

  const deck1 = singleDesk.map(card => ({ ...card, deckNumber: 1 }));
  const deck2 = singleDesk.map(card => ({ ...card, deckNumber: 2 }));
  return [...deck1, ...deck2];
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // swap
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCardId(card: Card): string {
  return `${card.rank}${card.suit}-${card.deckNumber}`;
}

export function goDown(objetive: string, cards: Card[]) {

  if (objetive === '2 trios') {
    const rankGroup: Record<string, Card[]> = {};
    for (const card of cards) {
      if (!rankGroup[card.rank]) {
        rankGroup[card.rank] = [];
      }
      rankGroup[card.rank].push(card);
    }

    const trios = Object.values(rankGroup).filter(group => group.length >= 3);

    if (trios.length < 2) {
      return [];
    }

    trios.sort((a, b) => b.length - a.length);

    return trios.slice(0, 2).map(group => group.slice(0, 3));

  } else {
    // TODO implement others objetives
    return [];
  }
}


export function canGoDown(objetive: string, cards: Card[]) {
  const goDownCards = goDown(objetive, cards);

  return goDownCards.length > 0;
}

export function goDownInSet(objetive: string, cards: Card[], playerSet: Card[][]): Card[][] {
  if (objetive === '2 trios') {

    const newPlayerSet: Card[][] = [
      [...playerSet[0]],
      [...playerSet[1]]
    ];
    const trio1Rank = newPlayerSet[0][0];
    const trio2Rank = newPlayerSet[1][0];

    for (const card of cards) {
      if (card.rank == trio1Rank.rank) {
        newPlayerSet[0].push(card);
      } else if (card.rank == trio2Rank.rank) {
        newPlayerSet[1].push(card);
      }
    }

    return newPlayerSet;

  } else {
    // TODO implement others objetives
    return [];
  }
}
