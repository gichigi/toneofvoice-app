import { NextResponse } from "next/server"
import { OpenAI } from "openai"
import { createClient } from "@/lib/supabase-server"
import { createTracedOpenAI } from "@/lib/langsmith-openai"

export async function POST(req: Request) {
  try {
    // Check auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { instruction, currentContent, brandName, scope, selectedText } = body as {
      instruction?: string
      currentContent?: string
      brandName?: string
      scope?: "section" | "selection" | "document"
      selectedText?: string
    }

    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'instruction' field" },
        { status: 400 }
      )
    }

    // Determine content to rewrite based on scope
    let contentToRewrite = currentContent || ""
    if (scope === "selection" && selectedText) {
      contentToRewrite = selectedText
    } else if (scope === "document" && currentContent) {
      contentToRewrite = currentContent
    } else if (!currentContent || typeof currentContent !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'currentContent' field" },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("[rewrite-section] OPENAI_API_KEY not set")
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      )
    }

    const openai = createTracedOpenAI()

    const systemPrompt = `You are an expert editor specializing in brand voice and style guides. 
Your task is to rewrite a section of a style guide based on user instructions while:
1. Preserving the exact markdown structure (headings, lists, formatting)
2. Maintaining consistency with the brand's voice
3. Keeping the same level of detail and depth
4. Only changing what the user specifically requested

Return ONLY the rewritten markdown content, no explanations or commentary.`

    const scopeLabel = scope === "selection" ? "selected text" : scope === "document" ? "entire document" : "section"
    
    const userPrompt = brandName
      ? `Brand: ${brandName}

Current ${scopeLabel} content:
${contentToRewrite}

User instruction: ${instruction}

Rewritten ${scopeLabel} (preserve markdown structure):`
      : `Current ${scopeLabel} content:
${contentToRewrite}

User instruction: ${instruction}

Rewritten ${scopeLabel} (preserve markdown structure):`

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      reasoning_effort: "low",
      max_completion_tokens: 2000,
    })

    const rewrittenContent = response.choices[0]?.message?.content?.trim() ?? contentToRewrite

    // Clean up any markdown code blocks that might have been added
    let cleanedContent = rewrittenContent
      .replace(/```(markdown|md)?\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    return NextResponse.json({ 
      success: true,
      content: cleanedContent 
    })
  } catch (error) {
    console.error("[rewrite-section] Error:", error)
    return NextResponse.json(
      { error: "Failed to rewrite section" },
      { status: 500 }
    )
  }
}
