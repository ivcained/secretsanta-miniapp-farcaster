"use client";

import React from "react";
import { useChristmasSounds } from "~/lib/sounds";

interface ChainCardProps {
  chain: {
    id: string;
    name: string;
    description: string;
    theme: string;
    current_participants: number;
    max_participants: number;
    min_participants?: number;
    budget_min: number;
    budget_max: number;
    status: string;
    join_deadline: string;
    gift_deadline: string;
    reveal_date: string;
    creator_fid?: number;
  };
  currentUserFid?: number;
  onJoin?: (chainId: string) => void;
  onView?: (chainId: string) => void;
  onStartMatching?: (chainId: string) => void;
  isJoined?: boolean;
  isLoading?: boolean;
}

export function ChainCard({
  chain,
  currentUserFid,
  onJoin,
  onView,
  onStartMatching,
  isJoined,
  isLoading,
}: ChainCardProps) {
  const sounds = useChristmasSounds();

  const getCardGradient = (index: number = 0) => {
    const gradients = [
      "from-blue-100 to-blue-50",
      "from-green-100 to-green-50",
      "from-red-50 to-orange-50",
      "from-purple-50 to-pink-50",
    ];
    return gradients[index % gradients.length];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getThemeIcon = (theme: string) => {
    const icons: Record<string, string> = {
      General: "🏠",
      "Tech & Gadgets": "💻",
      "Art & Creativity": "🎨",
      "Books & Reading": "📚",
      Gaming: "🎮",
      "Food & Cooking": "🍳",
      Music: "🎵",
      "Crypto & NFTs": "💎",
      "Self Care": "🧘",
      "Home & Garden": "🏡",
      holiday: "🎄",
    };
    return icons[theme] || "🎁";
  };

  const spotsLeft = chain.max_participants - chain.current_participants;
  const isFull = spotsLeft <= 0;
  const isOpen = chain.status === "open";
  const isActive = chain.status === "active";
  const isCreator = currentUserFid && chain.creator_fid === currentUserFid;
  const minParticipants = chain.min_participants || 2;
  const canStartMatching =
    isCreator && isOpen && chain.current_participants >= minParticipants;

  const handleJoin = () => {
    if (onJoin && !isFull && !isLoading) {
      sounds.playClick();
      onJoin(chain.id);
    }
  };

  return (
    <div className="candy-cane-border">
      <div
        className={`candy-cane-border-inner p-4 bg-gradient-to-b ${getCardGradient()}`}
      >
        {/* Header with icon and title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center text-2xl">
            {getThemeIcon(chain.theme)}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-lg leading-tight">
              {chain.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {chain.theme || "holiday"}
              </span>
              <span className="text-xs font-semibold text-gray-600">
                ${chain.budget_min}-${chain.budget_max}
              </span>
              <span
                className={`badge-open ${
                  chain.status === "active" ? "badge-active" : ""
                }`}
              >
                {chain.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats with Christmas icons */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">🛷</span>
            <span className="text-gray-600">Participants:</span>
            <span className="font-bold text-gray-800">
              {chain.current_participants}/{chain.max_participants}
            </span>
            {!isFull && isOpen && (
              <span className="text-green-600 text-xs">
                ({spotsLeft} spots left)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">🎄</span>
            <span className="text-gray-600">Join by</span>
            <span className="font-semibold text-gray-800">
              {formatDate(chain.join_deadline)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">🎁</span>
            <span className="text-gray-600">Gift by</span>
            <span className="font-semibold text-gray-800">
              {formatDate(chain.gift_deadline)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">🔔</span>
            <span className="text-gray-600">Reveal</span>
            <span className="font-semibold text-gray-800">
              {formatDate(chain.reveal_date)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Start Matching Button for Creator */}
          {canStartMatching && onStartMatching && (
            <button
              onClick={() => {
                sounds.playClick();
                onStartMatching(chain.id);
              }}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚡</span>
                  Starting...
                </span>
              ) : (
                <>
                  <span>⚡</span>
                  <span>
                    Start Matching ({chain.current_participants} ready)
                  </span>
                </>
              )}
            </button>
          )}

          {/* Join Button */}
          {isOpen && !isJoined && onJoin && (
            <button
              onClick={handleJoin}
              disabled={isFull || isLoading}
              className={`w-full btn-christmas py-3 text-base ${
                isFull ? "opacity-50 cursor-not-allowed" : "pulse-glow"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🎄</span>
                  Joining...
                </span>
              ) : isFull ? (
                "Chain Full"
              ) : (
                "🎅 Join Chain"
              )}
            </button>
          )}

          {/* Already Joined Badge */}
          {isJoined && (
            <div className="w-full py-3 text-center bg-green-100 rounded-full text-green-700 font-semibold flex items-center justify-center gap-2">
              <span>✓</span>
              <span>You're In!</span>
              <span>🎄</span>
            </div>
          )}

          {/* Active Chain Message */}
          {isActive && !isJoined && (
            <div className="w-full py-3 text-center bg-purple-100 rounded-full text-purple-700 font-semibold flex items-center justify-center gap-2">
              <span>🎁</span>
              <span>Matching Complete - Gifting in Progress!</span>
            </div>
          )}

          {/* View Details Button */}
          {onView && !isOpen && (
            <button
              onClick={() => {
                sounds.playClick();
                onView(chain.id);
              }}
              className="w-full btn-christmas-green btn-christmas py-3 text-base"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
