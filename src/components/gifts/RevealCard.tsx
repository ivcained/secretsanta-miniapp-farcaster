"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/Button";
import { sdk } from "@farcaster/miniapp-sdk";

interface RevealCardProps {
  gift: {
    id: string;
    chain_name?: string;
    message?: string;
    gift_type?: string;
    gift_value?: string;
    is_giver: boolean;
    sender?: {
      fid: number;
      username: string;
      display_name?: string;
      pfp_url?: string;
    };
    recipient?: {
      fid: number;
      username: string;
      display_name?: string;
      pfp_url?: string;
    };
  };
  onShare?: () => void;
}

export function RevealCard({ gift, onShare }: RevealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const otherPerson = gift.is_giver ? gift.recipient : gift.sender;
  const roleText = gift.is_giver ? "You gifted to" : "Your Secret Santa was";
  const emoji = gift.is_giver ? "🎁" : "🎅";

  const handleViewProfile = () => {
    if (otherPerson?.fid) {
      sdk.actions.viewProfile({ fid: otherPerson.fid });
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-green-50 border-2 border-red-200 rounded-xl p-4 shadow-lg">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">{emoji}</div>
        <p className="text-sm text-muted-foreground">{roleText}</p>

        {otherPerson && (
          <button
            onClick={handleViewProfile}
            className="flex items-center justify-center gap-2 mx-auto mt-2 hover:opacity-80 transition-opacity"
          >
            {otherPerson.pfp_url && (
              <img
                src={otherPerson.pfp_url}
                alt={otherPerson.username}
                className="w-12 h-12 rounded-full border-2 border-white shadow"
              />
            )}
            <div className="text-left">
              <p className="font-bold text-lg">@{otherPerson.username}</p>
              {otherPerson.display_name && (
                <p className="text-sm text-muted-foreground">
                  {otherPerson.display_name}
                </p>
              )}
            </div>
          </button>
        )}
      </div>

      {gift.message && (
        <div
          className={`bg-white/80 rounded-lg p-3 mb-3 ${
            isExpanded ? "" : "cursor-pointer"
          }`}
          onClick={() => !isExpanded && setIsExpanded(true)}
        >
          <p className="text-xs text-muted-foreground mb-1">
            {gift.is_giver ? "Your message:" : "Their message:"}
          </p>
          <p
            className={`text-sm italic ${
              !isExpanded && gift.message.length > 100 ? "line-clamp-2" : ""
            }`}
          >
            &quot;{gift.message}&quot;
          </p>
          {!isExpanded && gift.message.length > 100 && (
            <button className="text-xs text-primary mt-1">Read more...</button>
          )}
        </div>
      )}

      {gift.gift_type && (
        <div className="flex gap-2 text-xs mb-3">
          <span className="bg-white/80 px-2 py-1 rounded">
            {gift.gift_type}
          </span>
          {gift.gift_value && (
            <span className="bg-white/80 px-2 py-1 rounded">
              {gift.gift_value}
            </span>
          )}
        </div>
      )}

      {gift.chain_name && (
        <p className="text-xs text-muted-foreground text-center mb-3">
          From: {gift.chain_name}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleViewProfile}
          className="flex-1 bg-white text-foreground hover:bg-gray-100"
        >
          View Profile
        </Button>
        {onShare && (
          <Button onClick={onShare} className="flex-1">
            Share 🎉
          </Button>
        )}
      </div>
    </div>
  );
}
