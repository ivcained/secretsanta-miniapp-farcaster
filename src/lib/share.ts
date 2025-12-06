/**
 * Share utilities for Secret Santa Chain
 * Uses MiniKit's useComposeCast hook for better integration
 */

export interface ShareOptions {
  text: string;
  url?: string;
  embeds?: [] | [string] | [string, string];
}

// App URL for embeds
const APP_URL = process.env.NEXT_PUBLIC_URL || "https://secretsanta.quest";

/**
 * Get share parameters for joining a chain
 */
export function getJoinChainShareParams(
  chainName: string,
  chainId: string
): ShareOptions {
  const shareUrl = `${APP_URL}?chain=${chainId}`;

  return {
    text: `🎄✨ I just joined the "${chainName}" Secret Santa chain!\n\nSpread some holiday magic with anonymous gifting on Farcaster. Who's in? 🎁\n\n👇 Join now:`,
    embeds: [shareUrl],
  };
}

/**
 * Get share parameters for creating a chain
 */
export function getCreateChainShareParams(
  chainName: string,
  chainId: string
): ShareOptions {
  const shareUrl = `${APP_URL}?chain=${chainId}`;

  return {
    text: `🎅🎄 I just created a Secret Santa chain: "${chainName}"!\n\nJoin me for some anonymous gift-giving fun this holiday season. Let's spread the joy! 🎁✨\n\n👇 Be my Secret Santa:`,
    embeds: [shareUrl],
  };
}

/**
 * Legacy function - Share a cast about joining a chain
 * @deprecated Use getJoinChainShareParams with useComposeCast hook instead
 */
export async function shareJoinedChain(
  chainName: string,
  chainId: string,
  composeCast?: (params: ShareOptions) => void
): Promise<void> {
  const params = getJoinChainShareParams(chainName, chainId);

  if (composeCast) {
    composeCast(params);
  } else {
    // Fallback to clipboard
    await copyToClipboard(`${params.text}\n${params.embeds?.[0] || ""}`);
  }
}

/**
 * Legacy function - Share a cast about creating a chain
 * @deprecated Use getCreateChainShareParams with useComposeCast hook instead
 */
export async function shareCreatedChain(
  chainName: string,
  chainId: string,
  composeCast?: (params: ShareOptions) => void
): Promise<void> {
  const params = getCreateChainShareParams(chainName, chainId);

  if (composeCast) {
    composeCast(params);
  } else {
    // Fallback to clipboard
    await copyToClipboard(`${params.text}\n${params.embeds?.[0] || ""}`);
  }
}

/**
 * Get share parameters for receiving a gift
 */
export function getReceivedGiftShareParams(chainName: string): ShareOptions {
  return {
    text: `🎁✨ Just received an anonymous gift from my Secret Santa in "${chainName}"!\n\nThe mystery continues... Who could it be? 🤔🎄\n\nJoin Secret Santa Chain and spread some holiday magic!`,
    embeds: [APP_URL],
  };
}

/**
 * Get share parameters for the reveal
 */
export function getRevealShareParams(
  chainName: string,
  secretSantaUsername?: string,
  gifteeUsername?: string
): ShareOptions {
  let text = `🎉🎄 The big reveal is here!\n\n`;

  if (secretSantaUsername) {
    text += `My Secret Santa was @${secretSantaUsername}! Thank you for the amazing gift! 🙏\n`;
  }
  if (gifteeUsername) {
    text += `I was the Secret Santa for @${gifteeUsername}! Hope you loved it! 🎁\n`;
  }

  text += `\nSecret Santa Chain made this holiday season extra special! ✨`;

  return {
    text,
    embeds: [APP_URL],
  };
}

/**
 * Get share parameters for inviting others
 */
export function getInviteShareParams(): ShareOptions {
  return {
    text: `🎅✨ Discover Secret Santa Chain - the anonymous gifting network for Farcaster!\n\nCreate or join gift chains, send anonymous gifts, and spread holiday cheer with your frens. 🎁🎄\n\n👇 Join the fun:`,
    embeds: [APP_URL],
  };
}

/**
 * Legacy function - Share a cast about receiving a gift
 * @deprecated Use getReceivedGiftShareParams with useComposeCast hook instead
 */
export async function shareReceivedGift(
  chainName: string,
  composeCast?: (params: ShareOptions) => void
): Promise<void> {
  const params = getReceivedGiftShareParams(chainName);

  if (composeCast) {
    composeCast(params);
  } else {
    await copyToClipboard(params.text);
  }
}

/**
 * Legacy function - Share a cast about the reveal
 * @deprecated Use getRevealShareParams with useComposeCast hook instead
 */
export async function shareReveal(
  chainName: string,
  secretSantaUsername?: string,
  gifteeUsername?: string,
  composeCast?: (params: ShareOptions) => void
): Promise<void> {
  const params = getRevealShareParams(
    chainName,
    secretSantaUsername,
    gifteeUsername
  );

  if (composeCast) {
    composeCast(params);
  } else {
    await copyToClipboard(params.text);
  }
}

/**
 * Legacy function - Share an invite to the app
 * @deprecated Use getInviteShareParams with useComposeCast hook instead
 */
export async function shareInvite(
  composeCast?: (params: ShareOptions) => void
): Promise<void> {
  const params = getInviteShareParams();

  if (composeCast) {
    composeCast(params);
  } else {
    await copyToClipboard(`${params.text}\n${APP_URL}`);
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
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://secretsanta.quest";
  return `${baseUrl}?chain=${chainId}`;
}
