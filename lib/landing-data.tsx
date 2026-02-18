/**
 * Landing page copy and structured data.
 * Single source of truth for static section content.
 */

import type React from "react"
import type { LucideIcon } from "lucide-react"
import {
  Check,
  CheckCircle,
  FileCheck,
  UserCheck,
  Shield,
  Heart,
  Zap,
  AlertTriangle,
  FileQuestion,
  AlertCircle,
  ShieldOff,
  X,
  Clock,
} from "lucide-react"

// --- What's Included ---
export interface WhatsIncludedFeature {
  number: number
  suffix: string
  title: string
  description: string
  iconBg: string
  delay: string
}

export const WHATS_INCLUDED_FEATURES: WhatsIncludedFeature[] = [
  { number: 25, suffix: "", title: "Writing rules", description: "Clear, actionable rules (tone, grammar, format) in your guide - ready for AI and your team.", iconBg: "bg-blue-100", delay: "0ms" },
  { number: 3, suffix: "", title: "Brand voice traits", description: "Complete definitions, do's, and don'ts customised for your brand.", iconBg: "bg-purple-100", delay: "100ms" },
  { number: 10, suffix: "", title: "Brand terms & phrases", description: "Preferred words and phrases so every piece of content stays on-brand.", iconBg: "bg-green-100", delay: "200ms" },
  { number: 5, suffix: "", title: "Before/After examples", description: "Your brand voice applied to real content types (e.g. headlines, emails).", iconBg: "bg-orange-100", delay: "300ms" },
  { number: 12, suffix: "", title: "AI cleanup rules", description: "Rules to catch robotic writing patterns so your content sounds human, not generated.", iconBg: "bg-red-100", delay: "400ms" },
  { number: 3, suffix: "", title: "Export formats", description: "PDF to share, Word to edit, Markdown for AI tools.", iconBg: "bg-indigo-100", delay: "500ms" },
  { number: 5, suffix: "", title: "Minutes to complete", description: "No prompting, no templates. Enter a URL or short description to start.", iconBg: "bg-pink-100", delay: "600ms" },
]

// --- Comparison table ---
export type ComparisonCell = "check" | "cross"

export interface ComparisonRow {
  feature: string
  templates: ComparisonCell
  chatgpt: ComparisonCell
  aisg: ComparisonCell
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  { feature: "Tone of voice guidelines", templates: "check", chatgpt: "check", aisg: "check" },
  { feature: "Writing rules from Apple, BBC, Spotify", templates: "check", chatgpt: "check", aisg: "check" },
  { feature: "Analyse any brand website with a click", templates: "cross", chatgpt: "check", aisg: "check" },
  { feature: "No prompt engineering required", templates: "cross", chatgpt: "cross", aisg: "check" },
  { feature: "Beautiful, clean style document", templates: "cross", chatgpt: "cross", aisg: "check" },
  { feature: "Ready to use in under 5 minutes", templates: "cross", chatgpt: "cross", aisg: "check" },
]

// Mobile variant for "Writing rules" (slightly different copy)
export const COMPARISON_ROW_MOBILE_FEATURE_2 = "Writing rules from Apple, BBC, Spotify etc."

// --- How It Works ---
export interface HowItWorksStep {
  title: string
  body: string
  accent: string
  numBg: string
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  { title: "Enter website", body: "Paste your site URL or a short brand description. We use it to match your voice and tone.", accent: "border-t-blue-300", numBg: "bg-blue-100 text-blue-700" },
  { title: "Generate your guidelines", body: "We build your tone of voice guide - voice traits, writing rules, and examples tailored to your brand.", accent: "border-t-purple-300", numBg: "bg-purple-100 text-purple-700" },
  { title: "Start writing in your voice", body: "Download as PDF or Word, or copy into your AI tools. Use it yourself or share with your team.", accent: "border-t-green-300", numBg: "bg-green-100 text-green-700" },
]

// --- Features (problems/solutions toggle) ---
export interface FeatureCard {
  icon: LucideIcon
  title: string
  desc: string
}

export const FEATURES_SOLUTIONS: FeatureCard[] = [
  { icon: CheckCircle, title: "Consistent messaging", desc: "Clear, unified voice across all content that resonates with your audience and builds trust" },
  { icon: FileCheck, title: "Complete tone of voice guidelines", desc: "Detailed guidelines with tone of voice traits, do's/don'ts, and examples to align your entire team - plus custom sections to fit your needs" },
  { icon: UserCheck, title: "Team alignment", desc: "Everyone writes in your brand's voice, creating consistent experiences at every touchpoint" },
  { icon: Shield, title: "Strong brand identity", desc: "Every message reinforces who you are, making your brand instantly recognizable and memorable" },
  { icon: Heart, title: "Customer trust", desc: "Clear, consistent voice builds credibility and makes customers feel confident choosing you" },
  { icon: Zap, title: "Faster content creation", desc: "Guidelines eliminate guesswork. AI cleanup rules catch robotic patterns. Your team spends less time rewriting and more time shipping" },
]

export const FEATURES_PROBLEMS: FeatureCard[] = [
  { icon: AlertTriangle, title: "Inconsistent messaging", desc: "Inconsistent messages that don't resonate with your audience, causing confusion and disconnect" },
  { icon: FileQuestion, title: "Unclear guidelines", desc: "Guidelines missing critical sections, leaving your team guessing and even disagreeing" },
  { icon: AlertCircle, title: "Team confusion", desc: "Everyone writes differently, creating mixed messages, lost brand equity and identity" },
  { icon: ShieldOff, title: "Lost brand identity", desc: "Every piece of content sounds different, diluting your brand and making you forgettable" },
  { icon: X, title: "Customer confusion", desc: "Mixed messages erode trust and make customers question whether you're the right choice" },
  { icon: Clock, title: "Time wasted", desc: "Teams spend hours debating tone and rewriting content instead of focusing on what matters" },
]

// --- Pricing ---
export type PricingFeature = string | { text: string; soon?: true }

export interface PricingTier {
  id: string
  name: string
  price: number
  priceLabel: string
  sublabel: string
  features: PricingFeature[]
  cta: string
  ctaSubtext: string
  badge?: string
  highlight?: boolean
}

// Content best practices: parallel structure, one idea per bullet, benefit-focused, consistent voice
export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    priceLabel: "$0",
    sublabel: "Free forever",
    features: [
      "Brand, audience & how to use",
      "Content guidelines & brand voice",
      "12 AI writing cleanup rules",
      "Edit and save your guide",
      "Export as PDF",
    ],
    cta: "Get started free",
    ctaSubtext: "Best for trying it out",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 12,
    priceLabel: "$12",
    sublabel: "per month",
    features: [
      "Everything in Starter, plus:",
      "25 supporting style rules",
      "Before & After examples",
      "Key terminology",
      "Generate up to 2 full guides",
      "AI assist to refine guidelines",
      "Add custom sections to your guide",
      "Export as PDF/Markdown/Word",
      "Subtle branding on exports",
    ],
    cta: "Get Pro",
    ctaSubtext: "Best for professionals",
    badge: "Most Popular",
    highlight: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: 49,
    priceLabel: "$49",
    sublabel: "per month",
    features: [
      "Everything in Pro, plus:",
      "Unlimited tone of voice guides",
      "White-label exports (no branding)",
      "Manage multiple client brands",
      "Priority email support",
      { text: "Custom colors & branding", soon: true },
      { text: "Client workspaces", soon: true },
      { text: "Higher-quality AI models", soon: true },
      { text: "Guidelines share link", soon: true },
    ],
    cta: "Get Agency",
    ctaSubtext: "Best for agencies and freelancers",
    highlight: false,
  },
]

// Shared tier styling for pricing section and billing page
export interface TierThemeSpec {
  border: string
  gradient: string
  nameClass: string
  priceClass: string
  buttonClass: string
  Icon: LucideIcon
  iconClass: string
  iconMargin: string
  listClass: string
  itemClass: string
}

export const TIER_THEME: Record<string, TierThemeSpec> = {
  starter: {
    border: "border-2 border-gray-300",
    gradient: "from-gray-50 to-background",
    nameClass: "text-gray-700",
    priceClass: "text-gray-700",
    buttonClass: "bg-gray-800 hover:bg-gray-700 text-white",
    Icon: CheckCircle,
    iconClass: "text-gray-500",
    iconMargin: "mr-2",
    listClass: "space-y-2 text-left text-sm",
    itemClass: "flex items-center",
  },
  pro: {
    border: "border-4 border-indigo-600",
    gradient: "from-indigo-50 to-background",
    nameClass: "text-indigo-700",
    priceClass: "text-indigo-700",
    buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
    Icon: Check,
    iconClass: "text-indigo-600",
    iconMargin: "",
    listClass: "space-y-2 text-left text-sm",
    itemClass: "flex items-center gap-2",
  },
  agency: {
    border: "border-2 border-blue-500",
    gradient: "from-blue-50 to-background",
    nameClass: "text-blue-700",
    priceClass: "text-blue-700",
    buttonClass: "bg-blue-500 hover:bg-blue-600 text-white",
    Icon: Check,
    iconClass: "text-blue-500",
    iconMargin: "",
    listClass: "space-y-2 text-left text-sm",
    itemClass: "flex items-center gap-2",
  },
}

// --- FAQ ---
export interface FaqItem {
  q: string
  a: string | React.ReactNode
}

// Shared answers so homepage and billing FAQs stay aligned (no em dashes in UI)
const REFUND_ANSWER = (
  <span>
    Manage your subscription anytime in your account. We offer a 30-day money-back guarantee. Email{" "}
    <a href="mailto:support@toneofvoice.app?subject=Refund%20Request" className="text-primary hover:underline">
      support@toneofvoice.app
    </a>{" "}
    within 30 days of purchase for a full refund.
  </span>
)
const SUPPORT_ANSWER = (
  <span>
    Email{" "}
    <a href="mailto:support@toneofvoice.app?subject=Support%20Request" className="text-primary hover:underline">
      support@toneofvoice.app
    </a>
    . Agency subscribers get priority support; we reply to all plans on business days.
  </span>
)

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What's in the free preview?",
    a: "You get a full preview of your tone of voice guide: About, Audience, Brand Voice, plus a sample of what Style Rules and Before/After look like. Export the preview as PDF. Upgrade to edit, add all sections, and export without limits.",
  },
  {
    q: "How do I get the full guide?",
    a: "Subscribe to Pro or Agency. You generate once; then you can edit any section, use AI to refine copy, and export as PDF or Word. Your guide is saved to your account and auto-saves as you edit.",
  },
  {
    q: "Can I edit my tone of voice guide?",
    a: "Yes. On Pro or Agency you can edit every section, add your own custom sections (e.g. Social Media Voice, Email Guidelines), use AI assist to rewrite parts, and export as PDF, Word, or Markdown. Edits auto-save.",
  },
  {
    q: "What export formats do I get?",
    a: "PDF (to share), Word (to edit offline), and Markdown (for AI tools). Available on Pro and Agency.",
  },
  {
    q: "How long does it take?",
    a: "Most guides are generated in a few minutes. You can preview immediately, then subscribe to unlock editing and full exports.",
  },
  {
    q: "What's included in the guide?",
    a: "About your brand, audience, content guidelines, brand voice traits (with do's/don'ts), 25 writing rules, before/after examples, preferred terms, and 12 AI cleanup rules. Pro and Agency also get full editing, custom sections, and AI assist.",
  },
  {
    q: "What are the AI writing cleanup rules?",
    a: "Every guide includes 12 rules for catching common AI writing patterns - em dashes, hedging language, robotic rhythm, gift-wrapped endings, and more. Use them to clean up any AI-generated draft so it sounds human. Included on all plans, free and paid.",
  },
  {
    q: "How do I cancel or get a refund?",
    a: REFUND_ANSWER,
  },
  {
    q: "How do I contact support?",
    a: SUPPORT_ANSWER,
  },
]

// For billing page: same refund/support copy; billing-specific Pro/Agency answers stay in BillingPlansGrid
export { REFUND_ANSWER, SUPPORT_ANSWER }
