"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFrameContext } from "~/components/providers/FrameProvider";
import { sdk } from "@farcaster/miniapp-sdk";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { useAuth } from "~/components/auth";
import { AuthButton } from "~/components/auth/AuthButton";
import { Button } from "~/components/ui/Button";
import { ChainCard, CreateChainModal } from "~/components/chains";
import { GiftCard, SendGiftModal, ThankYouModal } from "~/components/gifts";
import { Snowfall } from "~/components/Snowfall";
import { SupportDeveloperModal } from "~/components/SupportDeveloperModal";
import { HowItWorks } from "~/components/HowItWorks";
import { useChristmasSounds } from "~/lib/sounds";
import {
  getJoinChainShareParams,
  getCreateChainShareParams,
} from "~/lib/share";

type TabType = "chains" | "my-gifts" | "how-it-works" | "profile";

interface GiftChain {
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
  isJoined?: boolean;
  myAssignment?: {
    recipientFid: number;
    recipientUsername: string;
    hasSentGift: boolean;
  };
}

interface Gift {
  id: string;
  chain_id: string;
  chain_name?: string;
  status: "pending" | "sent" | "received" | "revealed";
  message?: string;
  is_giver: boolean;
  receiver_username?: string;
  giver_username?: string;
  amount?: number;
  currency?: string;
  gift_type?: string;
  is_revealed?: boolean;
  chain?: {
    name: string;
    status: string;
  };
  recipient?: {
    username: string;
    display_name: string;
    pfp_url: string;
  };
  sender?: {
    username: string;
    display_name: string;
    pfp_url: string;
  };
}

interface ChainParticipation {
  id: string;
  chain_id: string;
  user_fid: number;
  assigned_recipient_fid: number | null;
  has_sent_gift: boolean;
  chain: {
    id: string;
    name: string;
    status: string;
    join_deadline: string;
    reveal_date: string;
    min_amount?: number;
    max_amount?: number;
    currency?: string;
  };
  assigned_recipient?: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
  };
}

export default function SecretSantaChain() {
  const frameContext = useFrameContext();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { composeCast } = useComposeCast();
  const sounds = useChristmasSounds();
  const isValidScore = user?.isValidScore ?? false;
  const [activeTab, setActiveTab] = useState<TabType>("chains");
  const [chains, setChains] = useState<GiftChain[]>([]);
  const [myGifts, setMyGifts] = useState<Gift[]>([]);
  const [myParticipations, setMyParticipations] = useState<
    ChainParticipation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sendGiftModal, setSendGiftModal] = useState<{
    giftId: string;
    chainId: string;
    recipientFid: number;
    recipientUsername?: string;
  } | null>(null);
  const [thankYouModal, setThankYouModal] = useState<string | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const ctx = frameContext?.context as Record<string, unknown> | undefined;
  const client = ctx?.client as Record<string, unknown> | undefined;
  const insets = client?.safeAreaInsets as Record<string, number> | undefined;
  const safeStyle = {
    marginTop: insets?.top ?? 0,
    marginBottom: insets?.bottom ?? 0,
    marginLeft: insets?.left ?? 0,
    marginRight: insets?.right ?? 0,
  };

  const fetchChains = useCallback(async () => {
    console.log("[fetchChains] Starting fetch, user FID:", user?.fid);
    setIsLoading(true);
    try {
      const res = await fetch("/api/chains");
      const data = await res.json();
      console.log("[fetchChains] Chains response:", data);
      if (data.success) {
        // Also fetch user's participations to mark joined chains
        if (user?.fid) {
          const participationsRes = await fetch(
            `/api/user/participations?fid=${user.fid}`
          );
          const participationsData = await participationsRes.json();
          console.log(
            "[fetchChains] Participations response:",
            participationsData
          );
          if (participationsData.success && participationsData.participations) {
            // Handle case where chain might be returned as array (Supabase quirk)
            const normalizedParticipations =
              participationsData.participations.map(
                (
                  p: ChainParticipation & {
                    chain:
                      | ChainParticipation["chain"]
                      | ChainParticipation["chain"][];
                  }
                ) => ({
                  ...p,
                  chain: Array.isArray(p.chain) ? p.chain[0] : p.chain,
                })
              );
            const joinedChainIds = new Set(
              normalizedParticipations.map(
                (p: ChainParticipation) => p.chain_id
              )
            );
            console.log(
              "[fetchChains] Joined chain IDs:",
              Array.from(joinedChainIds)
            );
            // Mark chains as joined
            const chainsWithJoinStatus = (data.chains || []).map(
              (chain: GiftChain) => ({
                ...chain,
                isJoined: joinedChainIds.has(chain.id),
              })
            );
            setChains(chainsWithJoinStatus);
            // Also update participations state
            setMyParticipations(normalizedParticipations);
            console.log(
              "[fetchChains] Set participations:",
              normalizedParticipations.length
            );
          } else {
            console.log(
              "[fetchChains] No participations, setting chains without join status"
            );
            setChains(data.chains || []);
          }
        } else {
          console.log(
            "[fetchChains] No user FID, setting chains without join status"
          );
          setChains(data.chains || []);
        }
      }
    } catch (e) {
      console.error("[fetchChains] Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.fid]);

  const fetchMyGifts = useCallback(async () => {
    if (!user?.fid) {
      console.log("[fetchMyGifts] No user FID, skipping fetch");
      return;
    }
    console.log("[fetchMyGifts] Fetching for FID:", user.fid);
    setIsLoading(true);
    try {
      // Fetch gifts
      const giftsRes = await fetch(`/api/gifts?userFid=${user.fid}`);
      const giftsData = await giftsRes.json();
      console.log("[fetchMyGifts] Gifts response:", giftsData);
      if (giftsData.gifts) {
        const transformedGifts = giftsData.gifts.map((gift: Gift) => ({
          ...gift,
          is_giver: gift.sender?.username === user.username,
          status: gift.is_revealed ? "revealed" : "sent",
        }));
        setMyGifts(transformedGifts);
      }

      // Fetch participations
      const participationsRes = await fetch(
        `/api/user/participations?fid=${user.fid}`
      );
      const participationsData = await participationsRes.json();
      console.log(
        "[fetchMyGifts] Participations response:",
        participationsData
      );
      if (participationsData.success && participationsData.participations) {
        // Handle case where chain might be returned as array (Supabase quirk)
        const normalizedParticipations = participationsData.participations.map(
          (
            p: ChainParticipation & {
              chain:
                | ChainParticipation["chain"]
                | ChainParticipation["chain"][];
            }
          ) => ({
            ...p,
            chain: Array.isArray(p.chain) ? p.chain[0] : p.chain,
          })
        );
        console.log(
          "[fetchMyGifts] Normalized participations:",
          normalizedParticipations
        );
        setMyParticipations(normalizedParticipations);
      } else {
        console.log(
          "[fetchMyGifts] No participations found or error:",
          participationsData
        );
      }
    } catch (e) {
      console.error("[fetchMyGifts] Error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.fid, user?.username]);

  // Fetch participations when user is authenticated (for showing joined status on chains)
  useEffect(() => {
    if (isAuthenticated && user?.fid) {
      fetchMyGifts();
    }
  }, [isAuthenticated, user?.fid, fetchMyGifts]);

  useEffect(() => {
    if (activeTab === "chains") fetchChains();
    if (activeTab === "my-gifts") fetchMyGifts();
  }, [activeTab, fetchChains, fetchMyGifts]);

  const handleJoin = async (id: string) => {
    if (!user?.fid) return;
    setJoinError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chains/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: user.fid }),
      });
      const data = await res.json();
      if (data.success) {
        // Find the chain name for the share message
        const joinedChain = chains.find((c) => c.id === id);
        if (joinedChain) {
          // Trigger compose cast for sharing
          const shareParams = getJoinChainShareParams(joinedChain.name, id);
          composeCast(shareParams);
        }
        // Refresh both chains and participations
        fetchChains();
        fetchMyGifts();
      } else {
        setJoinError(data.error || "Failed to join chain");
      }
    } catch (e) {
      console.error(e);
      setJoinError("Failed to join chain");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMatching = async (chainId: string) => {
    if (!user?.fid) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chains/${chainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_matching",
          userFid: user.fid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh chains to show updated status
        fetchChains();
        // Also refresh participations to show assignments
        fetchMyGifts();
      } else {
        setJoinError(data.error || "Failed to start matching");
      }
    } catch (e) {
      console.error(e);
      setJoinError("Failed to start matching");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChainCreated = useCallback(
    (chainId: string, chainName: string) => {
      // Trigger compose cast for sharing the created chain
      const shareParams = getCreateChainShareParams(chainName, chainId);
      composeCast(shareParams);
      fetchChains();
    },
    [composeCast, fetchChains]
  );

  if (authLoading) {
    return (
      <div
        style={safeStyle}
        className="min-h-screen flex items-center justify-center"
      >
        <Snowfall />
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🎅</div>
          <p className="text-gray-600 font-medium">Loading the magic...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={safeStyle}
        className="min-h-screen flex items-center justify-center px-4"
      >
        <Snowfall />
        <div className="text-center max-w-sm">
          <h1 className="font-christmas text-5xl text-red-600 mb-2 drop-shadow-lg">
            Secret Santa
          </h1>
          <div className="text-6xl mb-4">🎄🎁🎅</div>
          <p className="text-gray-700 mb-6 text-lg">
            Anonymous gifting magic for Farcaster
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  if (!isValidScore) {
    return (
      <div
        style={safeStyle}
        className="min-h-screen flex items-center justify-center px-4"
      >
        <Snowfall />
        <div className="text-center max-w-sm bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl">
          <div className="text-5xl mb-4">⚠️🎄</div>
          <h1 className="text-xl font-bold mb-2 text-gray-800">
            Quality Score Required
          </h1>
          <p className="text-gray-600 mb-4">
            Score:{" "}
            <span className="font-bold text-red-500">
              {user?.neynarScore?.toFixed(2) || "N/A"}
            </span>
            <br />
            <span className="text-sm">(need 0.28+ to join)</span>
          </p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div style={safeStyle} className="min-h-screen pb-4">
      <Snowfall />

      {/* Header */}
      <div className="relative z-10 pt-4 pb-2 px-4">
        <div className="flex items-center justify-between">
          <h1 className="font-christmas text-4xl text-red-600 drop-shadow-md">
            Secret Santa
          </h1>
          {user?.pfpUrl && (
            <button
              onClick={() => {
                sounds.playClick();
                user.fid && sdk.actions.viewProfile({ fid: user.fid });
              }}
              className="relative"
              aria-label="View profile"
            >
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white">
                🎄
              </div>
              <img
                src={user.pfpUrl}
                alt="Profile"
                className="h-12 w-12 rounded-full border-2 border-red-500 shadow-lg"
              />
            </button>
          )}
        </div>
      </div>

      {/* Christmas Tab Navigation */}
      <div className="px-4 mb-4 relative z-10">
        <div className="tab-christmas">
          {(["chains", "my-gifts", "how-it-works", "profile"] as TabType[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => {
                  sounds.playClick();
                  setActiveTab(tab);
                }}
                className={`tab-christmas-item flex-1 justify-center ${
                  activeTab === tab ? "active" : ""
                }`}
              >
                {tab === "chains" && <span>🎄</span>}
                {tab === "my-gifts" && <span>🎁</span>}
                {tab === "how-it-works" && <span>❓</span>}
                {tab === "profile" && <span>👤</span>}
                <span className="hidden sm:inline">
                  {tab === "chains"
                    ? "Chains"
                    : tab === "my-gifts"
                    ? "Gifts"
                    : tab === "how-it-works"
                    ? "Help"
                    : "Profile"}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 relative z-10">
        {activeTab === "chains" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Available Chains
              </h2>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowCreateModal(true);
                }}
                className="btn-gift-box relative px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
              >
                <span className="relative z-10 flex items-center gap-2 text-white font-bold">
                  🎁 Create
                </span>
              </button>
            </div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-5xl animate-spin mb-4">🎄</div>
                <p className="text-gray-600">Loading chains...</p>
              </div>
            ) : chains.length === 0 ? (
              <div className="text-center py-12 bg-white/80 backdrop-blur rounded-2xl">
                <div className="text-6xl mb-4">🎄</div>
                <p className="text-gray-600 mb-4 text-lg">
                  No chains available yet
                </p>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setShowCreateModal(true);
                  }}
                  className="btn-christmas px-8 py-3"
                >
                  🎅 Create the first chain!
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {joinError && (
                  <div className="bg-red-100 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <span>❌</span>
                    {joinError}
                  </div>
                )}
                <div className="grid gap-4">
                  {chains.map((chain) => (
                    <ChainCard
                      key={chain.id}
                      chain={chain}
                      currentUserFid={user?.fid}
                      onJoin={handleJoin}
                      onStartMatching={handleStartMatching}
                      isJoined={chain.isJoined}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "my-gifts" && (
          <div className="space-y-4">
            {/* My Chain Participations */}
            {myParticipations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <span>🎄</span> My Chains
                </h3>
                {myParticipations.map((participation) => (
                  <div key={participation.id} className="candy-cane-border">
                    <div className="candy-cane-border-inner p-4 bg-gradient-to-b from-green-50 to-white">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800">
                          {participation.chain.name}
                        </h4>
                        <span
                          className={`badge-open ${
                            participation.chain.status === "active"
                              ? "badge-active"
                              : ""
                          }`}
                        >
                          {participation.chain.status}
                        </span>
                      </div>

                      {participation.assigned_recipient_fid ? (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">
                            🎯 Your recipient:{" "}
                            <span className="font-bold text-gray-800">
                              @
                              {participation.assigned_recipient?.username ||
                                `FID ${participation.assigned_recipient_fid}`}
                            </span>
                          </p>
                          {participation.has_sent_gift ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-100 rounded-full px-4 py-2">
                              <span>✓</span>
                              <span className="font-semibold">
                                Gift sent! 🎁
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                sounds.playClick();
                                setSendGiftModal({
                                  giftId: participation.id,
                                  chainId: participation.chain_id,
                                  recipientFid:
                                    participation.assigned_recipient_fid!,
                                  recipientUsername:
                                    participation.assigned_recipient?.username,
                                });
                              }}
                              className="w-full btn-christmas py-3 pulse-glow"
                            >
                              🎁 Send Gift
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                          <span className="animate-spin">⏳</span>
                          Waiting for matching to complete...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Received Gifts */}
            {myGifts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <span>🎁</span> Gifts
                </h3>
                {myGifts.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    onSendGift={(id) => {
                      console.log("View gift:", id);
                    }}
                    onSendThankYou={(id) => setThankYouModal(id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {myParticipations.length === 0 && myGifts.length === 0 && (
              <div className="text-center py-12 bg-white/80 backdrop-blur rounded-2xl">
                <div className="text-6xl mb-4">📭🎄</div>
                <p className="text-gray-700 mb-2 text-lg font-medium">
                  No gifts yet
                </p>
                <p className="text-sm text-gray-500">
                  Join a chain to start giving and receiving gifts!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "how-it-works" && <HowItWorks />}

        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="candy-cane-border">
              <div className="candy-cane-border-inner p-6 text-center bg-gradient-to-b from-red-50 to-white">
                <div className="relative inline-block mb-4">
                  {user?.pfpUrl && (
                    <img
                      src={user.pfpUrl}
                      alt=""
                      className="h-20 w-20 rounded-full border-4 border-red-500 shadow-lg"
                    />
                  )}
                  <div className="absolute -bottom-2 -right-2 text-3xl">🎅</div>
                </div>
                <h2 className="font-bold text-xl text-gray-800">
                  @{user?.username}
                </h2>
                <p className="text-sm text-gray-500 mb-4">FID: {user?.fid}</p>
                <div className="bg-green-100 rounded-xl p-3 mb-4">
                  <p className="text-sm text-gray-600">
                    Quality Score:{" "}
                    <span className="font-bold text-green-600 text-lg">
                      {user?.neynarScore?.toFixed(2)} ⭐
                    </span>
                  </p>
                </div>
                <div className="mt-4">
                  <AuthButton />
                </div>
              </div>
            </div>

            {/* Support Developer Card */}
            <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 border border-pink-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
                  ❤️
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    Support the Developer
                  </h3>
                  <p className="text-xs text-gray-500">
                    Help keep the magic alive!
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Enjoying Secret Santa Chain? Consider supporting the developer
                to help pay for servers and keep spreading holiday cheer! 🎄
              </p>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowSupportModal(true);
                }}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
              >
                ❤️ Support with USDC
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateChainModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleChainCreated}
          />
        )}

        {sendGiftModal && (
          <SendGiftModal
            giftId={sendGiftModal.giftId}
            recipientUsername={sendGiftModal.recipientUsername}
            onClose={() => setSendGiftModal(null)}
            onSend={async (giftId, data) => {
              if (!user?.fid) return;

              try {
                // Map the gift_type from modal to API expected format
                const giftTypeMap: Record<string, string> = {
                  digital: "crypto",
                  physical: "message",
                  experience: "message",
                  donation: "message",
                  other: "message",
                };

                const response = await fetch("/api/gifts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chainId: sendGiftModal.chainId,
                    senderFid: user.fid,
                    recipientFid: sendGiftModal.recipientFid,
                    giftType: giftTypeMap[data.gift_type] || "message",
                    message: data.message,
                    amount: data.gift_value
                      ? parseFloat(data.gift_value)
                      : undefined,
                  }),
                });

                const result = await response.json();

                if (result.success) {
                  console.log("Gift sent successfully:", result);
                  // Refresh participations to show updated status
                  fetchMyGifts();
                } else {
                  console.error("Failed to send gift:", result.error);
                  setJoinError(result.error || "Failed to send gift");
                }
              } catch (error) {
                console.error("Error sending gift:", error);
                setJoinError("Failed to send gift");
              }

              setSendGiftModal(null);
            }}
          />
        )}

        {thankYouModal && (
          <ThankYouModal
            giftId={thankYouModal}
            onClose={() => setThankYouModal(null)}
            onSend={async (giftId, message) => {
              // Handle thank you
              console.log("Sending thank you:", giftId, message);
              setThankYouModal(null);
            }}
          />
        )}

        {showSupportModal && (
          <SupportDeveloperModal onClose={() => setShowSupportModal(false)} />
        )}
      </div>
    </div>
  );
}
