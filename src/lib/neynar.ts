/**
 * Neynar API Client
 * Handles user data fetching and quality score validation
 */

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com";
const MIN_USER_SCORE = parseFloat(process.env.NEYNAR_MIN_USER_SCORE || "0.7");

// Types for Neynar API responses
export interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
  experimental: {
    neynar_user_score: number;
  };
  profile: {
    bio: {
      text: string;
    };
  };
}

export interface NeynarBulkUsersResponse {
  users: NeynarUser[];
}

export interface UserValidationResult {
  isValid: boolean;
  score: number;
  user: NeynarUser | null;
  error?: string;
}

/**
 * Fetch a single user by FID from Neynar API
 */
export async function getUserByFid(fid: number): Promise<NeynarUser | null> {
  if (!NEYNAR_API_KEY) {
    console.error("NEYNAR_API_KEY is not configured - check .env.local");
    return null;
  }

  const url = `${NEYNAR_BASE_URL}/v2/farcaster/user/bulk?fids=${fid}`;
  console.log(`[Neynar] Fetching user with FID: ${fid}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-api-key": NEYNAR_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Neynar] API error: ${response.status} ${response.statusText}`,
        errorText
      );
      return null;
    }

    const data: NeynarBulkUsersResponse = await response.json();
    console.log(
      `[Neynar] Response for FID ${fid}:`,
      JSON.stringify(data, null, 2)
    );

    if (!data.users || data.users.length === 0) {
      console.error(`[Neynar] No user found for FID: ${fid}`);
      return null;
    }

    return data.users[0];
  } catch (error) {
    console.error("[Neynar] Error fetching user:", error);
    return null;
  }
}

/**
 * Fetch multiple users by FIDs from Neynar API
 */
export async function getUsersByFids(fids: number[]): Promise<NeynarUser[]> {
  if (!NEYNAR_API_KEY) {
    console.error("NEYNAR_API_KEY is not configured");
    return [];
  }

  if (fids.length === 0) return [];

  try {
    // Neynar API supports up to 100 FIDs per request
    const chunks = chunkArray(fids, 100);
    const allUsers: NeynarUser[] = [];

    for (const chunk of chunks) {
      const response = await fetch(
        `${NEYNAR_BASE_URL}/v2/farcaster/user/bulk?fids=${chunk.join(",")}`,
        {
          method: "GET",
          headers: {
            "x-api-key": NEYNAR_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data: NeynarBulkUsersResponse = await response.json();
        allUsers.push(...(data.users || []));
      }
    }

    return allUsers;
  } catch (error) {
    console.error("Error fetching users from Neynar:", error);
    return [];
  }
}

/**
 * Validate a user's Neynar score
 * Returns validation result with user data if valid
 */
export async function validateUserScore(
  fid: number
): Promise<UserValidationResult> {
  console.log(`[Neynar] Validating user score for FID: ${fid}`);

  const user = await getUserByFid(fid);

  if (!user) {
    console.error(`[Neynar] User not found for FID: ${fid}`);

    // Check if Neynar API key might be invalid
    if (!NEYNAR_API_KEY) {
      return {
        isValid: false,
        score: 0,
        user: null,
        error:
          "Neynar API key not configured. Please contact the app administrator.",
      };
    }

    return {
      isValid: false,
      score: 0,
      user: null,
      error: `User with FID ${fid} not found in Neynar. This may be a new account or the API may be temporarily unavailable.`,
    };
  }

  const score = user.experimental?.neynar_user_score || 0;
  console.log(
    `[Neynar] User ${user.username} (FID: ${fid}) has score: ${score}`
  );

  if (score < MIN_USER_SCORE) {
    return {
      isValid: false,
      score,
      user,
      error: `Your Neynar score (${score.toFixed(
        2
      )}) is below the minimum threshold of ${MIN_USER_SCORE}. Please improve your Farcaster activity to participate.`,
    };
  }

  console.log(
    `[Neynar] User ${user.username} validated successfully with score ${score}`
  );
  return {
    isValid: true,
    score,
    user,
  };
}

/**
 * Get the minimum required user score
 */
export function getMinUserScore(): number {
  return MIN_USER_SCORE;
}

/**
 * Search for users by username
 */
export async function searchUsers(
  query: string,
  limit: number = 10
): Promise<NeynarUser[]> {
  if (!NEYNAR_API_KEY) {
    console.error("NEYNAR_API_KEY is not configured");
    return [];
  }

  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/v2/farcaster/user/search?q=${encodeURIComponent(
        query
      )}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Neynar API error: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = await response.json();
    return data.result?.users || [];
  } catch (error) {
    console.error("Error searching users from Neynar:", error);
    return [];
  }
}

/**
 * Get user's followers
 */
export async function getUserFollowers(
  fid: number,
  limit: number = 25
): Promise<NeynarUser[]> {
  if (!NEYNAR_API_KEY) {
    console.error("NEYNAR_API_KEY is not configured");
    return [];
  }

  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/v2/farcaster/followers?fid=${fid}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Neynar API error: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error("Error fetching followers from Neynar:", error);
    return [];
  }
}

/**
 * Get user's following
 */
export async function getUserFollowing(
  fid: number,
  limit: number = 25
): Promise<NeynarUser[]> {
  if (!NEYNAR_API_KEY) {
    console.error("NEYNAR_API_KEY is not configured");
    return [];
  }

  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/v2/farcaster/following?fid=${fid}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Neynar API error: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error("Error fetching following from Neynar:", error);
    return [];
  }
}

// Helper function to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
