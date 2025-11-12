## Content Plan — Titles, Keywords, and Internal Linking

### Status & Next Steps
- Batches 1-5 are live (50 posts published via `batch-publish.sh` using GPT-4.1 + Firecrawl 8-source brief). Supabase is clean—draft leftovers were removed.
- Next up: rerun `scripts/retro-link-posts.js --dry-run` then live to align hubs/cross-links per the plan once any new batches land (open task `link-fix`).
- For reruns, keep the same pipeline: `batch-publish.sh <batch>` with retries + `tmp/response-*.json` capture, then retro-link, then CLI QA of slugs.
- If a new session starts, skim `scripts/README-batch-publish.md` and this plan for the batching flow, retry logic, and citation/linking rules.

### Legend
- **Up**: link to the pillar hub for this post.
- **Cross**: lateral links to related posts (older batch first when possible).
- **Resource**: template/tool posts to reference within the content.

### Batch 1 — Launch Hubs & Core Definitions
| # | Pillar | Primary Keyword | Working Title | Supporting Keywords / Notes | Internal Link Plan |
|---|--------|-----------------|---------------|-----------------------------|--------------------|
| 1 | Tone Fundamentals | tone of voice | Tone of Voice: What It Is, Why It Matters, and How to Nail It | include "what is tone of voice", "brand tone meaning" | Cross: Brand Voice 101, Voice & Tone Guideline Pack |
| 2 | Brand Voice Foundations | brand voice | Brand Voice 101: Build a Standout Voice That Sticks | add "what is brand voice", "brand voice meaning" | Cross: Tone of Voice hub, Brand Voice Guidelines |
| 3 | Guidelines & Templates | brand voice template | Voice & Tone Guideline Template Pack Essentials | mention "brand voice document template", "tone of voice template" | Cross: Brand Voice 101, Tone of Voice Marketing |
| 4 | Examples & Case Studies | tone of voice examples | 20 Tone of Voice Examples to Borrow for Your Brand | cover "brand voice examples", "best tone of voice" | Cross: Tone of Voice Types, Tone of Voice in Branding |
| 5 | Channel & Execution | tone of voice marketing | Tone of Voice Marketing: Apply Your Voice Across Every Touchpoint | note variant "marketing tone of voice examples" | Cross: Tone of Voice hub, Tone of Voice in Branding |
| 6 | Tone Fundamentals | tone voice meaning | Tone of Voice Meaning: Plain-English Guide | pair with "meaning of tone of voice" | Up: Tone of Voice hub<br>Cross: Tone of Voice Types |
| 7 | Tone Fundamentals | tone of voice types | 8 Tone of Voice Types and How to Use Them | include "types of tone of voice" | Up: Tone of Voice hub<br>Cross: Tone of Voice Meaning, Tone of Voice Examples |
| 8 | Brand Voice Foundations | brand voice guidelines | Brand Voice Guidelines: Step-by-Step Framework | tie in "brand tone guidelines" | Up: Brand Voice 101<br>Cross: Voice & Tone Guideline Pack |
| 9 | Channel & Execution | tone of voice in branding | Tone of Voice in Branding: Bring Your Personality to Life | add "tone of voice brand" | Up: Tone of Voice Marketing<br>Cross: Tone of Voice Examples |
|10 | Channel & Execution | marketing tone of voice | Marketing Tone of Voice: Examples and Best Practices | use SERP variant "marketing tone of voice examples" | Up: Tone of Voice Marketing<br>Cross: Brand Voice Guidelines |

### Batch 2 — Templates & Documentation
| # | Pillar | Primary Keyword | Working Title | Supporting Keywords / Notes | Internal Link Plan |
|---|--------|-----------------|---------------|-----------------------------|--------------------|
| 11 | Guidelines & Templates | tone of voice guide | Tone of Voice Guide Playbook: Modular Sections & Governance | add "tone of voice guide structure", "tone guide governance", include modular outline & localization checklist | Up: Voice & Tone Guideline Pack<br>Cross: Define Tone of Voice: Diagnostic Frameworks & Workshop Flow, Tone Alignment Labs |
| 12 | Guidelines & Templates | tone of voice document | Tone of Voice Documentation Sprints: Build It in 48 Hours | include "tone of voice doc process", "tone guideline sprint", highlight stakeholder alignment | Up: Voice & Tone Guideline Pack<br>Cross: Tone of Voice Guide Playbook, Brand Voice Document OS |
| 13 | Guidelines & Templates | tone of voice document template | Tone of Voice Template System: Figma + Notion Handoff | include "tone of voice template figma", "tone guide notion database", mention handoff workflows | Up: Voice & Tone Guideline Pack<br>Cross: Tone of Voice Documentation Sprints<br>Resource: Template Pack |
| 14 | Guidelines & Templates | tone of voice guidelines | Tone Governance Playbook: Roles, Rituals, and Reviews | include "tone governance framework", "content QA rituals", "tone review cadence" | Up: Voice & Tone Guideline Pack<br>Cross: Tone of Voice Guide Playbook, Brand Voice Strategy |
| 15 | Guidelines & Templates | voice guidelines | Voice vs Brand Guidelines: Alignment Matrix & Audit Checklist | include "brand voice alignment matrix", "tone vs voice audit" | Up: Voice & Tone Guideline Pack<br>Cross: Brand Voice Meaning, Tone Governance Playbook |
| 16 | Brand Voice Foundations | brand voice document | Brand Voice Document OS: Multi-Team, Multi-Market | include "brand voice document examples", "localized brand voice", "governance hub" | Up: Brand Voice 101<br>Cross: Tone of Voice Documentation Sprints, Brand Voice Attributes |
| 17 | Guidelines & Templates | brand voice guide template | Brand Voice Guide Template OS: Editable Systems & Field Kits | include "brand voice template notion", "enablement toolkit", "field guide cards" | Up: Voice & Tone Guideline Pack<br>Cross: Brand Voice Document OS<br>Resource: Template Pack |
| 18 | Guidelines & Templates | brand tone of voice template | Tone Enablement Template: Role-Based Messaging Kits | include "tone of voice enablement", "role-based tone playbook", "sales vs support guidance" | Up: Voice & Tone Guideline Pack<br>Cross: Tone Alignment Labs, Brand Voice Guide Template OS |
| 19 | Guidelines & Templates | tone of voice exercise | Tone Alignment Labs: 6 Workshop Drills That Stick | include "tone of voice workshop exercises", "tone calibration drills", "scenario roleplay" | Up: Voice & Tone Guideline Pack<br>Cross: Tone of Voice Guide Playbook, Tone Enablement Template |
| 20 | Guidelines & Templates | tone of voice worksheets pdf | Tone Calibration Worksheets: Audit, Iterate, Localize | include "tone of voice audit worksheet", "tone retro template", "localization worksheet pdf" | Up: Voice & Tone Guideline Pack<br>Cross: Tone Governance Playbook<br>Resource: Template Pack |

### Batch 3 — Deep Fundamentals & Example Foundations
| # | Pillar | Primary Keyword | Working Title | Supporting Keywords / Notes | Internal Link Plan |
|---|--------|-----------------|---------------|-----------------------------|--------------------|
| 21 | Tone Fundamentals | define tone of voice | Define Tone of Voice: Diagnostic Frameworks & Workshop Flow | add "tone of voice diagnostic", "voice attribute matrix", "tone scoring rubric" | Up: Tone of Voice hub<br>Cross: Tone of Voice Guide, Tone of Voice Exercises |
| 22 | Tone Fundamentals | definition of tone of voice | Definition of Tone of Voice: Research-Backed Breakdown | mention "brand communication science", "tone of voice definition marketing research", include FAQ segment | Up: Tone of Voice hub<br>Cross: Tone of Voice Meaning, Tone of Voice Marketing |
| 23 | Tone Fundamentals | meaning of tone of voice | Meaning of Tone of Voice: Emotional Spectrum to Copy Patterns | layer "brand archetype tone", "tone ladder worksheet", "emotive copy cues" | Up: Tone of Voice hub<br>Cross: Tone of Voice Types, Tone of Voice Document |
| 24 | Tone Fundamentals | voice tone meaning | Voice Tone Meaning: Linguistics to Message Architecture | include "linguistic tone markers", "voice modulation in copy", "message architecture examples" | Up: Tone of Voice hub<br>Cross: Voice Guidelines, Brand Voice Strategy |
| 25 | Tone Fundamentals | tone of voice definition marketing | Tone of Voice Definition for Marketing Teams: KPI Alignment | cover "campaign consistency metrics", "marketing tone governance", "content QA checklist" | Up: Tone of Voice hub<br>Cross: Tone of Voice Marketing, Consistent Brand Voice |
| 26 | Tone Fundamentals | tone of voice meaning in communication | Tone of Voice Meaning in Communication: Internal & External Calibration | add "internal comms playbook", "employee advocacy voice", "feedback loop templates" | Up: Tone of Voice hub<br>Cross: Tone of Voice Document, Tone of Voice in Communication |
| 27 | Tone Fundamentals | types of tone of voice | 21 Types of Tone of Voice: Brand Archetypes & Scorecards | note "tone archetypes", "voice mood boards", "scorecard templates" | Up: Tone of Voice hub<br>Cross: Tone of Voice Types, Brand Voice Examples |
| 28 | Examples & Case Studies | brand voice examples | Brand Voice Examples: 12 Brands with Measurement Snapshots | include "voice KPI case study", "before-after uplift data", "B2B vs B2C breakdown" | Up: Tone of Voice Examples hub<br>Cross: Brand Voice 101, Consistent Brand Voice |
| 29 | Examples & Case Studies | brand tone of voice examples | Brand Tone of Voice Examples: Messaging Systems & Playbooks | highlight "messaging architecture maps", "before/after rewrites", "tone governance kits" | Up: Tone of Voice Examples hub<br>Cross: Tone of Voice Guide, Voice & Tone Guideline Pack |
| 30 | Examples & Case Studies | brand voice and tone examples | Brand Voice and Tone Examples: Before/After Diagnostics | mention "tone QA checklist", "voice calibration workshop", "copy review scoring" | Up: Tone of Voice Examples hub<br>Cross: Tone of Voice Types, Tone of Voice Exercises |

### Batch 4 — Brand Breakdowns & Strategic Playbooks
| # | Pillar | Primary Keyword | Working Title | Supporting Keywords / Notes | Internal Link Plan |
|---|--------|-----------------|---------------|-----------------------------|--------------------|
| 31 | Examples & Case Studies | voice and tone examples | Voice and Tone Examples for Copywriters | expand into microcopy heuristics, voice QA frameworks, rewrite diagnostics | Up: Tone of Voice Examples hub<br>Cross: Tone of Voice in Writing, Tone QA Checklist |
| 32 | Examples & Case Studies | marketing tone of voice examples | Marketing Tone of Voice Examples That Convert | add campaign case studies, KPI lift snapshots, acquisition vs retention angles | Up: Tone of Voice Marketing hub<br>Cross: Tone of Voice Marketing, Marketing Scorecards |
| 33 | Examples & Case Studies | social media tone of voice examples | Social Media Tone of Voice Examples (Posts & Replies) | include platform-specific tone guardrails, moderation workflows, escalation templates | Up: Tone of Voice Marketing hub<br>Cross: Tone of Voice for Social Media, Community Playbooks |
| 34 | Examples & Case Studies | tone of voice examples in writing | Tone of Voice Examples in Writing (Email, Web, Social) | add channel-specific diagnostics, voice QA rubrics, rewrite examples | Up: Tone of Voice Examples hub<br>Cross: Tone of Voice in Writing, Voice QA Checklist |
| 35 | Examples & Case Studies | nike brand voice | Nike Brand Voice: Why “Find Your Greatness” Works | analyze asset ecosystems, governance rituals, localization strategies | Up: Tone of Voice Examples hub<br>Cross: Brand Voice Examples, Campaign Measurement |
| 36 | Examples & Case Studies | mailchimp tone of voice | Mailchimp Tone of Voice: Lessons from a SaaS Favorite | cover onboarding sequences, brand personality guardrails, content review boards | Up: Tone of Voice Examples hub<br>Cross: Social Media Tone of Voice Examples, Tone Governance Playbook |
| 37 | Brand Voice Foundations | brand voice meaning | Brand Voice Meaning (Explained with Examples) | compare archetypes vs attributes, map shared language playbooks, include before/after diagnostics | Up: Brand Voice 101<br>Cross: Brand Voice Examples, Tone Alignment Labs |
| 38 | Brand Voice Foundations | brand voice strategy | Brand Voice Strategy: Map Traits to Journeys | link strategy to lifecycle maps, tone governance cadences, measurement dashboards | Up: Brand Voice 101<br>Cross: Consistent Brand Voice, Journey Playbooks |
| 39 | Brand Voice Foundations | brand voice development | Brand Voice Development Roadmap | break into phases, stakeholder alignment workshops, enablement artifacts | Up: Brand Voice 101<br>Resource: Template Pack, Tone Enablement Template |
| 40 | Brand Voice Foundations | brand voice attributes | Brand Voice Attributes: Choose the Right 3 Words | include attribute scoring templates, executive alignment exercises, audit checklists | Up: Brand Voice 101<br>Cross: Tone of Voice Types, Tone Attribute Matrix |

### Batch 5 — Channel Execution & Governance
| # | Pillar | Primary Keyword | Working Title | Supporting Keywords / Notes | Internal Link Plan |
|---|--------|-----------------|---------------|-----------------------------|--------------------|
| 41 | Channel & Execution | tone of voice in marketing | Tone of Voice in Marketing: Campaign Planning Checklist | layer funnel-stage messaging frameworks, creative briefs, measurement dashboards | Up: Tone of Voice Marketing hub<br>Cross: Marketing Tone of Voice Examples, Campaign Playbooks |
| 42 | Channel & Execution | tone of voice in communication | Tone of Voice in Communication: Internal + External Alignment | add employee comms playbooks, change-management scripts, stakeholder feedback loops | Up: Tone of Voice Marketing hub<br>Cross: Tone of Voice Document, Internal Comms Playbook |
| 43 | Channel & Execution | tone of voice for social media | Tone of Voice for Social Media: Playbooks by Platform | include platform tone matrices, escalation paths, moderation guidelines | Up: Tone of Voice Marketing hub<br>Cross: Social Media Tone of Voice Examples, Community Playbooks |
| 44 | Channel & Execution | social media brand voice | Social Media Brand Voice: Keep Your Personality Consistent | add brand personality guardrails, UGC response frameworks, crisis comms workflows | Up: Tone of Voice Marketing hub<br>Cross: Tone of Voice for Social Media, Tone Governance Playbook |
| 45 | Channel & Execution | tone of voice in writing | Tone of Voice in Writing: Framework + Examples | map channel-specific voice rules, QA checklists, rewrite diagnostics | Up: Tone of Voice Marketing hub<br>Cross: Tone of Voice Examples in Writing, Voice QA Checklist |
| 46 | Channel & Execution | tone of voice in emails | Tone of Voice in Emails: Templates for Every Scenario | align lifecycle journeys, personalization frameworks, deliverability tone tips | Up: Tone of Voice Marketing hub<br>Cross: Tone of Voice Worksheets, Tone Enablement Template |
| 47 | Channel & Execution | tone of voice in advertising | Tone of Voice in Advertising: Make Campaigns Feel On-Brand | add creative briefing templates, media-specific tone guardrails, measurement loops | Up: Tone of Voice Marketing hub<br>Cross: Marketing Tone of Voice Examples, Campaign Playbooks |
| 48 | Channel & Execution | define brand voice | How to Define Brand Voice in 5 Workshops | build workshop agendas, stakeholder alignment rituals, enablement toolkits | Up: Brand Voice 101<br>Cross: Tone of Voice Exercise, Tone Alignment Labs |
| 49 | Channel & Execution | defining brand voice | Defining Brand Voice: Facilitator’s Guide | include facilitator scripts, worksheet templates, follow-up governance | Up: Brand Voice 101<br>Cross: Brand Voice Development, Tone Enablement Template |
| 50 | Brand Voice Foundations | consistent brand voice | Consistent Brand Voice: Governance Playbook | add measurement frameworks, audit cadences, cross-functional ownership models | Up: Brand Voice 101<br>Cross: Brand Voice Strategy, Tone Governance Playbook |

> **Note:** Where SERP variants differ from the plain keyword (e.g., “marketing tone of voice examples”), call the exact phrase out in H2/H3s to capture the intent without changing the main working title.

