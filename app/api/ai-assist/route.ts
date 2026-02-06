import { NextResponse } from "next/server";
import { OpenAI } from "openai";

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
    const body = await req.json();
    const { text, action, context } = body as {
      text?: string;
      action?: AIAssistAction;
      context?: string;
    };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

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
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (!process.env.OPENAI_API_KEY) {
      console.error("[ai-assist] OPENAI_API_KEY not set");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: prompts.system },
        { role: "user", content: prompts.user(text, context) },
      ],
      reasoning_effort: "low",
      max_tokens: 500,
    });

    const suggestion =
      response.choices[0]?.message?.content?.trim() ?? text;

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("[ai-assist] Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
