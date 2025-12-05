"use client";

import { ReactNode } from "react";
import { useAuth, useRequireValidScore } from "../providers/AuthProvider";
import { AuthButton } from "./AuthButton";

interface ProtectedRouteProps {
  children: ReactNode;
  requireValidScore?: boolean;
  fallback?: ReactNode;
}

/**
 * Protected Route Component
 * Wraps content that requires authentication
 * Optionally requires valid Neynar score (0.7+)
 */
export function ProtectedRoute({
  children,
  requireValidScore = true,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { canParticipate } = useRequireValidScore();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Not authenticated - show sign in
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-6 p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-2">
              Sign In Required
            </h2>
            <p className="text-muted-foreground">
              Please sign in with Farcaster to continue
            </p>
          </div>
          <AuthButton />
        </div>
      )
    );
  }

  // Authenticated but score too low
  if (requireValidScore && !canParticipate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-6 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-yellow-500 mb-2">
            Score Too Low
          </h2>
          <p className="text-muted-foreground mb-4">
            Your Neynar score ({user?.neynarScore.toFixed(2)}) is below the
            minimum required (0.7) to participate in gift chains.
          </p>
          <p className="text-sm text-muted-foreground">
            Improve your Farcaster activity to increase your score:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside">
            <li>Post quality content regularly</li>
            <li>Engage with other users</li>
            <li>Build genuine connections</li>
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Signed in as:</span>
          <AuthButton showScore={true} />
        </div>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}

/**
 * View-only Protected Route
 * Allows viewing content but shows auth prompt for actions
 */
export function ViewOnlyProtectedRoute({
  children,
  actionPrompt = "Sign in to participate",
}: {
  children: ReactNode;
  actionPrompt?: string;
}) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative">
      {children}
      {!isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{actionPrompt}</p>
            <AuthButton className="w-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
