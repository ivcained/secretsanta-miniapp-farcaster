"use client";

import { useAuth } from "../providers/AuthProvider";
import { Button } from "~/components/ui/Button";

interface AuthButtonProps {
  className?: string;
  showScore?: boolean;
}

export function AuthButton({ className, showScore = true }: AuthButtonProps) {
  const { user, isAuthenticated, isLoading, error, signIn, signOut } =
    useAuth();

  if (isLoading) {
    return (
      <Button disabled className={className} isLoading={true}>
        Signing in...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.pfpUrl && (
            <img
              src={user.pfpUrl}
              alt={user.displayName || user.username || "User"}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-primary">
              {user.displayName || user.username || `FID: ${user.fid}`}
            </span>
            {showScore && (
              <span
                className={`text-xs ${
                  user.isValidScore ? "text-green-500" : "text-yellow-500"
                }`}
              >
                Score: {user.neynarScore.toFixed(2)}
                {user.isValidScore ? " ✓" : " ⚠️"}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={signOut}
          className={`px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors ${
            className || ""
          }`}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={signIn} className={className}>
        Sign In with Farcaster
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
