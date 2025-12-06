import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const METADATA = {
  name: "Secret Santa Chain",
  description: "Anonymous gifting network for the Farcaster community",
  bannerImageUrl: "https://secretsanta.quest/banner.png",
  iconImageUrl: "https://secretsanta.quest/icon.png",
  homeUrl: process.env.NEXT_PUBLIC_URL ?? "https://secretsanta.quest",
  splashBackgroundColor: "#DC2626",
  primaryCategory: "entertainment",
  screenshotUrls: [
    "https://secretsanta.quest/screen1.png",
    "https://secretsanta.quest/screen2.png",
    "https://secretsanta.quest/screen3.png",
  ],
  tags: ["secretsanta, christmas, santa, xmas, holidays"],
  webhookUrl:
    "https://api.neynar.com/f/app/239d30cd-d7eb-48f5-982c-370a27c4e6ac/event",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
