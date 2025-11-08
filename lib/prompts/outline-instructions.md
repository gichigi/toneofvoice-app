# Outline Generation Instructions

## REQUIREMENTS
- Main title (< 60 chars)
- Format (e.g. Guide, List, Comparison, Question-based, Case Study, Explainer, Template, anatomy of x)
- Minimum 8-10 sections and topics to explore in each section
- Min ONE practical, reusable framework with depth/naunce
- Examples beyond Nike/Apple/Coca-Cola
- Article target 3,800+ tokens minimum / ~1200-1600 words
- min 4 helpful FAQs
- short conclusion with next steps

Return as JSON with this structure:

```json
{
  "title": "proposed title",
  "format": "format type",
  "sections": [
    {
      "heading": "H2 heading",
      "topics": ["topic 1", "topic 2", ...]
    }
  ],
  "includes_template": true/false,
  "template_description": "detailed description of template structure, sections, and example content if included, or null",
  "research_excerpts": [
    {
      "source_number": 1,
      "source_url": "url from the research sources",
      "excerpt": "the specific text, quote, statistic, or insight and who said it",
      "context": "brief note on how this supports the article (e.g., 'brand example for section 3', 'statistic for introduction')"
    }
  ]
}
```
---
