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
- Runs can wrap around: Q♠, K♠, A♠, 2♠ is a valid sequence.

Your objective is to complete: ${objective}

You must now decide whether to take the top card from the **discard pile** or draw a new one from the **deck**.

Your hand (with deck numbers):
${botHand.map((c: CardType) => `${c.rank}${c.suit}-${c.deckNumber}`).join(', ')}

Top card on the discard pile:
${discardTop.rank}${discardTop.suit}-${discardTop.deckNumber}

Rules for this decision:
- Prefer the discard card if it helps you **complete or extend** a group (trio or run).
- Otherwise, prefer drawing from the deck.
- Do not consider discarding now — this decision is **only about what to draw**.

Respond strictly as JSON:
{
  "drawFrom": "deck" or "discard"
}
`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4-turbo',
    });

    const reply = completion.choices[0].message?.content;
    console.log(reply);
    const jsonMatch = reply?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log(jsonMatch);
      throw new Error('No JSON block found in OpenAI response');
    }
    const decision = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ decision });
  } catch (error) {
    console.error('Bot draw error:', error);
    return NextResponse.json(
      {
        drawFrom: 'deck',
      },
      { status: 500 }
    );
  }
}
