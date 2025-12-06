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
import {
  getJoinChainShareParams,
  getCreateChainShareParams,
} from "~/lib/share";

type TabType = "chains" | "my-gifts" | "profile";

interface GiftChain {
  id: string;
  name: string;
  description: string;
  theme: string;
  current_participants: number;
  max_participants: number;
  budget_min: number;
  budget_max: number;
  status: string;
  join_deadline: string;
  gift_deadline: string;
  reveal_date: string;
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
    gift_deadline: string;
    reveal_date: string;
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
    setIsLoading(true);
    try {
      const res = await fetch("/api/chains");
      const data = await res.json();
      if (data.success) setChains(data.chains || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyGifts = useCallback(async () => {
    if (!user?.fid) return;
    setIsLoading(true);
    try {
      // Fetch gifts
      const giftsRes = await fetch(`/api/gifts?userFid=${user.fid}`);
      const giftsData = await giftsRes.json();
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
      if (participationsData.success && participationsData.participations) {
        setMyParticipations(participationsData.participations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.fid, user?.username]);

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
        fetchChains();
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
        className="w-[95%] max-w-lg mx-auto py-12 text-center"
      >
        <div className="animate-spin text-4xl">🎁</div>
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={safeStyle}
        className="w-[95%] max-w-lg mx-auto py-12 px-4 text-center"
      >
        <div className="text-6xl mb-4">🎁</div>
        <h1 className="text-2xl font-bold mb-2">Secret Santa Chain</h1>
        <p className="text-muted-foreground mb-6">
          Anonymous gifting for Farcaster
        </p>
        <AuthButton />
      </div>
    );
  }

  if (!isValidScore) {
    return (
      <div
        style={safeStyle}
        className="w-[95%] max-w-lg mx-auto py-12 px-4 text-center"
      >
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold mb-2">Quality Score Required</h1>
        <p className="text-muted-foreground mb-4">
          Score: {user?.neynarScore?.toFixed(2) || "N/A"} (need 0.7+)
        </p>
        <AuthButton />
      </div>
    );
  }

  return (
    <div style={safeStyle}>
      <div className="w-[95%] max-w-lg mx-auto py-4 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎁</span>
            <h1 className="text-lg font-bold">Secret Santa</h1>
          </div>
          {user?.pfpUrl && (
            <button
              onClick={() =>
                user.fid && sdk.actions.viewProfile({ fid: user.fid })
              }
              aria-label="View profile"
            >
              <img
                src={user.pfpUrl}
                alt="Profile"
                className="h-8 w-8 rounded-full"
              />
            </button>
          )}
        </div>

        <div className="flex gap-2 p-1 bg-white border rounded-lg mb-6">
          {(["chains", "my-gifts", "profile"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm rounded-md ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "text-muted-foreground"
              }`}
            >
              {tab === "chains"
                ? "🔗 Chains"
                : tab === "my-gifts"
                ? "🎁 Gifts"
                : "👤 Profile"}
            </button>
          ))}
        </div>

        {activeTab === "chains" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">Available Chains</h2>
              <Button onClick={() => setShowCreateModal(true)}>+ Create</Button>
            </div>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">
                Loading chains...
              </p>
            ) : chains.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No chains available yet
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  Create the first chain!
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {joinError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {joinError}
                  </div>
                )}
                {chains.map((chain) => (
                  <ChainCard
                    key={chain.id}
                    chain={chain}
                    onJoin={handleJoin}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "my-gifts" && (
          <div className="space-y-4">
            {/* My Chain Participations */}
            {myParticipations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  My Chains
                </h3>
                {myParticipations.map((participation) => (
                  <div
                    key={participation.id}
                    className="bg-white border rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">
                        {participation.chain.name}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          participation.chain.status === "active"
                            ? "bg-green-100 text-green-800"
                            : participation.chain.status === "open"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {participation.chain.status}
                      </span>
                    </div>

                    {participation.assigned_recipient_fid ? (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">
                          🎯 Your recipient:{" "}
                          <span className="font-medium text-foreground">
                            @
                            {participation.assigned_recipient?.username ||
                              `FID ${participation.assigned_recipient_fid}`}
                          </span>
                        </p>
                        {participation.has_sent_gift ? (
                          <div className="flex items-center gap-2 text-green-600 text-sm">
                            <span>✓</span>
                            <span>Gift sent!</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => {
                              setSendGiftModal({
                                giftId: participation.id,
                                chainId: participation.chain_id,
                                recipientFid:
                                  participation.assigned_recipient_fid!,
                                recipientUsername:
                                  participation.assigned_recipient?.username,
                              });
                            }}
                            className="w-full mt-2"
                          >
                            🎁 Send Gift
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        ⏳ Waiting for matching to complete...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Received Gifts */}
            {myGifts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Gifts
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
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-muted-foreground mb-2">No gifts yet</p>
                <p className="text-sm text-muted-foreground">
                  Join a chain to start giving and receiving gifts!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white border rounded-xl p-6 text-center">
            {user?.pfpUrl && (
              <img
                src={user.pfpUrl}
                alt=""
                className="h-16 w-16 rounded-full mx-auto mb-4"
              />
            )}
            <h2 className="font-bold text-lg">@{user?.username}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              FID: {user?.fid}
            </p>
            <p className="text-sm">
              Quality Score:{" "}
              <span className="font-semibold text-green-600">
                {user?.neynarScore?.toFixed(2)}
              </span>
            </p>
            <div className="mt-6">
              <AuthButton />
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
              // Handle send gift
              console.log("Sending gift:", giftId, data);
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
      </div>
    </div>
  );
}
