import type { NextRequest } from 'next/server';

import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 500 }
    );
  }

  try {
    const { messages } = await req.json();

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `You are an expert editor specializing in brand voice and style guides.
Your role is to help users improve their tone of voice documentation.

Rules:
- Preserve the exact markdown structure (headings, lists, formatting)
- Maintain consistency with the brand's voice
- Return ONLY the edited content, no explanations or commentary
- Do not wrap output in code fences
- For style rules with examples, ensure correct/incorrect examples are logically consistent
- Keep the same heading levels and section structure unless explicitly asked to change them`,
      messages,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[ai/command] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
