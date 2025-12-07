"use client";

import React, { useState, useEffect } from "react";

interface GiftLogEntry {
  id: string;
  chain_id: string;
  gift_type: string;
  amount?: number;
  currency?: string;
  message?: string;
  is_revealed: boolean;
  sent_at: string;
  sender?: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  recipient?: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
  chain?: {
    id: string;
    name: string;
    status: string;
  };
}

interface GiftLogProps {
  chainId?: string; // Optional: filter by chain
  showOnlyRevealed?: boolean;
}

export function GiftLog({ chainId, showOnlyRevealed = true }: GiftLogProps) {
  const [gifts, setGifts] = useState<GiftLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGiftLog = async () => {
      try {
        // Fetch all gifts - we'll filter revealed ones on the client
        let url = "/api/gifts/log";
        if (chainId) {
          url += `?chainId=${chainId}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.gifts) {
          // Filter to only show revealed gifts if specified
          const filteredGifts = showOnlyRevealed
            ? data.gifts.filter((g: GiftLogEntry) => g.is_revealed)
            : data.gifts;
          setGifts(filteredGifts);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error("Error fetching gift log:", err);
        setError("Failed to load gift log");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGiftLog();
  }, [chainId, showOnlyRevealed]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGiftTypeEmoji = (type: string) => {
    switch (type) {
      case "crypto":
        return "💰";
      case "nft":
        return "🖼️";
      case "message":
        return "💌";
      default:
        return "🎁";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl animate-bounce mb-2">📜</div>
        <p className="text-gray-600">Loading gift log...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-xl">
        <div className="text-4xl mb-2">😢</div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (gifts.length === 0) {
    return (
      <div className="text-center py-8 bg-white/80 backdrop-blur rounded-2xl">
        <div className="text-5xl mb-3">📜</div>
        <p className="text-gray-600">No revealed gifts yet!</p>
        <p className="text-sm text-gray-500 mt-1">
          Gift exchanges will appear here after the reveal date
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <span>📜</span> Gift Exchange Log
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {gifts.length} gifts
        </span>
      </div>

      <div className="space-y-3">
        {gifts.map((gift) => (
          <div
            key={gift.id}
            className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-md border border-gray-100"
          >
            {/* Gift Header */}
            <div className="flex items-center gap-3 mb-3">
              {/* Sender */}
              <div className="flex items-center gap-2">
                <img
                  src={gift.sender?.pfp_url || "/icon.png"}
                  alt={gift.sender?.username}
                  className="w-10 h-10 rounded-full border-2 border-red-300"
                />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {gift.sender?.display_name ||
                      gift.sender?.username ||
                      "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    @{gift.sender?.username || "???"}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 text-2xl">🎁➡️</div>

              {/* Recipient */}
              <div className="flex items-center gap-2">
                <img
                  src={gift.recipient?.pfp_url || "/icon.png"}
                  alt={gift.recipient?.username}
                  className="w-10 h-10 rounded-full border-2 border-green-300"
                />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {gift.recipient?.display_name ||
                      gift.recipient?.username ||
                      "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    @{gift.recipient?.username || "???"}
                  </p>
                </div>
              </div>
            </div>

            {/* Gift Details */}
            <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {getGiftTypeEmoji(gift.gift_type)}
                  </span>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {gift.gift_type} Gift
                  </span>
                </div>
                {gift.amount && (
                  <span className="text-sm font-bold text-green-600">
                    {gift.amount} {gift.currency || "USDC"}
                  </span>
                )}
              </div>

              {gift.message && (
                <p className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-3 mt-2">
                  "{gift.message}"
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span>🎄</span>
                {gift.chain?.name || "Unknown Chain"}
              </span>
              <span>{formatDate(gift.sent_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
