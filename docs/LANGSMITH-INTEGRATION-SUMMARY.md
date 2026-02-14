# LangSmith Integration Summary

**Date:** 2026-02-13
**Integration Status:** ✅ Complete - Ready for Testing

---

## What Was Done

### 1. Installed LangSmith SDK ✅
```bash
pnpm add langsmith
```

### 2. Created Wrapped OpenAI Client ✅

**File:** `lib/langsmith-openai.ts`

This wrapper automatically traces all OpenAI API calls when LangSmith is enabled:

```ts
import { createTracedOpenAI } from "@/lib/langsmith-openai"

const openai = createTracedOpenAI()
// All calls are now automatically traced
```

### 3. Updated All OpenAI Instantiations ✅

**Files modified:**
- ✅ `lib/openai.ts` - Core generation functions
- ✅ `app/api/extract-website/route.ts` - Website extraction
- ✅ `app/api/generate-styleguide/route.ts` - Style guide generation
- ✅ `app/api/rewrite-section/route.ts` - Content rewriting
- ✅ `app/api/ai-assist/route.ts` - AI editing tools
- ✅ `app/api/blog/generate/route.ts` - Blog generation

All now use `createTracedOpenAI()` instead of `new OpenAI()`.

### 4. Added Environment Variables ✅

**File:** `.env`

Added LangSmith configuration:
```bash
LANGSMITH_API_KEY=ls_...  # You need to add your actual key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=toneofvoice-app
```

### 5. Created Documentation ✅

**Files:**
- ✅ `/docs/LANGSMITH-SETUP.md` - Complete setup guide
- ✅ `/docs/LANGSMITH-INTEGRATION-SUMMARY.md` - This file
- ✅ Updated `CLAUDE.md` - Added LangSmith to env vars and resources

---

## What You Need to Do

### 1. Create LangSmith Account (5 minutes)

1. Go to [smith.langchain.com](https://smith.langchain.com)
2. Sign up (free tier, no credit card required)
3. Create a new project: `toneofvoice-app`
4. Get API key: Settings → API Keys → Create API Key
5. Copy the key (starts with `ls_...`)

### 2. Add API Key to .env (1 minute)

Open `.env` and replace the placeholder:

```bash
# Before
LANGSMITH_API_KEY=ls_...

# After (example)
LANGSMITH_API_KEY=ls_abc123def456ghi789jkl012mno345pqr678
```

### 3. Restart Dev Server (1 minute)

```bash
# Stop current server (Ctrl+C)
pnpm dev
```

### 4. Test the Integration (2 minutes)

1. Generate a style guide (any method: URL or description)
2. Go to [smith.langchain.com](https://smith.langchain.com)
3. Select your project (`toneofvoice-app`)
4. You should see traces for all AI calls

### 5. Add to Vercel (for Production)

When deploying to production:

1. Go to Vercel dashboard
2. Project Settings → Environment Variables
3. Add:
   - `LANGSMITH_API_KEY` = your key
   - `LANGSMITH_TRACING` = `true`
   - `LANGSMITH_PROJECT` = `toneofvoice-app`
4. Redeploy

---

## What Gets Traced

All AI calls are now automatically traced:

### Core Generation Functions
- `generateWithOpenAI()` - Main generation function
- `generateBrandVoiceTraits()` - Voice trait generation
- `generateBeforeAfterSamples()` - Before/after examples
- `generateStyleRules()` - 25 style rules
- `generateAudienceSection()` - Audience description
- `generateContentGuidelines()` - Content guidelines
- `generateWordList()` - Word list generation
- `generateKeywords()` - Keyword extraction
- `generateAudienceSummary()` - Audience summary
- `generateTraitSuggestions()` - AI trait suggestions

### API Routes
- `/api/extract-website` - Website extraction
- `/api/generate-styleguide` - Full guide generation
- `/api/rewrite-section` - Content rewriting
- `/api/ai-assist` - AI editing (rewrite, expand, shorten, etc.)
- `/api/blog/generate` - Blog post generation

---

## What You'll See in LangSmith

### Trace Information

For each AI call, you'll see:
- **Input**: Full prompt (system + user)
- **Output**: AI response
- **Model**: Which model was used (gpt-5.2, gpt-4o, etc.)
- **Tokens**: Prompt tokens, completion tokens, total
- **Latency**: How long the call took
- **Cost**: Estimated cost per call
- **Status**: Success or error
- **Metadata**: Temperature, max_tokens, etc.

### Example Trace

```
POST /api/generate-styleguide (12.4s)
├─ generateBrandVoiceTraits (3.2s)
│  └─ OpenAI Chat Completion
│     Model: gpt-5.2
│     Tokens: 234 prompt + 567 completion = 801 total
│     Cost: ~$0.015
│     Status: ✓ Success
├─ generateStyleRules (5.8s)
│  └─ OpenAI Chat Completion
│     Model: gpt-5.2
│     Tokens: 456 prompt + 1234 completion = 1690 total
│     Cost: ~$0.032
│     Status: ✓ Success
└─ generateBeforeAfterSamples (2.1s)
   └─ OpenAI Chat Completion
      Model: gpt-5.2
      Tokens: 123 prompt + 234 completion = 357 total
      Cost: ~$0.007
      Status: ✓ Success
```

---

## Use Cases

### 1. Debug Failures
- Filter by status = error
- See exact error messages
- View inputs that caused failures

### 2. Optimize Costs
- See total tokens per day/week
- Identify high-usage endpoints
- Optimize expensive calls

### 3. Improve Prompts
- Compare different prompt versions
- See which prompts produce better outputs
- Track token usage before/after changes

### 4. Monitor Performance
- Find slow calls (>5s)
- Identify bottlenecks
- Optimize latency

### 5. Track Token Usage
- See token consumption trends
- Predict monthly costs
- Set up alerts for usage spikes

---

## Pricing

LangSmith has a generous free tier:
- **Free**: 5,000 traces/month
- **Developer**: $39/month for 50,000 traces
- **Team**: $199/month for 500,000 traces

For most apps, free tier is sufficient during development.

---

## Disabling LangSmith

To disable tracing (e.g., for local testing without observability):

```bash
# In .env
LANGSMITH_TRACING=false
```

Or comment out `LANGSMITH_API_KEY`. The app will work normally - it gracefully falls back to unwrapped OpenAI client.

---

## Troubleshooting

### Traces not showing up?

1. Check `LANGSMITH_API_KEY` is set correctly in `.env`
2. Check `LANGSMITH_TRACING=true`
3. Restart dev server after changing env vars
4. Verify project name matches: `LANGSMITH_PROJECT=toneofvoice-app`
5. Check network connectivity (traces upload async)

### "API key not found" error?

- Verify key starts with `ls_`
- Check no extra spaces or quotes
- Restart dev server

### In EU region?

Add to `.env`:
```bash
LANGSMITH_ENDPOINT=https://eu.api.smith.langchain.com
```

---

## Next Steps

1. ✅ **Done**: Integration complete, all code updated
2. 🔄 **Your turn**: Create LangSmith account + add API key
3. 🧪 **Test**: Generate a style guide and check traces
4. 📊 **Explore**: Use LangSmith to monitor your AI calls
5. 🚀 **Deploy**: Add env vars to Vercel when ready

---

## Files to Review

If you want to understand how it works:

1. **`lib/langsmith-openai.ts`** - Wrapper function
2. **`lib/openai.ts`** - See how it's used in core functions
3. **`app/api/extract-website/route.ts`** - Example API route usage
4. **`docs/LANGSMITH-SETUP.md`** - Full documentation

---

## Questions?

Check the full documentation: `/docs/LANGSMITH-SETUP.md`

Or:
- [LangSmith Docs](https://docs.smith.langchain.com)
- [LangSmith SDK GitHub](https://github.com/langchain-ai/langsmith-sdk)

---

**Integration completed by:** Claude Code
**Ready for testing:** Yes ✅
