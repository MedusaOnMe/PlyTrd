import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { question, description, currentPrice } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert prediction market analyst. Search the web for the latest info on this market, then give a BRIEF analysis.

**Question**: ${question}
${currentPrice ? `**Current Price**: ${currentPrice}%` : ''}

IMPORTANT: Keep your response SHORT - max 150 words total. No fluff.

Format exactly like this:
**Latest News**: 1-2 sentences on most recent relevant news
**Bull Case**: 1 sentence why price could be too low
**Bear Case**: 1 sentence why price could be too high
**Verdict**: Fairly priced / Undervalued / Overvalued + 1 sentence why

Be direct and opinionated. No disclaimers or hedging.`;

    // Use OpenAI Responses API with web search tool for live information
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        tools: [{ type: 'web_search' }],
        input: prompt,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);

      // Fallback to chat completions if responses API fails
      return fallbackToChat(question, description, currentPrice);
    }

    const data = await response.json();

    // Extract the output text from the response
    const analysis = data.output_text ||
      data.output?.find((o: any) => o.type === 'message')?.content?.[0]?.text ||
      'No analysis available';

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}

// Fallback to regular chat completions if web search isn't available
async function fallbackToChat(question: string, description?: string, currentPrice?: number) {
  const systemPrompt = `You are an expert prediction market analyst. Give BRIEF, direct analysis in max 150 words.

Format:
**Latest News**: 1-2 sentences (note if using older info)
**Bull Case**: 1 sentence
**Bear Case**: 1 sentence
**Verdict**: Fairly priced / Undervalued / Overvalued + why

Be opinionated. No disclaimers.`;

  const userPrompt = `**Question**: ${question}
${currentPrice ? `**Current Price**: ${currentPrice}%` : ''}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to get AI analysis' },
      { status: 500 }
    );
  }

  const data = await response.json();
  const analysis = data.choices[0]?.message?.content || 'No analysis available';

  return NextResponse.json({
    analysis: analysis + '\n\n*Note: Analysis based on training data. Live web search unavailable.*'
  });
}
