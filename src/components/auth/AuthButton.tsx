"use client";

import { useAuth } from "../providers/AuthProvider";
import { Button } from "~/components/ui/Button";

interface AuthButtonProps {
  className?: string;
  showScore?: boolean;
}

export function AuthButton({ className, showScore = true }: AuthButtonProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
    isCheckingContext,
    isInFarcasterApp,
    error,
    signIn,
    signOut,
  } = useAuth();

  // Show loading state while checking Farcaster context
  if (isCheckingContext) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Show loading state during sign-in
  if (isLoading) {
    return (
      <Button disabled className={className} isLoading={true}>
        {isInFarcasterApp ? "Connecting..." : "Signing in..."}
      </Button>
    );
  }

  // Show user info when authenticated
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

  // If inside Farcaster app but not authenticated, show auto-connecting message
  // (This shouldn't normally happen as auto-login should occur)
  if (isInFarcasterApp) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">
            Connecting to Farcaster...
          </span>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  // Show sign-in button only when accessed from browser (not inside Farcaster app)
  return (
    <div className="flex flex-col gap-2">
      <Button onClick={signIn} className={className}>
        Sign In with Farcaster
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
