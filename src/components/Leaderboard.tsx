"use client";

import React, { useState, useEffect } from "react";

interface LeaderboardEntry {
  user_fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  points: number;
  level: number;
  rank: number;
}

interface LeaderboardProps {
  currentUserFid?: number;
}

export function Leaderboard({ currentUserFid }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard?limit=20");
        const data = await response.json();
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError("Failed to load leaderboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getLevelBadge = (level: number) => {
    const badges = ["🌱", "🌿", "🌳", "⭐", "🌟", "💫", "✨", "🎄", "🎅", "👑"];
    return badges[Math.min(level - 1, badges.length - 1)];
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl animate-bounce mb-2">🏆</div>
        <p className="text-gray-600">Loading leaderboard...</p>
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

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8 bg-white/80 backdrop-blur rounded-2xl">
        <div className="text-5xl mb-3">🏆</div>
        <p className="text-gray-600">No rankings yet!</p>
        <p className="text-sm text-gray-500 mt-1">
          Join chains and send gifts to earn points
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <span>🏆</span> Points Leaderboard
        </h3>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="flex justify-center items-end gap-2 mb-6 px-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <img
              src={leaderboard[1]?.pfp_url || "/icon.png"}
              alt={leaderboard[1]?.username}
              className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-md"
            />
            <div className="bg-gradient-to-b from-gray-200 to-gray-300 w-16 h-16 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-2xl">🥈</span>
            </div>
            <p className="text-xs font-medium text-gray-700 mt-1 truncate max-w-16">
              @{leaderboard[1]?.username}
            </p>
            <p className="text-xs text-gray-500">
              {leaderboard[1]?.points} pts
            </p>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center -mt-4">
            <div className="text-2xl animate-bounce">👑</div>
            <img
              src={leaderboard[0]?.pfp_url || "/icon.png"}
              alt={leaderboard[0]?.username}
              className="w-16 h-16 rounded-full border-4 border-yellow-400 shadow-lg"
            />
            <div className="bg-gradient-to-b from-yellow-300 to-yellow-500 w-20 h-24 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-3xl">🥇</span>
            </div>
            <p className="text-sm font-bold text-gray-800 mt-1 truncate max-w-20">
              @{leaderboard[0]?.username}
            </p>
            <p className="text-xs text-gray-600 font-semibold">
              {leaderboard[0]?.points} pts
            </p>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <img
              src={leaderboard[2]?.pfp_url || "/icon.png"}
              alt={leaderboard[2]?.username}
              className="w-12 h-12 rounded-full border-2 border-amber-600 shadow-md"
            />
            <div className="bg-gradient-to-b from-amber-500 to-amber-700 w-16 h-12 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-2xl">🥉</span>
            </div>
            <p className="text-xs font-medium text-gray-700 mt-1 truncate max-w-16">
              @{leaderboard[2]?.username}
            </p>
            <p className="text-xs text-gray-500">
              {leaderboard[2]?.points} pts
            </p>
          </div>
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="bg-white/90 backdrop-blur rounded-xl overflow-hidden shadow-lg">
        {leaderboard.map((entry, index) => (
          <div
            key={entry.user_fid}
            className={`flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 ${
              entry.user_fid === currentUserFid
                ? "bg-green-50 border-l-4 border-l-green-500"
                : ""
            } ${index < 3 ? "bg-gradient-to-r from-yellow-50 to-white" : ""}`}
          >
            {/* Rank */}
            <div className="w-10 text-center font-bold text-lg">
              {getRankEmoji(entry.rank || index + 1)}
            </div>

            {/* Avatar */}
            <img
              src={entry.pfp_url || "/icon.png"}
              alt={entry.username}
              className="w-10 h-10 rounded-full border-2 border-gray-200"
            />

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-semibold text-gray-800 truncate">
                  {entry.display_name || entry.username}
                </p>
                <span className="text-sm">{getLevelBadge(entry.level)}</span>
              </div>
              <p className="text-xs text-gray-500">@{entry.username}</p>
            </div>

            {/* Points */}
            <div className="text-right">
              <p className="font-bold text-gray-800">{entry.points}</p>
              <p className="text-xs text-gray-500">points</p>
            </div>
          </div>
        ))}
      </div>

      {/* Points Legend */}
      <div className="bg-white/80 backdrop-blur rounded-xl p-4 mt-4">
        <h4 className="font-semibold text-gray-700 mb-2 text-sm">
          How to earn points:
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span>🎄</span> Join chain: +25
          </div>
          <div className="flex items-center gap-1">
            <span>✨</span> Create chain: +50
          </div>
          <div className="flex items-center gap-1">
            <span>🎁</span> Send gift: +30
          </div>
          <div className="flex items-center gap-1">
            <span>📬</span> Receive gift: +10
          </div>
          <div className="flex items-center gap-1">
            <span>💝</span> Thank you: +15
          </div>
          <div className="flex items-center gap-1">
            <span>🔥</span> Daily login: +10
          </div>
        </div>
      </div>
    </div>
  );
}
