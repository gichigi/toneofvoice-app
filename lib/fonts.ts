import { Playfair_Display } from "next/font/google"

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "700", "900"],
})
