import { sdk } from "@farcaster/miniapp-sdk";

/**
 * Share utilities for Secret Santa Chain
 */

export interface ShareOptions {
  text: string;
  url?: string;
  embeds?: string[];
}

/**
 * Share a cast about joining a chain
 */
export async function shareJoinedChain(
  chainName: string,
  chainId: string
): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_URL || "https://secret-santa-chain.vercel.app";
  const shareUrl = `${baseUrl}?chain=${chainId}`;

  try {
    await sdk.actions.composeCast({
      text: `🎄 I just joined "${chainName}" on Secret Santa Chain! Join me in spreading holiday cheer through anonymous gifting. 🎁\n\n${shareUrl}`,
      embeds: [shareUrl],
    });
  } catch (error) {
    console.error("Failed to share:", error);
    // Fallback to clipboard
    await copyToClipboard(
      `I just joined "${chainName}" on Secret Santa Chain! ${shareUrl}`
    );
  }
}

/**
 * Share a cast about creating a chain
 */
export async function shareCreatedChain(
  chainName: string,
  chainId: string
): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_URL || "https://secret-santa-chain.vercel.app";
  const shareUrl = `${baseUrl}?chain=${chainId}`;

  try {
    await sdk.actions.composeCast({
      text: `🎅 I created a new Secret Santa Chain: "${chainName}"! Join us for anonymous gift giving this holiday season. 🎁✨\n\n${shareUrl}`,
      embeds: [shareUrl],
    });
  } catch (error) {
    console.error("Failed to share:", error);
    await copyToClipboard(
      `Join my Secret Santa Chain: "${chainName}"! ${shareUrl}`
    );
  }
}

/**
 * Share a cast about receiving a gift
 */
export async function shareReceivedGift(chainName: string): Promise<void> {
  try {
    await sdk.actions.composeCast({
      text: `🎁 I just received an anonymous gift from my Secret Santa in "${chainName}"! The mystery continues... 🎄✨\n\nJoin Secret Santa Chain to spread holiday joy!`,
    });
  } catch (error) {
    console.error("Failed to share:", error);
  }
}

/**
 * Share a cast about the reveal
 */
export async function shareReveal(
  chainName: string,
  secretSantaUsername?: string,
  gifteeUsername?: string
): Promise<void> {
  let text = `🎉 The big reveal! `;

  if (secretSantaUsername) {
    text += `My Secret Santa was @${secretSantaUsername}! `;
  }
  if (gifteeUsername) {
    text += `I was the Secret Santa for @${gifteeUsername}! `;
  }

  text += `\n\nThank you Secret Santa Chain for making this holiday season special! 🎄🎁`;

  try {
    await sdk.actions.composeCast({ text });
  } catch (error) {
    console.error("Failed to share:", error);
  }
}

/**
 * Share an invite to the app
 */
export async function shareInvite(): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_URL || "https://secret-santa-chain.vercel.app";

  try {
    await sdk.actions.composeCast({
      text: `🎅 Join me on Secret Santa Chain - the anonymous gifting network for Farcaster! Create or join gift chains, send anonymous gifts, and spread holiday cheer. 🎁🎄\n\n${baseUrl}`,
      embeds: [baseUrl],
    });
  } catch (error) {
    console.error("Failed to share:", error);
    await copyToClipboard(`Join Secret Santa Chain! ${baseUrl}`);
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * Generate a shareable link for a chain
 */
export function getChainShareLink(chainId: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_URL || "https://secret-santa-chain.vercel.app";
  return `${baseUrl}?chain=${chainId}`;
}
