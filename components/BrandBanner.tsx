import React from "react"

export default function BrandBanner() {
  return (
    <section className="w-full py-10 px-4 bg-gray-50 border-t border-b border-gray-200 shadow-sm flex flex-col items-center">
      <h3 className="text-xs font-medium text-gray-500 mb-8 tracking-widest uppercase text-center">
        Tone of voice rules from
      </h3>
      <div className="w-full max-w-6xl mx-auto">
        {/* Desktop banner - showing logos directly */}
        <div className="hidden md:flex justify-between items-center">
          <img 
            src="/logos/Google.svg" 
            alt="Google" 
            className="h-10 w-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/apple.svg" 
            alt="Apple" 
            className="h-10 w-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/spotify.svg" 
            alt="Spotify" 
            className="h-10 w-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/mailchimp.svg" 
            alt="Mailchimp" 
            className="h-14 w-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/intuit.svg" 
            alt="Intuit" 
            className="h-10 w-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/bbc.svg" 
            alt="BBC" 
            className="h-10 w-auto filter grayscale opacity-80" 
          />
        </div>

        {/* Mobile banner - stacked in a grid */}
        <div className="md:hidden grid grid-cols-3 gap-8 mx-auto w-full max-w-xs">
          <img 
            src="/logos/Google.svg" 
            alt="Google" 
            className="w-auto h-8 mx-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/apple.svg" 
            alt="Apple" 
            className="w-auto h-8 mx-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/spotify.svg" 
            alt="Spotify" 
            className="w-auto h-8 mx-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/mailchimp.svg" 
            alt="Mailchimp" 
            className="w-auto h-10 mx-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/intuit.svg" 
            alt="Intuit" 
            className="w-auto h-8 mx-auto filter grayscale opacity-80" 
          />
          <img 
            src="/logos/bbc.svg" 
            alt="BBC" 
            className="w-auto h-8 mx-auto filter grayscale opacity-80" 
          />
        </div>
      </div>
    </section>
  )
} 