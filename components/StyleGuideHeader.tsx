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
    <div className="p-8 border-b bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          {!showPreviewBadge && (
            <div className="text-base text-gray-500 tracking-wide font-semibold">
              {guideType === 'complete' ? 'The Complete Style Guide' : 'Core Style Guide'}
            </div>
          )}
          {showPreviewBadge && (
            <span className="inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
              Preview
            </span>
          )}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900">
          {brandName}
          <br />
          Brand Voice & Style Guide
        </h1>
        <p className="text-gray-500 text-base">Created on {formattedDate}</p>
      </div>
    </div>
  )
} 