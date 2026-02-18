import type React from "react"
import { Geist } from "next/font/google"
import { playfairDisplay } from "@/lib/fonts"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Analytics } from "@vercel/analytics/next"
import { PostHogProvider } from "@/components/PostHogProvider"
import { AuthProvider } from "@/components/AuthProvider"

const geistSans = Geist({ subsets: ["latin"], display: "swap" })

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://toneofvoice.app'),
  title: "Define your brand tone of voice | Tone of Voice",
  description: "Generate a professional tone of voice guide - traits, rules, and examples - tailored to your brand.",
  keywords: 'tone of voice, brand voice, brand guidelines, content strategy, writing guide, brand identity, brand communication',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  generator: 'v0.dev',
  authors: [{ name: 'Tone of Voice' }],
  creator: 'Tone of Voice',
  publisher: 'Tone of Voice',
  openGraph: {
    title: "Define your brand tone of voice | Tone of Voice",
    description: "Generate a professional tone of voice guide - traits, rules, and examples - tailored to your brand.",
    url: 'https://toneofvoice.app',
    siteName: 'Tone of Voice',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://toneofvoice.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tone of Voice - Define your brand tone of voice in minutes',
        type: 'image/png',
        secureUrl: 'https://toneofvoice.app/og-image.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Define your brand tone of voice | Tone of Voice",
    description: "Generate a professional tone of voice guide - traits, rules, and examples - tailored to your brand.",
    creator: '@tahigichigi',
    site: '@toneofvoiceapp',
    images: ['https://toneofvoice.app/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code-here',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-943197631"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', 'AW-943197631');
            `,
          }}
        />
        
        {/* Explicit meta tags for compatibility */}
        <title>Define your brand tone of voice | Tone of Voice</title>
        <meta name="description" content="Generate a professional tone of voice guide - traits, rules, and examples - tailored to your brand." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="canonical" href="https://toneofvoice.app" />

        {/* WebPage Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "@id": "https://toneofvoice.app#webpage",
              "name": "Tone of Voice - Define your brand tone of voice",
              "description": "Generate a professional tone of voice guide - traits, rules, and examples - tailored to your brand.",
              "url": "https://toneofvoice.app",
              "primaryImageOfPage": "https://toneofvoice.app/og-image.png",
              "inLanguage": "en",
              "isPartOf": {
                "@id": "https://toneofvoice.app#website"
              },
              "mainEntity": {
                "@id": "https://toneofvoice.app#software"
              },
              "datePublished": "2024-01-01",
              "dateModified": "2024-11-04"
            })
          }}
        />
        
        {/* WebSite Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://toneofvoice.app#website",
              "name": "Tone of Voice",
              "url": "https://toneofvoice.app",
              "description": "Generate a professional tone of voice guide - traits, rules, and examples - tailored to your brand.",
            })
          }}
        />
        
        {/* Schema.org markup for SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "@id": "https://toneofvoice.app#software",
              "name": "Tone of Voice",
              "description": "Generate a professional tone of voice guide - traits, rules, and examples - tailored to your brand.",
              "brand": {
                "@type": "Brand",
                "name": "Tone of Voice"
              },
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "url": "https://toneofvoice.app",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "creator": {
                "@id": "https://toneofvoice.app#organization"
              }
            })
          }}
        />
        
        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What if I don't have a brand yet?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our tool helps you define your brand voice from scratch. Just answer a few questions about your audience and goals."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How long does it take?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most tone of voice guides are generated in under 2 minutes. You can review, download in multiple formats, and share with your team."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What formats can I download?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Your tone of voice guide is available in PDF, Word, HTML, and Markdown formats for easy sharing and integration with any workflow."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What's included in your tone of voice guide?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You'll get your tone of voice defined, up to 99+ writing rules, voice traits, and practical examples tailored to your brand."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I edit my tone of voice guide?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. Once generated, you can download Word, HTML, or Markdown, then edit however you like before saving or sharing."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is this better than hiring a copywriter?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We deliver 90% of what most brands need in minutes instead of weeks, at a fraction of the cost of hiring a professional writer."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I share with my team?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! Share your tone of voice guide with your entire team. You receive a permanent access link plus downloadable files."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do I contact support?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Email us at support@toneofvoice.app for any questions. We typically respond within 24 hours on business days."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do I get a refund?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We offer a 30-day money-back guarantee. Simply email support@toneofvoice.app within 30 days of your purchase for a full refund. No questions asked - we process refunds quickly, usually within 1-2 business days."
                  }
                }
              ]
            })
          }}
        />
        
        {/* HowTo Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": "How to Define Your Brand Tone of Voice",
              "description": "Generate a comprehensive tone of voice guide with just a few clicks",
              "step": [
                {
                  "@type": "HowToStep",
                  "name": "Answer a few questions",
                  "text": "Tell us about your brand or let our AI extract details from your website"
                },
                {
                  "@type": "HowToStep",
                  "name": "Get personalized voice guide",
                  "text": "Receive a tailored tone of voice guide with traits, rules, and examples for your brand"
                },
                {
                  "@type": "HowToStep",
                  "name": "Export and share",
                  "text": "Download in multiple formats: PDF, Word, HTML, or Markdown for any workflow"
                }
              ]
            })
          }}
        />
        
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://toneofvoice.app#organization",
              "name": "Tone of Voice",
              "url": "https://toneofvoice.app",
              "logo": {
                "@type": "ImageObject",
                "url": "https://toneofvoice.app/logo-wordmark.svg",
                "width": 184,
                "height": 32
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "support@toneofvoice.app",
                "contactType": "customer support"
              },
              "sameAs": [
                "https://twitter.com/toneofvoiceapp"
              ]
            })
          }}
        />
      </head>
      <body className={`${geistSans.className} ${playfairDisplay.variable} overflow-x-hidden`}>        
        <PostHogProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light">
              {children}
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
          <Analytics />
        </PostHogProvider>
      </body>
    </html>
  )
}