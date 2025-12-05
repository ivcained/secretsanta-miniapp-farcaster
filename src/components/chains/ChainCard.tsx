"use client";

import React from "react";
import { Button } from "~/components/ui/Button";

interface ChainCardProps {
  chain: {
    id: string;
    name: string;
    description: string;
    theme: string;
    current_participants: number;
    max_participants: number;
    budget_min: number;
    budget_max: number;
    status: string;
    join_deadline: string;
    gift_deadline: string;
    reveal_date: string;
  };
  onJoin?: (chainId: string) => void;
  onView?: (chainId: string) => void;
  isJoined?: boolean;
  isLoading?: boolean;
}

export function ChainCard({
  chain,
  onJoin,
  onView,
  isJoined,
  isLoading,
}: ChainCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-green-100 text-green-800",
      matching: "bg-yellow-100 text-yellow-800",
      active: "bg-blue-100 text-blue-800",
      revealing: "bg-purple-100 text-purple-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getThemeEmoji = (theme: string) => {
    const emojis: Record<string, string> = {
      General: "🎁",
      "Tech & Gadgets": "💻",
      "Art & Creativity": "🎨",
      "Books & Reading": "📚",
      Gaming: "🎮",
      "Food & Cooking": "🍳",
      Music: "🎵",
      "Crypto & NFTs": "💎",
      "Self Care": "🧘",
      "Home & Garden": "🏡",
    };
    return emojis[theme] || "🎁";
  };

  const spotsLeft = chain.max_participants - chain.current_participants;
  const isFull = spotsLeft <= 0;
  const isOpen = chain.status === "open";

  return (
    <div className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getThemeEmoji(chain.theme)}</span>
          <h3 className="font-semibold text-foreground">{chain.name}</h3>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            chain.status
          )}`}
        >
          {chain.status}
        </span>
      </div>

      {chain.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {chain.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
        <span className="bg-gray-100 px-2 py-1 rounded">{chain.theme}</span>
        <span className="bg-gray-100 px-2 py-1 rounded">
          ${chain.budget_min}-${chain.budget_max}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm mb-3">
        <div>
          <span className="text-muted-foreground">Participants: </span>
          <span
            className={`font-medium ${
              isFull ? "text-red-600" : "text-foreground"
            }`}
          >
            {chain.current_participants}/{chain.max_participants}
          </span>
          {!isFull && isOpen && (
            <span className="text-green-600 ml-1">
              ({spotsLeft} spots left)
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground mb-4">
        <div>
          <span className="block font-medium text-foreground">Join by</span>
          {formatDate(chain.join_deadline)}
        </div>
        <div>
          <span className="block font-medium text-foreground">Gift by</span>
          {formatDate(chain.gift_deadline)}
        </div>
        <div>
          <span className="block font-medium text-foreground">Reveal</span>
          {formatDate(chain.reveal_date)}
        </div>
      </div>

      <div className="flex gap-2">
        {onView && (
          <Button
            onClick={() => onView(chain.id)}
            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            View Details
          </Button>
        )}
        {isOpen && !isJoined && onJoin && (
          <Button
            onClick={() => onJoin(chain.id)}
            disabled={isFull || isLoading}
            className="flex-1"
          >
            {isLoading ? "Joining..." : isFull ? "Full" : "Join Chain"}
          </Button>
        )}
        {isJoined && (
          <span className="flex-1 text-center py-2 text-green-600 font-medium">
            ✓ Joined
          </span>
        )}
      </div>
    </div>
  );
}
