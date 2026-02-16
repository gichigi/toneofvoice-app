import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  linkToHome?: boolean
}

export default function Logo({ size = "md", linkToHome = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-auto",
    md: "h-8 w-auto",
    lg: "h-10 w-auto",
  }

  const logoContent = (
    <img
      src="/wordmark.svg"
      alt="Tone of Voice"
      className={sizeClasses[size]}
    />
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