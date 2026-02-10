/**
 * Landing page copy and structured data.
 * Single source of truth for static section content.
 */

import type React from "react"
import type { LucideIcon } from "lucide-react"
import {
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
  { number: 25, suffix: "", title: "Writing rules", description: "Clear, actionable rules (tone, grammar, format) in your guide—ready for AI and your team.", iconBg: "bg-blue-100", delay: "0ms" },
  { number: 3, suffix: "", title: "Brand voice traits", description: "Complete definitions, do's, and don'ts customised for your brand.", iconBg: "bg-purple-100", delay: "100ms" },
  { number: 10, suffix: "", title: "Brand terms & phrases", description: "Preferred words and phrases so every piece of content stays on-brand.", iconBg: "bg-green-100", delay: "200ms" },
  { number: 5, suffix: "", title: "Before/After examples", description: "Your brand voice applied to real content types (e.g. headlines, emails).", iconBg: "bg-orange-100", delay: "300ms" },
  { number: 3, suffix: "", title: "Export formats", description: "PDF to share, Word to edit, Markdown for AI tools.", iconBg: "bg-indigo-100", delay: "400ms" },
  { number: 5, suffix: "", title: "Minutes to complete", description: "No prompting, no templates. Enter a URL or short description to start.", iconBg: "bg-pink-100", delay: "500ms" },
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
  { feature: "Brand voice & style guidelines", templates: "check", chatgpt: "check", aisg: "check" },
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
  { title: "Enter website or description", body: "Paste your site URL or a short brand description. We use it to match your voice and tone.", accent: "border-t-blue-300", numBg: "bg-blue-100 text-blue-700" },
  { title: "Generate your guidelines", body: "We build your style guide—voice traits, writing rules, and examples tailored to your brand.", accent: "border-t-purple-300", numBg: "bg-purple-100 text-purple-700" },
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
  { icon: FileCheck, title: "Complete style guidelines", desc: "Detailed guidelines with brand voice, do's/don'ts, and examples to align your entire team" },
  { icon: UserCheck, title: "Team alignment", desc: "Everyone writes in your brand's voice, creating consistent experiences at every touchpoint" },
  { icon: Shield, title: "Strong brand identity", desc: "Every message reinforces who you are, making your brand instantly recognizable and memorable" },
  { icon: Heart, title: "Customer trust", desc: "Clear, consistent voice builds credibility and makes customers feel confident choosing you" },
  { icon: Zap, title: "Faster content creation", desc: "Guidelines eliminate guesswork, so your team spends less time debating and more time creating" },
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
export interface PricingTier {
  id: string
  name: string
  price: number
  priceLabel: string
  sublabel: string
  features: string[]
  cta: string
  ctaSubtext: string
  borderClass: string
  gradientClass: string
  badge?: string
  highlight?: boolean
  isPro?: boolean
  isTeam?: boolean
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    priceLabel: "$0",
    sublabel: "Free forever",
    features: [
      "About your brand, How to use, Your audience",
      "Content guidelines, Brand voice (with do's and don'ts)",
      "Edit every section in the app",
      "Export as PDF",
    ],
    cta: "Get started free",
    ctaSubtext: "Best for starting out",
    borderClass: "border-2 border-gray-300",
    gradientClass: "from-gray-50 to-background",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    priceLabel: "$29",
    sublabel: "per month",
    features: [
      "Everything in Starter, plus:",
      "Style Rules, Before/After, Word List",
      "5 style guides (saved to your account)",
      "AI assist to refine copy",
      "PDF & Word export",
    ],
    cta: "Get Pro",
    ctaSubtext: "Best for professionals",
    borderClass: "border-4 border-indigo-600",
    gradientClass: "from-indigo-50 to-background",
    badge: "Most Popular",
    highlight: true,
    isPro: true,
  },
  {
    id: "team",
    name: "Team",
    price: 79,
    priceLabel: "$79",
    sublabel: "per month",
    features: [
      "Everything in Pro, plus:",
      "99 style guides (saved to your account)",
      "5 seats included",
      "Collaboration (shared guides, team access)",
    ],
    cta: "Get Team",
    ctaSubtext: "Best for agencies",
    borderClass: "border-2 border-blue-500",
    gradientClass: "from-blue-50 to-background",
    highlight: false,
    isTeam: true,
  },
]

// --- FAQ ---
export interface FaqItem {
  q: string
  a: string | React.ReactNode
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What's in the free preview?",
    a: "You get a full preview of your style guide: About, Audience, Content Guidelines, Brand Voice, plus a sample of what Style Rules and Before/After look like. Export the preview as PDF. Upgrade to edit, add all sections, and export without limits.",
  },
  {
    q: "How do I get the full guide?",
    a: "Subscribe to Pro or Team. You generate once; then you can edit any section, use AI to refine copy, and export as PDF or Word. Your guide is saved to your account and auto-saves as you edit.",
  },
  {
    q: "Can I edit my style guide?",
    a: "Yes. On Pro or Team you can edit every section in the app, use AI assist to rewrite parts, and export as PDF, Word, or Markdown. Edits auto-save.",
  },
  {
    q: "What export formats do I get?",
    a: "PDF (to share), Word (to edit offline), and Markdown (for AI tools). Available on Pro and Team.",
  },
  {
    q: "How long does it take?",
    a: "Most guides are generated in a few minutes. You can preview immediately, then subscribe to unlock editing and full exports.",
  },
  {
    q: "What's included in the guide?",
    a: "About your brand, audience, content guidelines, brand voice traits (with do's/don'ts), 25 writing rules, before/after examples, and preferred terms. Pro/Team also get full editing and AI assist.",
  },
  {
    q: "How do I cancel or get a refund?",
    a: <span>Manage subscription and billing in your account. We offer a 30-day money-back guarantee—email <a href="mailto:support@aistyleguide.com?subject=Refund%20Request%20-%20Style%20Guide%20Purchase&body=Hi%20AIStyleGuide%20Support%20Team,%0A%0AI%20would%20like%20to%20request%20a%20refund%20for%20my%20style%20guide%20purchase.%0A%0APurchase%20Details:%0A- Guide:%20Style%20Guide%0A- Purchase%20Date:%20[Date]%0A- Email%20used%20for%20purchase:%20[Email]%0A%0AReason%20for%20refund%20(optional):%20%0A%0AThanks,%0A[Your%20Name]" className="text-primary hover:underline">support@aistyleguide.com</a> within 30 days of purchase for a full refund.</span>,
  },
  {
    q: "How do I contact support?",
    a: <span>Email us at <a href="mailto:support@aistyleguide.com?subject=Support%20Request&body=Hello%20AIStyleGuide%20Support%20Team,%0A%0AI%20need%20help%20with:%0A%0A[Please%20describe%20your%20issue%20here]%0A%0AThanks,%0A[Your%20Name]" className="text-primary hover:underline">support@aistyleguide.com</a>, 24 hours on business days.</span>,
  },
]
