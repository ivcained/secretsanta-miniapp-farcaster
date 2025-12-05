/**
 * Gift Chain Matching Algorithm
 * Handles random assignment of gift recipients in a circular chain
 */

import { supabaseAdmin } from "@/lib/supabase";

interface Participant {
  user_fid: number;
}

/**
 * Fisher-Yates shuffle algorithm for random array shuffling
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create circular gift assignments
 * Each participant gifts to the next person in the shuffled array
 * The last person gifts to the first person
 */
export function createCircularAssignments(
  participants: Participant[]
): Map<number, number> {
  if (participants.length < 2) {
    throw new Error("Need at least 2 participants for matching");
  }

  // Shuffle participants randomly
  const shuffled = shuffleArray(participants);

  // Create circular assignments
  const assignments = new Map<number, number>();

  for (let i = 0; i < shuffled.length; i++) {
    const giver = shuffled[i].user_fid;
    const receiver = shuffled[(i + 1) % shuffled.length].user_fid;
    assignments.set(giver, receiver);
  }

  return assignments;
}

/**
 * Validate that no one is assigned to themselves
 */
export function validateAssignments(assignments: Map<number, number>): boolean {
  for (const [giver, receiver] of assignments) {
    if (giver === receiver) {
      return false;
    }
  }
  return true;
}

/**
 * Run the matching process for a gift chain
 */
export async function runMatching(chainId: string): Promise<{
  success: boolean;
  assignments?: Map<number, number>;
  error?: string;
}> {
  try {
    // Get all participants for this chain
    const { data: participants, error: fetchError } = await supabaseAdmin
      .from("chain_participants")
      .select("user_fid")
      .eq("chain_id", chainId);

    if (fetchError) {
      return {
        success: false,
        error: `Failed to fetch participants: ${fetchError.message}`,
      };
    }

    if (!participants || participants.length < 2) {
      return {
        success: false,
        error: "Not enough participants for matching (minimum 2)",
      };
    }

    // Create assignments with retry logic (in case of self-assignment)
    let assignments: Map<number, number>;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      assignments = createCircularAssignments(participants);
      attempts++;
    } while (!validateAssignments(assignments) && attempts < maxAttempts);

    if (!validateAssignments(assignments)) {
      return {
        success: false,
        error: "Failed to create valid assignments after multiple attempts",
      };
    }

    // Update database with assignments
    const updates = Array.from(assignments.entries()).map(
      ([giverFid, receiverFid]) => ({
        chain_id: chainId,
        user_fid: giverFid,
        assigned_recipient_fid: receiverFid,
      })
    );

    for (const update of updates) {
      const { error: updateError } = await supabaseAdmin
        .from("chain_participants")
        .update({ assigned_recipient_fid: update.assigned_recipient_fid })
        .eq("chain_id", update.chain_id)
        .eq("user_fid", update.user_fid);

      if (updateError) {
        console.error(
          `Failed to update assignment for FID ${update.user_fid}:`,
          updateError
        );
      }
    }

    // Update chain status to 'active'
    const { error: statusError } = await supabaseAdmin
      .from("gift_chains")
      .update({ status: "active" })
      .eq("id", chainId);

    if (statusError) {
      console.error("Failed to update chain status:", statusError);
    }

    return { success: true, assignments };
  } catch (error) {
    console.error("Error running matching:", error);
    return { success: false, error: "Internal error during matching" };
  }
}

/**
 * Get a user's assigned recipient for a chain
 */
export async function getAssignedRecipient(
  chainId: string,
  userFid: number
): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from("chain_participants")
    .select("assigned_recipient_fid")
    .eq("chain_id", chainId)
    .eq("user_fid", userFid)
    .single();

  if (error || !data) {
    return null;
  }

  return data.assigned_recipient_fid;
}

/**
 * Check if all participants have sent their gifts
 */
export async function checkAllGiftsSent(chainId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("chain_participants")
    .select("has_sent_gift")
    .eq("chain_id", chainId);

  if (error || !data) {
    return false;
  }

  return data.every((p) => p.has_sent_gift);
}

/**
 * Get chain completion statistics
 */
export async function getChainStats(chainId: string): Promise<{
  totalParticipants: number;
  giftsSent: number;
  giftsRevealed: number;
  completionPercentage: number;
}> {
  const { data: participants, error: pError } = await supabaseAdmin
    .from("chain_participants")
    .select("has_sent_gift")
    .eq("chain_id", chainId);

  const { data: gifts, error: gError } = await supabaseAdmin
    .from("gifts")
    .select("is_revealed")
    .eq("chain_id", chainId);

  if (pError || gError || !participants) {
    return {
      totalParticipants: 0,
      giftsSent: 0,
      giftsRevealed: 0,
      completionPercentage: 0,
    };
  }

  const totalParticipants = participants.length;
  const giftsSent = participants.filter((p) => p.has_sent_gift).length;
  const giftsRevealed = gifts?.filter((g) => g.is_revealed).length || 0;
  const completionPercentage =
    totalParticipants > 0
      ? Math.round((giftsSent / totalParticipants) * 100)
      : 0;

  return {
    totalParticipants,
    giftsSent,
    giftsRevealed,
    completionPercentage,
  };
}
