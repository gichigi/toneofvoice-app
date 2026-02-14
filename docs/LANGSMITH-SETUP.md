# LangSmith Observability Setup

This document explains how LangSmith is integrated for observability and tracing of all AI/LLM calls in the Tone of Voice app.

---

## What is LangSmith?

LangSmith is an observability platform for LLM applications. It provides:
- **Tracing**: See every API call, input/output, token usage, latency
- **Debugging**: Identify issues, compare prompts, analyze failures
- **Monitoring**: Track costs, performance, and usage patterns
- **Evaluation**: Test and improve prompts over time

---

## Setup Instructions

### 1. Create LangSmith Account

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Sign up for a free account (no credit card required for free tier)
3. Create a new project:
   - Click "New Project"
   - Name: `toneofvoice-app` (or your preferred name)
   - Description: "Tone of Voice App - AI observability"

### 2. Get API Key

1. In LangSmith, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it (e.g., "toneofvoice-dev")
4. Copy the key (starts with `ls_...`)

### 3. Configure Environment Variables

Add to your `.env` file:

```bash
# LangSmith (Observability)
LANGSMITH_API_KEY=ls_...  # Replace with your actual key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=toneofvoice-app
# LANGSMITH_ENDPOINT=https://api.smith.langchain.com  # Default (US)
# LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com  # Uncomment if EU region
```

**Important:** Add `LANGSMITH_API_KEY` to your Vercel environment variables for production.

### 4. Restart Dev Server

```bash
pnpm dev
```

---

## How It Works

### Architecture

All OpenAI API calls are automatically traced via the `createTracedOpenAI()` wrapper:

```
User Request → API Route → OpenAI Call (wrapped) → LangSmith Trace
```

### Files Modified

1. **`lib/langsmith-openai.ts`** (new)
   - Wraps OpenAI client with LangSmith's `wrapOpenAI()`
   - Automatically traces all calls
   - Only enables tracing when `LANGSMITH_TRACING=true`

2. **`lib/openai.ts`**
   - Uses `createTracedOpenAI()` instead of direct `new OpenAI()`

3. **All API routes:**
   - `/api/extract-website`
   - `/api/generate-styleguide`
   - `/api/rewrite-section`
   - `/api/ai-assist`
   - `/api/blog/generate`
   - All use `createTracedOpenAI()` for automatic tracing

### Traced Functions

Every AI call is now traced:
- `generateWithOpenAI()` (core function)
- `generateBrandVoiceTraits()`
- `generateBeforeAfterSamples()`
- `generateStyleRules()`
- `generateAudienceSection()`
- `generateContentGuidelines()`
- `generateWordList()`
- `generateKeywords()`
- `generateTraitSuggestions()`
- All blog generation calls
- All AI assist calls (rewrite, expand, shorten, etc.)

---

## Using LangSmith

### View Traces

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Select your project (`toneofvoice-app`)
3. You'll see a list of all traces (each API call)

### What You'll See

For each trace:
- **Input**: User prompt, system prompt, parameters
- **Output**: AI response
- **Metadata**: Model, token counts, latency, cost estimate
- **Status**: Success/failure
- **Nested runs**: If one function calls another

### Example Trace Structure

```
POST /api/generate-styleguide
  └─ generateBrandVoiceTraits
      └─ OpenAI Chat Completion (gpt-5.2)
          - Prompt tokens: 234
          - Completion tokens: 567
          - Latency: 2.3s
          - Cost: $0.015
```

### Filtering Traces

- Filter by status (success/error)
- Filter by model (gpt-5.2, gpt-4o, gpt-4o-mini)
- Filter by latency (>5s, etc.)
- Search by input/output content

---

## Cost Tracking

LangSmith shows estimated costs for each call based on:
- Model used (gpt-5.2, gpt-4o, gpt-4o-mini, gpt-4.1)
- Token counts (prompt + completion)
- OpenAI's pricing (updated regularly)

**Note:** These are estimates. Always cross-reference with OpenAI billing.

---

## Debugging with LangSmith

### Common Use Cases

1. **Find slow calls**
   - Filter by latency >5s
   - Identify bottlenecks
   - Optimize prompts or reduce token usage

2. **Debug failures**
   - Filter by status = error
   - See exact error messages
   - View inputs that caused failures

3. **Optimize prompts**
   - Compare different prompt versions
   - See which prompts produce better outputs
   - Track token usage before/after changes

4. **Monitor token usage**
   - See total tokens per day/week
   - Identify high-usage endpoints
   - Optimize expensive calls

---

## Production Deployment

### Vercel Environment Variables

Add these to Vercel:
```
LANGSMITH_API_KEY=ls_...
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=toneofvoice-app
```

### Security

- **Never commit** `LANGSMITH_API_KEY` to git (already in `.gitignore`)
- Use separate API keys for dev/staging/prod
- Rotate keys periodically

---

## Disabling Tracing

To disable LangSmith tracing (e.g., for local testing without observability):

1. Set `LANGSMITH_TRACING=false` in `.env`
2. Or comment out `LANGSMITH_API_KEY`
3. Restart dev server

The app will work normally without LangSmith - it gracefully falls back to unwrapped OpenAI client.

---

## Performance Impact

LangSmith adds minimal overhead:
- <50ms per API call (async upload)
- No impact on user-facing latency
- Traces uploaded in background

---

## Cost

LangSmith pricing:
- **Free tier**: 5,000 traces/month
- **Developer**: $39/month for 50,000 traces
- **Team**: $199/month for 500,000 traces

For most apps, free tier is sufficient during development. Production apps may need paid tier.

---

## Advanced Features

### Tagging Runs

Add custom tags to traces for easier filtering:

```ts
import { traceable } from "langsmith/traceable"

const myFunction = traceable(
  async (input: string) => {
    // your code
  },
  {
    name: "my-function",
    tags: ["feature:blog", "stage:generation"]
  }
)
```

### Grouping Traces

Wrap entire API routes with `traceable` to group all sub-runs:

```ts
import { traceable } from "langsmith/traceable"

const handler = traceable(
  async function () {
    const openai = createTracedOpenAI()
    const result1 = await openai.chat.completions.create(...)
    const result2 = await openai.chat.completions.create(...)
    return { result1, result2 }
  },
  { name: "Generate Style Guide Handler" }
)

export async function POST(req: Request) {
  const result = await handler()
  return NextResponse.json(result)
}
```

---

## Troubleshooting

### "API key not found" error

- Check `.env` has `LANGSMITH_API_KEY=ls_...`
- Restart dev server after adding env vars
- Verify key starts with `ls_`

### Traces not showing in LangSmith

- Check `LANGSMITH_TRACING=true`
- Check API key is valid
- Check project name matches: `LANGSMITH_PROJECT=toneofvoice-app`
- Verify network connectivity (LangSmith uploads async)

### "Invalid endpoint" error

- If in EU, set `LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com`
- Default is US: `https://api.smith.langchain.com`

---

## Resources

- [LangSmith Docs](https://docs.smith.langchain.com)
- [LangSmith SDK GitHub](https://github.com/langchain-ai/langsmith-sdk)
- [OpenAI Tracing Guide](https://docs.smith.langchain.com/cookbook/tracing-examples/openai)

---

**Last Updated:** 2026-02-13
**Maintained By:** Development team
