// Design system: see DESIGN_SYSTEM.md for typography/spacing decisions

interface StyleGuideHeaderProps {
  brandName: string
  guideType: 'core' | 'complete'
  date?: string
  showPreviewBadge?: boolean
}

export function StyleGuideHeader({ brandName, guideType, date, showPreviewBadge }: StyleGuideHeaderProps) {
  const formattedDate = date || new Date().toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="py-20 md:py-24 px-8 md:px-12 border-b bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Preview badge - subtle if present */}
        {showPreviewBadge && (
          <div className="mb-6">
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200">
              Preview
            </span>
          </div>
        )}
        
        {/* Brand name - large display font, premium feel */}
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-gray-900" style={{ fontFamily: 'var(--font-display), serif' }}>
          {brandName}
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 mb-6 font-light" style={{ fontFamily: 'var(--font-display), serif' }}>
          Brand Voice & Style Guide
        </p>
        
        {/* Metadata - understated */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-sm text-gray-500">
          {!showPreviewBadge && (
            <span className="font-medium">
              {guideType === 'complete' ? 'The Complete Style Guide' : 'Core Style Guide'}
            </span>
          )}
          <span className="hidden md:inline">•</span>
          <span>Created on {formattedDate}</span>
        </div>
      </div>
    </div>
  )
} 