import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StyleGuideCoverProps {
  brandName: string
  guideType?: 'core' | 'complete' | 'style_guide'
  date?: string
  showPreviewBadge?: boolean
  className?: string
}

// Eyebrow: short label above title (avoid "Brand Identity" – redundant/wrong for voice docs)
const COVER_EYEBROW = "Brand Voice & Content Style"

export function StyleGuideCover({ 
  brandName, 
  guideType, 
  date, 
  showPreviewBadge,
  className 
}: StyleGuideCoverProps) {
  const formattedDate = date || new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const displayName = (brandName || "").trim() || "Brand Voice Guidelines"

  return (
    <div className={cn("min-h-[80vh] flex flex-col justify-center px-12 md:px-20 py-24 bg-white relative overflow-hidden", className)}>
      {/* Decorative background element - subtle animated pattern */}
      <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-gray-50/50 via-gray-50/30 to-transparent pointer-events-none animate-pulse" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />
      
      <div className="relative z-10 max-w-3xl space-y-8">
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          {showPreviewBadge && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200 mb-4 hover:bg-gray-100 transition-all duration-300 animate-in fade-in slide-in-from-left-4 duration-500">
              Preview Mode
            </Badge>
          )}
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
            {COVER_EYEBROW}
          </p>
        </div>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <h1 
            className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 leading-[0.9] transition-all duration-500 hover:tracking-tighter hover:scale-[1.01] origin-left" 
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            {displayName}
          </h1>
          <div className="h-1 w-24 bg-gray-900 animate-in slide-in-from-left-4 duration-700 delay-500 rounded-full" />
        </div>

        <div className="pt-12 space-y-1 text-gray-500 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
          <p className="text-sm transition-colors duration-300 hover:text-gray-600">Generated on {formattedDate}</p>
          <p className="text-sm font-medium text-gray-900 mt-2 transition-all duration-300 hover:translate-x-1">
            Style Guide
          </p>
        </div>
      </div>
    </div>
  )
}
