## Batch Publishing Plan

### Next Steps

### Batch 1 — Launch Hubs & Core Definitions
- Hubs: Tone Fundamentals, Brand Voice Foundations, Guidelines & Templates, Examples & Case Studies, Channel & Execution
- Supporting posts: tone voice meaning, tone of voice types, brand voice guidelines, tone of voice in branding, marketing tone of voice
- Internal links: each supporting post links to its hub + two peers; hubs add TOC sections for all nine satellites.

### Batch 2 — Templates & Documentation
- Posts: tone of voice document, tone of voice document template, tone of voice guidelines, voice guidelines, brand voice document, brand voice guide template, brand tone of voice template, tone of voice exercise, tone of voice worksheets pdf, consistent brand voice
- Internal links: all template/doc posts ↔ Guidelines hub, cross-link to brand voice document + tone of voice document; update hub with “Template resources” section.

### Batch 3 — Examples & Comparisons
- Posts: brand tone of voice examples, brand voice and tone examples, voice and tone examples, tone of voice examples in writing, marketing tone of voice examples, social media tone of voice examples, tone sentences examples, tone of voice in writing, tone of voice in emails, tone of voice in advertising
- Internal links: example posts ↔ Examples hub + matching channel guides; channel posts cross-link to relevant examples; Channel hub adds “See examples” callouts.

### Batch 4 — Brand Breakdowns & Strategy
- Posts: nike brand voice, mailchimp tone of voice, forbes brand voice, monzo tone of voice, tone of voice in marketing definition, brand voice strategy, brand voice development, brand voice attributes, define brand voice, defining brand voice
- Internal links: brand case studies ↔ Examples hub + Channel hub sections; strategy posts reinforce Brand Voice hub and reference Guidelines resources.

### Batch 5 — Channel & Support Intents
- Posts: tone of voice for social media, social media brand voice, tone of voice in communication, tone of voice marketing, tone of voice in branding, tone of voice for a brand, tone of voice options, tone of voice in advertising, tone of voice in emails, tone of voice strategy
- Internal links: maintain hub up-link + two cross-links; highlight new additions within relevant hubs and re-surface key templates/resources.

### Retro-Linking Process

After publishing later batches, earlier posts will have missing internal links since target posts didn't exist yet. To add these links retroactively:

1. **Option: Patch Script** - Create a script that:
   - Reads `content-batch-plan.md` to get planned links for each published post
   - Checks which target slugs now exist in Supabase
   - Updates the post's markdown content to insert missing internal links naturally within relevant sections
   - Preserves existing content while adding the planned links

2. **Option: Regenerate** - Re-run the generator for earlier topics (dry-run first to preview):
   - The generator will now find existing target slugs and include them automatically
   - Review and publish updated content

The link mapping lives in `content-batch-plan.md`, so once target posts exist, either approach can use that plan to update earlier posts.