import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { botHand, discardTop, objective } = body;

    const prompt = `
You are playing Carioca, a card game.

Game definitions:
- A "trio" is three cards of the same rank (e.g., 7♠, 7♥, 7♦).
- A "run" is four or more consecutive cards of the same suit (e.g., 5♠, 6♠, 7♠, 8♠).
- Runs can wrap around: you can connect Q♠, K♠, A♠, 2♠, 3♠ as a valid sequence.

Important: Each card has a deckNumber (1 or 2) to indicate which deck it belongs to.
When identifying cards, always include the deckNumber, e.g., "7♠-1" or "K♥-2".

The current goal is: ${objective}.

Here is your current hand (with deck numbers):
${botHand.map((c: any) => `${c.rank}${c.suit}-${c.deckNumber}`).join(', ')}

The top card on the discard pile is: ${discardTop.rank}${discardTop.suit}-${discardTop.deckNumber}.

Decide:
- Should you draw from the deck or the discard pile?
- After drawing, which card should you discard?

Respond strictly as JSON:
{
  "drawFrom": "deck" or "discard",
  "discardCard": "<rank><suit>-<deckNumber>"
}
`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    const reply = completion.choices[0].message?.content;
    const jsonStart = reply?.indexOf('{');
    const jsonString = jsonStart !== -1 ? reply?.slice(jsonStart) : '{}';
    const decision = JSON.parse(jsonString || '{}');

    return NextResponse.json({ decision });
  } catch (error) {
    console.error('Bot move error:', error);
    return NextResponse.json(
      { message: 'Failed to get bot move' },
      { status: 500 }
    );
  }
}
