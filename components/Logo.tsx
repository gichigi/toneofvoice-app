import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  linkToHome?: boolean
}

export default function Logo({ size = "md", linkToHome = true }: LogoProps) {
  const sizeClasses = {
    sm: {
      logo: "h-6",
      text: "text-base",
      gap: "gap-2",
    },
    md: {
      logo: "h-8",
      text: "text-xl",
      gap: "gap-3",
    },
    lg: {
      logo: "h-10",
      text: "text-2xl",
      gap: "gap-3",
    },
  }

  const logoContent = (
    <div className={`group flex items-center ${sizeClasses[size].gap}`}>
      <img
        src="/tone_of_voice_logo.svg"
        alt="Tone of Voice"
        className={`${sizeClasses[size].logo} w-auto`}
      />
      <span className={`${sizeClasses[size].text} font-semibold text-gray-900 dark:text-gray-100`}>
        Tone of Voice
      </span>
    </div>
  )

  if (linkToHome) {
    return (
      <Link href="/" className="flex items-center min-w-0 whitespace-nowrap">
        {logoContent}
      </Link>
    )
  }

  return logoContent
} 