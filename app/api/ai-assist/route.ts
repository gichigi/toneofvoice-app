// DEPRECATED: Replaced by @platejs/ai + /api/ai/command streaming route
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { createTracedOpenAI } from "@/lib/langsmith-openai";

/** Supported AI assist actions */
export type AIAssistAction =
  | "rewrite"
  | "expand"
  | "shorten"
  | "more_formal"
  | "more_casual"
  | "simplify";

const ACTION_PROMPTS: Record<
  AIAssistAction,
  { system: string; user: (text: string, context?: string) => string }
> = {
  rewrite: {
    system: "You are an expert editor. Rewrite the selected text to improve clarity and flow. Keep the same meaning and roughly the same length. Return only the rewritten text, no quotes or extra commentary.",
    user: (text, context) =>
      context
        ? `Context (surrounding paragraph): "${context}"\n\nSelected text to rewrite:\n"${text}"\n\nRewritten text:`
        : `Rewrite this text:\n"${text}"\n\nRewritten text:`,
  },
  expand: {
    system: "You are an expert editor. Expand the selected text with more detail and depth. Keep the same tone and meaning. Return only the expanded text.",
    user: (text, context) =>
      context
        ? `Context: "${context}"\n\nText to expand:\n"${text}"\n\nExpanded text:`
        : `Expand this text:\n"${text}"\n\nExpanded text:`,
  },
  shorten: {
    system: "You are an expert editor. Shorten the selected text while keeping the key meaning. Be concise. Return only the shortened text.",
    user: (text, context) =>
      context
        ? `Context: "${context}"\n\nText to shorten:\n"${text}"\n\nShortened text:`
        : `Shorten this text:\n"${text}"\n\nShortened text:`,
  },
  more_formal: {
    system: "You are an expert editor. Make the selected text more formal and professional. Keep the meaning. Return only the revised text.",
    user: (text, context) =>
      context
        ? `Context: "${context}"\n\nText to make more formal:\n"${text}"\n\nFormal version:`
        : `Make this more formal:\n"${text}"\n\nFormal version:`,
  },
  more_casual: {
    system: "You are an expert editor. Make the selected text more casual and approachable. Keep the meaning. Return only the revised text.",
    user: (text, context) =>
      context
        ? `Context: "${context}"\n\nText to make more casual:\n"${text}"\n\nCasual version:`
        : `Make this more casual:\n"${text}"\n\nCasual version:`,
  },
  simplify: {
    system: "You are an expert editor. Simplify the selected text for easier reading. Use plainer language. Return only the simplified text.",
    user: (text, context) =>
      context
        ? `Context: "${context}"\n\nText to simplify:\n"${text}"\n\nSimplified text:`
        : `Simplify this text:\n"${text}"\n\nSimplified text:`,
  },
};

export async function POST(req: Request) {
  try {
    // Validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("[ai-assist] Invalid JSON:", e);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { text, action, context } = body as {
      text?: string;
      action?: AIAssistAction;
      context?: string;
    };

    // Validate text input
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

    if (text.length === 0) {
      return NextResponse.json(
        { error: "Text cannot be empty" },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Text too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    // Validate action
    const validActions: AIAssistAction[] = [
      "rewrite",
      "expand",
      "shorten",
      "more_formal",
      "more_casual",
      "simplify",
    ];
    const resolvedAction: AIAssistAction =
      action && validActions.includes(action) ? action : "rewrite";

    const prompts = ACTION_PROMPTS[resolvedAction];

    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("[ai-assist] OPENAI_API_KEY not set");
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 503 }
      );
    }

    const openai = createTracedOpenAI();

    // Call OpenAI with timeout and error handling
    let response;
    try {
      response = await Promise.race([
        openai.chat.completions.create({
          model: "gpt-5.2",
          messages: [
            { role: "system", content: prompts.system },
            { role: "user", content: prompts.user(text, context) },
          ],
          max_completion_tokens: 500,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 30000)
        ),
      ]);
    } catch (apiError: any) {
      console.error("[ai-assist] OpenAI API error:", apiError);

      // Handle specific error types
      if (apiError.message === "Request timeout") {
        return NextResponse.json(
          { error: "Request timed out. Please try again with shorter text." },
          { status: 504 }
        );
      }

      if (apiError.status === 429) {
        return NextResponse.json(
          { error: "Rate limit reached. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      if (apiError.status === 401) {
        return NextResponse.json(
          { error: "AI service authentication failed. Please contact support." },
          { status: 503 }
        );
      }

      if (apiError.status >= 500) {
        return NextResponse.json(
          { error: "AI service temporarily unavailable. Please try again." },
          { status: 503 }
        );
      }

      // Generic API error
      return NextResponse.json(
        { error: "Failed to generate suggestion. Please try again." },
        { status: 500 }
      );
    }

    // Validate response
    const suggestion = response.choices?.[0]?.message?.content?.trim();

    if (!suggestion) {
      console.error("[ai-assist] Empty response from OpenAI");
      return NextResponse.json(
        { error: "No suggestion generated. Please try again." },
        { status: 500 }
      );
    }

    // Return original text as fallback if suggestion is identical
    if (suggestion === text) {
      console.warn("[ai-assist] Suggestion identical to original");
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("[ai-assist] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
