import { Anton, Cormorant_Garamond, Fraunces, Inter } from "next/font/google";

// Each display face is imported only by the storefront that uses it, so a
// route preloads one display font (LCP) instead of all three.
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", style: ["normal", "italic"] });
export const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
export const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
