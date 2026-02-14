import { OpenAI } from "openai"
import { wrapOpenAI } from "langsmith/wrappers"

/**
 * Create an OpenAI client wrapped with LangSmith tracing
 *
 * Usage:
 * ```ts
 * import { createTracedOpenAI } from "@/lib/langsmith-openai"
 *
 * const openai = createTracedOpenAI()
 * const response = await openai.chat.completions.create(...)
 * ```
 */
export function createTracedOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not found in environment variables")
  }

  const client = new OpenAI({ apiKey })

  // Debug: Log LangSmith config
  const langsmithEnabled = process.env.LANGSMITH_TRACING === "true"
  const langsmithKeyPresent = !!process.env.LANGSMITH_API_KEY
  console.log("[LangSmith] Tracing enabled:", langsmithEnabled)
  console.log("[LangSmith] API key present:", langsmithKeyPresent)
  console.log("[LangSmith] Project:", process.env.LANGSMITH_PROJECT)

  // Only wrap with LangSmith if tracing is enabled
  if (langsmithEnabled && langsmithKeyPresent) {
    console.log("[LangSmith] ✓ Wrapping OpenAI client with LangSmith tracing")
    return wrapOpenAI(client)
  }

  // Return unwrapped client if LangSmith not configured
  console.log("[LangSmith] ✗ Using unwrapped OpenAI client (tracing disabled)")
  return client
}
