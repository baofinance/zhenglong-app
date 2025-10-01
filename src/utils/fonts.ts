import { Geo, Space_Grotesk } from "next/font/google";

export const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-geo",
  preload: true,
  fallback: ["Arial", "sans-serif"],
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-space-grotesk",
  preload: true,
  fallback: ["Arial", "sans-serif"],
});
