"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/Button";
import { useAuth } from "~/components/auth";

interface CreateChainModalProps {
  onClose: () => void;
  onCreated: (chainId: string, chainName: string) => void;
}

export function CreateChainModal({
  onClose,
  onCreated,
}: CreateChainModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default dates
  const today = new Date();
  const joinDeadline = new Date(today);
  joinDeadline.setDate(joinDeadline.getDate() + 7);
  const giftDeadline = new Date(today);
  giftDeadline.setDate(giftDeadline.getDate() + 14);
  const revealDate = new Date(today);
  revealDate.setDate(revealDate.getDate() + 21);

  const formatDateForInput = (date: Date) => date.toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    theme: "General",
    minParticipants: 3,
    maxParticipants: 20,
    minAmount: 10,
    maxAmount: 50,
    currency: "USDC" as "ETH" | "USDC",
    joinDeadline: formatDateForInput(joinDeadline),
    giftDeadline: formatDateForInput(giftDeadline),
    revealDate: formatDateForInput(revealDate),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.fid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert date strings to ISO datetime format
      const joinDeadlineISO = new Date(
        formData.joinDeadline + "T23:59:59Z"
      ).toISOString();
      const revealDateISO = new Date(
        formData.revealDate + "T00:00:00Z"
      ).toISOString();

      const requestBody = {
        name: formData.name,
        description: formData.description || undefined,
        creatorFid: user.fid,
        minAmount: formData.minAmount,
        maxAmount: formData.maxAmount,
        currency: formData.currency,
        minParticipants: formData.minParticipants,
        maxParticipants: formData.maxParticipants,
        joinDeadline: joinDeadlineISO,
        revealDate: revealDateISO,
      };

      console.log("[CreateChain] Sending request:", requestBody);

      const response = await fetch("/api/chains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("[CreateChain] Response:", data);

      if (data.success && data.chain) {
        onCreated(data.chain.id, formData.name);
        onClose();
      } else {
        // Show detailed error if available
        if (data.details) {
          const errorMessages = data.details
            .map(
              (d: { path: string[]; message: string }) =>
                `${d.path.join(".")}: ${d.message}`
            )
            .join(", ");
          setError(`${data.error}: ${errorMessages}`);
        } else {
          setError(data.error || "Failed to create chain");
        }
      }
    } catch (err) {
      setError("Failed to create chain");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const themes = [
    "General",
    "Tech & Gadgets",
    "Art & Creativity",
    "Books & Reading",
    "Gaming",
    "Food & Cooking",
    "Music",
    "Crypto & NFTs",
    "Self Care",
    "Home & Garden",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🎄 Create Gift Chain</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Chain Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Farcaster Devs Secret Santa"
              className="w-full px-3 py-2 border border-border rounded-lg"
              required
              minLength={3}
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tell people what this chain is about..."
              className="w-full px-3 py-2 border border-border rounded-lg"
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" id="theme-label">
              Theme
            </label>
            <select
              value={formData.theme}
              onChange={(e) =>
                setFormData({ ...formData, theme: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg"
              aria-labelledby="theme-label"
            >
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Participants
              </label>
              <input
                type="number"
                value={formData.minParticipants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minParticipants: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-lg"
                min={2}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Participants
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxParticipants: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-lg"
                min={2}
                max={100}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              id="currency-label"
            >
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currency: e.target.value as "ETH" | "USDC",
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg"
              aria-labelledby="currency-label"
            >
              <option value="USDC">USDC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Budget ({formData.currency})
              </label>
              <input
                type="number"
                value={formData.minAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minAmount: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-lg"
                min={1}
                step={formData.currency === "ETH" ? "0.001" : "1"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Budget ({formData.currency})
              </label>
              <input
                type="number"
                value={formData.maxAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxAmount: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-lg"
                min={1}
                step={formData.currency === "ETH" ? "0.001" : "1"}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Join Deadline *
            </label>
            <input
              type="date"
              value={formData.joinDeadline}
              onChange={(e) =>
                setFormData({ ...formData, joinDeadline: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg"
              required
              min={formatDateForInput(today)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Last day to join the chain
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Gift Deadline *
            </label>
            <input
              type="date"
              value={formData.giftDeadline}
              onChange={(e) =>
                setFormData({ ...formData, giftDeadline: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg"
              required
              min={formData.joinDeadline}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Last day to send gifts
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Reveal Date *
            </label>
            <input
              type="date"
              value={formData.revealDate}
              onChange={(e) =>
                setFormData({ ...formData, revealDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg"
              required
              min={formData.giftDeadline}
            />
            <p className="text-xs text-muted-foreground mt-1">
              When Secret Santas are revealed
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !formData.name || formData.name.length < 3
              }
              className="flex-1"
            >
              {isSubmitting ? "Creating..." : "Create Chain 🎄"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
