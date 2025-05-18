import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Card as CardType } from '@/lib/deck';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  let botHand: CardType[] = [];
  let objective;
  try {
    const body = await request.json();
    botHand = body.botHand;
    objective = body.objective;

    const tools = [
      {
        type: 'function' as const,
        function: {
          name: 'decide_discard_card',
          description: 'Given the current hand and the goal, choose the best card to discard.',
          parameters: {
            type: 'object',
            properties: {
              discardCard: {
                type: 'string',
                description: 'Card to discard in the format <rank><suit>-<deckNumber>',
              },
            },
            required: ['discardCard'],
          },
        },
      },
    ];

    const systemPrompt = `
You are playing Carioca, a Latin American card game.

Definitions:
- A "trio" is 3 cards of the same rank (e.g., 7♠, 7♥, 7♦).
- A "run" is 4 or more consecutive cards of the same suit (e.g., 5♠, 6♠, 7♠, 8♠).
- Runs can wrap around (Q♠, K♠, A♠, 2♠).

Important:
- Avoid discarding useful cards for your current goal (trio or run).
- Choose the **least useful** card for your current objective.

Respond by calling the function **decide_discard_card** with one key: "discardCard"
`;

    const userPrompt = `
Goal: ${objective}

Your hand (with deck numbers):
${botHand.map((c: CardType) => `${c.rank}${c.suit}-${c.deckNumber}`).join(', ')}

Respond only with the card to discard, using format "<rank><suit>-<deckNumber>"
`;

    console.log('--> bot discard');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools,
      tool_choice: { type: 'function', function: { name: 'decide_discard_card' } },
    });

    const toolCall = completion.choices[0].message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('Tool call did not return arguments');
    }

    const decision = JSON.parse(toolCall.function.arguments);
    console.log(decision);

    return NextResponse.json({ decision });
  } catch (error) {
    console.error('Bot move error:', error);
    return NextResponse.json(
      {
        discardCard: `${botHand[0]?.rank}${botHand[0].suit}-${botHand[0].deckNumber}`,
      },
      { status: 500 }
    );
  }
}
