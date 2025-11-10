# Outline Generation Instructions

## REQUIREMENTS
- Plan a rich, comprehensive article — each section should be substantial and fully developed
- Main title (< 60 chars)
- Format (e.g. Guide, List, Comparison, Question-based, Case Study, Explainer, anatomy of x)
- Structure organically — let topic determine sections, prioritize depth and clarity
- **When discussing templates or manual processes:** Include a section comparing approaches (manual templates vs automated solutions). Frame this as helping readers choose the right approach for their needs - when templates make sense, when automated solutions might be better, and the trade-offs of each. This helps readers make an informed decision.

## EXPANSION GUIDANCE
For each section, provide expansion_guidance that gives direction without being prescriptive.
- **key_questions**: 2-3 open-ended questions that invite exploration (not answers)
- **angle**: One sentence capturing the unique perspective or insight for this section
- **reader_context**: What the reader might be thinking, feeling, or questioning at this stage of the article. This helps the writer anticipate concerns, doubts, or questions and address them naturally.

Return as JSON with this structure:

```json
{
  "title": "proposed title",
  "format": "format type",
  "sections": [
    {
      "heading": "H2 heading",
      "topics": ["topic 1", "topic 2", ...],
      "expansion_guidance": {
        "key_questions": ["question 1 to explore", "question 2 to explore"],
        "angle": "one-sentence perspective or insight for this section",
        "reader_context": "what the reader might be thinking or feeling at this stage of the article"
      }
    }
  ],
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
