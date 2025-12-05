"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/Button";

interface SendGiftModalProps {
  giftId: string;
  recipientUsername?: string;
  onClose: () => void;
  onSend: (
    giftId: string,
    data: { message: string; gift_type: string; gift_value?: string }
  ) => Promise<void>;
}

export function SendGiftModal({
  giftId,
  recipientUsername,
  onClose,
  onSend,
}: SendGiftModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    message: "",
    gift_type: "digital",
    gift_value: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSend(giftId, formData);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🎁 Send Gift</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {recipientUsername && (
          <p className="text-sm text-muted-foreground mb-4">
            Sending to:{" "}
            <span className="font-medium text-foreground">
              @{recipientUsername}
            </span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Gift Type</label>
            <select
              value={formData.gift_type}
              onChange={(e) =>
                setFormData({ ...formData, gift_type: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg"
            >
              <option value="digital">Digital Gift (NFT, Token, etc.)</option>
              <option value="physical">Physical Gift</option>
              <option value="experience">Experience/Service</option>
              <option value="donation">Donation in their name</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Gift Value (optional)
            </label>
            <input
              type="text"
              value={formData.gift_value}
              onChange={(e) =>
                setFormData({ ...formData, gift_value: e.target.value })
              }
              placeholder="e.g., $25, 0.01 ETH"
              className="w-full px-3 py-2 border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Anonymous Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Write a heartfelt message to your recipient..."
              className="w-full px-3 py-2 border border-border rounded-lg"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.message.length}/500 characters
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700">
              ⚠️ Your identity will remain anonymous until the reveal date. Make
              sure not to include any identifying information in your message!
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Sending..." : "Send Gift 🎁"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
