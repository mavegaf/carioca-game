import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Card as CardType } from '@/lib/deck';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {

    let botHand: CardType[] = [];
    let discardTop;
    let objective;
    try {
        const body = await request.json();
        botHand = body.botHand;
        discardTop = body.discardTop;
        objective = body.objective;

        const prompt = `
You are playing Carioca, a card game.

Game definitions:
- A "trio" is three cards of the same rank (e.g., 7♠, 7♥, 7♦).
- A "run" is four or more consecutive cards of the same suit (e.g., 5♠, 6♠, 7♠, 8♠).
- Runs can wrap around: you can connect Q♠, K♠, A♠, 2♠, 3♠ as a valid sequence.

Important rules:
- Only lay down ("go down") when you **fully** meet the current goal.  
  For example, if the goal is "2 trios", you must have two complete trios.  
  If the goal is "1 trio and 1 run", you must have both fully.
- Do **not** lay down partial groups.
- When drawing, prioritize cards that help complete remaining groups.
- When discarding, avoid discarding useful cards for your goal.

---

### Example 1:
Goal: 2 trios  
Hand: 7♠, 7♥, 7♦, 9♠, 9♥, 9♦, 2♣, 4♠, 5♥, 6♣, J♠, Q♣  
Decision:
{
  "canGoDown": true,
  "groups": [["7♠", "7♥", "7♦"], ["9♠", "9♥", "9♦"]],
  "drawFrom": "deck",
  "discardCard": "2♣"
}

---

### Example 2:
Goal: 1 trio and 1 run  
Hand: 5♠, 6♠, 7♠, 8♠, K♥, K♦, K♣, 2♠, 4♣, 9♦, Q♥, 3♠  
Decision:
{
  "canGoDown": true,
  "groups": [["5♠", "6♠", "7♠", "8♠"], ["K♥", "K♦", "K♣"]],
  "drawFrom": "deck",
  "discardCard": "2♠"
}

---

### Now, your current situation:

Current goal: ${objective}

Your current hand (with deck numbers):
${botHand.map((c: CardType) => `${c.rank}${c.suit}-${c.deckNumber}`).join(', ')}

The top card on the discard pile is: ${discardTop.rank}${discardTop.suit}-${discardTop.deckNumber}

Respond strictly as JSON:
{
  "canGoDown": true or false,
  "groups": [ ["7♠-1", "7♥-2", "7♦-1"], ["5♠-1", "6♠-2", "7♠-1", "8♠-1"] ],
  "drawFrom": "deck" or "discard",
  "discardCard": "<rank><suit>-<deckNumber>"
}
`;

        const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4-turbo',
        });

        const reply = completion.choices[0].message?.content;
        const jsonMatch = reply?.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log(jsonMatch);
            throw new Error('No JSON block found in OpenAI response');
        }
        const decision = JSON.parse(jsonMatch[0]);

        return NextResponse.json({ decision });
    } catch (error) {
        console.error('Bot move error:', error);
        return NextResponse.json(
            {
                "canGoDown": false,
                "groups": [],
                "drawFrom": "deck",
                "discardCard": `${botHand[0]?.rank}${botHand[0].suit}${botHand[0].deckNumber}`
            },
        { status: 500 }
        );
  }
}
