import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Card as CardType } from '@/lib/deck';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const botHand: CardType[] = body.botHand;
    const discardTop = body.discardTop;
    const objective = body.objective;

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'decide_draw_source',
          description: 'Decide whether to draw from the discard pile or the deck based on current hand and game objective',
          parameters: {
            type: 'object',
            properties: {
              drawFrom: {
                type: 'string',
                enum: ['deck', 'discard'],
              },
            },
            required: ['drawFrom'],
          },
        },
      },
    ];

    const systemPrompt = `
You are playing Carioca, a card game.

Game definitions:
- A "trio" is three cards of the same rank (e.g., 7♠, 7♥, 7♦).
- A "run" is four or more consecutive cards of the same suit (e.g., 5♠, 6♠, 7♠, 8♠).
- Runs can wrap around: Q♠, K♠, A♠, 2♠ is a valid sequence.

Rules:
- Prefer the discard card if it helps you complete or extend a group (trio or run).
- Otherwise, prefer drawing from the deck.
`;

    const userPrompt = `
Objective: ${objective}

Hand: ${botHand.map((c) => `${c.rank}${c.suit}-${c.deckNumber}`).join(', ')}

Discard top: ${discardTop.rank}${discardTop.suit}-${discardTop.deckNumber}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools,
      tool_choice: { type: 'function', function: { name: 'decide_draw_source' } },
    });

    const toolCall = completion.choices[0].message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('Tool call did not return arguments');
    }

    const decision = JSON.parse(toolCall.function.arguments);
    console.log(decision);

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
