/**
 * Authentication Library
 * Handles Farcaster authentication with Neynar score validation
 */

import { validateUserScore, type NeynarUser } from "./neynar";

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

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

/**
 * Validate and create a session for a Farcaster user
 */
export async function createAuthSession(
  fid: number,
  token: string,
  expiresAt: number
): Promise<AuthResult> {
  try {
    // Validate user with Neynar
    const validation = await validateUserScore(fid);

    if (!validation.user) {
      return {
        success: false,
        error: "User not found in Farcaster",
      };
    }

    const user: AuthUser = {
      fid: validation.user.fid,
      username: validation.user.username,
      displayName: validation.user.display_name,
      pfpUrl: validation.user.pfp_url,
      custodyAddress: validation.user.custody_address,
      neynarScore: validation.score,
      isValidScore: validation.isValid,
      verifiedAddresses: {
        ethAddresses: validation.user.verified_addresses?.eth_addresses || [],
        solAddresses: validation.user.verified_addresses?.sol_addresses || [],
      },
    };

    return {
      success: true,
      session: {
        user,
        token,
        expiresAt,
      },
    };
  } catch (error) {
    console.error("Error creating auth session:", error);
    return {
      success: false,
      error: "Failed to validate user",
    };
  }
}

/**
 * Check if a session is still valid
 */
export function isSessionValid(session: AuthSession | null): boolean {
  if (!session) return false;
  return Date.now() < session.expiresAt * 1000;
}

/**
 * Get the minimum required Neynar score
 */
export function getMinimumScore(): number {
  return parseFloat(process.env.NEYNAR_MIN_USER_SCORE || "0.7");
}
