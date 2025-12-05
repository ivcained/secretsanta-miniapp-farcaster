import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const METADATA = {
  name: "Secret Santa Chain",
  description:
    "Anonymous gifting network for the Farcaster community. Join gift chains, send anonymous gifts, and spread holiday cheer!",
  bannerImageUrl: "https://i.imgur.com/2bsV8mV.png",
  iconImageUrl: "https://i.imgur.com/brcnijg.png",
  homeUrl:
    process.env.NEXT_PUBLIC_URL ?? "https://secret-santa-chain.vercel.app",
  splashBackgroundColor: "#DC2626",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
