"use client";

import React, { useState } from "react";
import { Button } from "./Button";
import {
  shareJoinedChain,
  shareCreatedChain,
  shareInvite,
  shareReveal,
  copyToClipboard,
  getChainShareLink,
} from "~/lib/share";

type ShareType = "joined" | "created" | "invite" | "reveal" | "link";

interface ShareButtonProps {
  type: ShareType;
  chainId?: string;
  chainName?: string;
  secretSantaUsername?: string;
  gifteeUsername?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ShareButton({
  type,
  chainId,
  chainName,
  secretSantaUsername,
  gifteeUsername,
  className,
  children,
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      switch (type) {
        case "joined":
          if (chainName && chainId) {
            await shareJoinedChain(chainName, chainId);
          }
          break;
        case "created":
          if (chainName && chainId) {
            await shareCreatedChain(chainName, chainId);
          }
          break;
        case "invite":
          await shareInvite();
          break;
        case "reveal":
          if (chainName) {
            await shareReveal(chainName, secretSantaUsername, gifteeUsername);
          }
          break;
        case "link":
          if (chainId) {
            const link = getChainShareLink(chainId);
            const success = await copyToClipboard(link);
            if (success) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }
          break;
      }
    } catch (error) {
      console.error("Share failed:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const getButtonText = () => {
    if (isSharing) return "Sharing...";
    if (copied) return "Copied! ✓";

    switch (type) {
      case "joined":
        return "🎉 Share";
      case "created":
        return "📢 Share Chain";
      case "invite":
        return "💌 Invite Friends";
      case "reveal":
        return "🎊 Share Reveal";
      case "link":
        return "🔗 Copy Link";
      default:
        return "Share";
    }
  };

  return (
    <Button onClick={handleShare} disabled={isSharing} className={className}>
      {children || getButtonText()}
    </Button>
  );
}
