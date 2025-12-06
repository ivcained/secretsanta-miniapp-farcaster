"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAuthenticate } from "@coinbase/onchainkit/minikit";
import {
  createAppClient,
  generateNonce,
  viemConnector,
} from "@farcaster/auth-client";

// Types
export interface AuthUser {
  fid: number;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  custodyAddress: string | null;
  neynarScore: number;
  isValidScore: boolean;
  verifiedAddresses: {
    ethAddresses: string[];
    solAddresses: string[];
  };
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isValidatingScore: boolean;
  isInFarcasterApp: boolean;
  isCheckingContext: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  validateScore: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Minimum score required (0.28)
const MIN_SCORE = 0.28;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingScore, setIsValidatingScore] = useState(false);
  const [isInFarcasterApp, setIsInFarcasterApp] = useState(false);
  const [isCheckingContext, setIsCheckingContext] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MiniKit's useAuthenticate hook
  const { signIn: miniKitSignIn } = useAuthenticate();

  // Helper function to login with FID
  const loginWithFid = useCallback(async (fid: number): Promise<boolean> => {
    console.log("[Auth] Logging in with FID:", fid);

    try {
      // Validate with Neynar and get user data
      const validateResponse = await fetch("/api/user/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid }),
      });

      const validateData = await validateResponse.json();
      console.log("[Auth] Neynar validation response:", validateData);

      if (!validateResponse.ok) {
        const errorMsg = validateData.error || "Failed to validate user";
        console.error("[Auth] Validation failed:", errorMsg);
        setError(errorMsg);
        return false;
      }

      // Create user object
      const newUser: AuthUser = {
        fid,
        username: validateData.user?.username || null,
        displayName: validateData.user?.displayName || null,
        pfpUrl: validateData.user?.pfpUrl || null,
        custodyAddress: validateData.user?.custodyAddress || null,
        neynarScore: validateData.score || 0,
        isValidScore: validateData.valid || false,
        verifiedAddresses: {
          ethAddresses: [],
          solAddresses: [],
        },
      };

      console.log("[Auth] Created user object:", newUser);
      setUser(newUser);
      localStorage.setItem("santa_chain_user", JSON.stringify(newUser));

      // Show warning if score is too low
      if (!validateData.valid) {
        setError(
          `Your Neynar score (${(validateData.score || 0).toFixed(
            2
          )}) is below the minimum required (${MIN_SCORE}). You can view chains but cannot participate.`
        );
      }

      return true;
    } catch (err) {
      console.error("[Auth] Login with FID error:", err);
      setError(
        `Login failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
      return false;
    }
  }, []);

  // Check for Farcaster context and auto-login on mount
  useEffect(() => {
    const checkFarcasterContext = async () => {
      console.log("[Auth] Checking Farcaster context...");
      setIsCheckingContext(true);

      // First check localStorage for existing session
      const storedUser = localStorage.getItem("santa_chain_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          console.log("[Auth] Restored user from localStorage:", parsed.fid);
        } catch (e) {
          localStorage.removeItem("santa_chain_user");
        }
      }

      // Check if we're inside Farcaster app
      try {
        const context = await sdk.context;
        console.log("[Auth] SDK context:", JSON.stringify(context, null, 2));

        if (context?.user?.fid) {
          console.log(
            "[Auth] Running inside Farcaster app with FID:",
            context.user.fid
          );
          setIsInFarcasterApp(true);

          // Auto-login if not already logged in
          if (!storedUser) {
            setIsLoading(true);
            await loginWithFid(context.user.fid);
            setIsLoading(false);
          }
        } else {
          console.log(
            "[Auth] Not running inside Farcaster app (no context or FID)"
          );
          setIsInFarcasterApp(false);
        }
      } catch (err) {
        console.log("[Auth] Error checking Farcaster context:", err);
        setIsInFarcasterApp(false);
      }

      setIsCheckingContext(false);
    };

    checkFarcasterContext();
  }, [loginWithFid]);

  // Validate user's Neynar score
  const validateScore = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsValidatingScore(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/validate?fid=${user.fid}`);
      const data = await response.json();

      if (data.valid) {
        const updatedUser = {
          ...user,
          neynarScore: data.score,
          isValidScore: true,
        };
        setUser(updatedUser);
        localStorage.setItem("santa_chain_user", JSON.stringify(updatedUser));
        return true;
      } else {
        const updatedUser = {
          ...user,
          neynarScore: data.score,
          isValidScore: false,
        };
        setUser(updatedUser);
        localStorage.setItem("santa_chain_user", JSON.stringify(updatedUser));
        setError(
          data.error ||
            `Your Neynar score (${data.score.toFixed(
              2
            )}) is below the minimum required (${MIN_SCORE})`
        );
        return false;
      }
    } catch (err) {
      setError("Failed to validate user score");
      return false;
    } finally {
      setIsValidatingScore(false);
    }
  }, [user]);

  // Refresh user data from Neynar
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const response = await fetch("/api/user/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: user.fid }),
      });

      const data = await response.json();

      if (data.valid && data.user) {
        const updatedUser: AuthUser = {
          fid: data.user.fid,
          username: data.user.username,
          displayName: data.user.displayName,
          pfpUrl: data.user.pfpUrl,
          custodyAddress: data.user.custodyAddress,
          neynarScore: data.score,
          isValidScore: data.valid,
          verifiedAddresses: {
            ethAddresses: [],
            solAddresses: [],
          },
        };
        setUser(updatedUser);
        localStorage.setItem("santa_chain_user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, [user]);

  // Sign in with Farcaster (for browser-based access)
  const signIn = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("[Auth] Starting sign-in process...");

      // First, try to get FID from SDK context (in case we're in Farcaster but context wasn't ready earlier)
      try {
        const context = await sdk.context;
        if (context?.user?.fid) {
          console.log("[Auth] Found FID in SDK context:", context.user.fid);
          await loginWithFid(context.user.fid);
          setIsInFarcasterApp(true);
          return;
        }
      } catch (contextError) {
        console.log("[Auth] No SDK context available, proceeding with SIWF");
      }

      // Generate nonce for SIWF
      const nonce = await generateNonce();
      if (!nonce) throw new Error("Unable to generate nonce");
      console.log("[Auth] Generated nonce:", nonce);

      // Use MiniKit's signIn
      console.log("[Auth] Calling MiniKit signIn...");
      const result = await miniKitSignIn({ nonce });
      console.log(
        "[Auth] MiniKit signIn result:",
        JSON.stringify(result, null, 2)
      );

      if (result === false) {
        setError("Sign-in was cancelled or failed");
        return;
      }

      // Check if result has fid directly (some SDK versions include it)
      let fid: number | undefined;

      // Try to get FID from the result directly first
      if (result && typeof result === "object" && "fid" in result) {
        fid = (result as { fid?: number }).fid;
        console.log("[Auth] FID found directly in result:", fid);
      }

      // If no FID yet, try to verify the sign-in message
      if (!fid && result.message && result.signature) {
        console.log("[Auth] Creating app client for verification...");
        const appClient = createAppClient({
          ethereum: viemConnector(),
        });

        console.log("[Auth] Verifying sign-in message...");
        console.log("[Auth] Message:", result.message);
        console.log("[Auth] Domain:", new URL(window.location.origin).hostname);

        try {
          const verifyResult = await appClient.verifySignInMessage({
            message: result.message,
            signature: result.signature as `0x${string}`,
            domain: new URL(window.location.origin).hostname,
            nonce: nonce,
            acceptAuthAddress: true,
          });
          console.log(
            "[Auth] Verify result:",
            JSON.stringify(verifyResult, null, 2)
          );

          if (verifyResult.success && verifyResult.fid) {
            fid = verifyResult.fid;
            console.log("[Auth] FID from verification:", fid);
          } else {
            console.error(
              "[Auth] Verification failed or no FID:",
              verifyResult
            );
          }
        } catch (verifyError) {
          console.error("[Auth] Verification error:", verifyError);
          // Continue to try other methods
        }
      }

      // Try to get FID from SDK context as fallback
      if (!fid) {
        try {
          const context = await sdk.context;
          console.log("[Auth] SDK context:", JSON.stringify(context, null, 2));
          if (context?.user?.fid) {
            fid = context.user.fid;
            console.log("[Auth] FID from SDK context:", fid);
          }
        } catch (contextError) {
          console.error("[Auth] Error getting SDK context:", contextError);
        }
      }

      if (!fid) {
        console.error("[Auth] Could not extract FID from any source");
        setError(
          "Could not get your Farcaster ID. Please try again or ensure you're using the Farcaster app."
        );
        return;
      }

      // Login with the extracted FID
      await loginWithFid(fid);
      console.log("[Auth] Sign-in successful!");
    } catch (err) {
      console.error("[Auth] Sign in error:", err);
      setError(
        `Sign-in failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  }, [miniKitSignIn, loginWithFid]);

  // Sign out
  const signOut = useCallback((): void => {
    setUser(null);
    setError(null);
    localStorage.removeItem("santa_chain_user");
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isValidatingScore,
    isInFarcasterApp,
    isCheckingContext,
    error,
    signIn,
    signOut,
    validateScore,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook to require authentication
export function useRequireAuth(): AuthContextType & { isReady: boolean } {
  const auth = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if we've loaded from localStorage
    const storedUser = localStorage.getItem("santa_chain_user");
    if (storedUser || auth.isAuthenticated) {
      setIsReady(true);
    } else {
      setIsReady(true); // Still ready, just not authenticated
    }
  }, [auth.isAuthenticated]);

  return { ...auth, isReady };
}

// Hook to require valid Neynar score
export function useRequireValidScore(): AuthContextType & {
  canParticipate: boolean;
} {
  const auth = useAuth();
  const canParticipate =
    auth.isAuthenticated && auth.user?.isValidScore === true;

  return { ...auth, canParticipate };
}
