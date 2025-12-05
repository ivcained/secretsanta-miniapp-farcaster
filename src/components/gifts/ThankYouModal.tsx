"use client";

import React, { useState } from "react";
import { Button } from "~/components/ui/Button";

interface ThankYouModalProps {
  giftId: string;
  onClose: () => void;
  onSend: (giftId: string, message: string) => Promise<void>;
}

export function ThankYouModal({ giftId, onClose, onSend }: ThankYouModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await onSend(giftId, message);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickMessages = [
    "Thank you so much! This made my day! 🎉",
    "What a wonderful surprise! I love it! ❤️",
    "You're amazing! Thank you for thinking of me! 🙏",
    "This is perfect! Thank you, Secret Santa! 🎅",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">💌 Send Thank You</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Send an anonymous thank you message to your Secret Santa!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Quick Messages
            </label>
            <div className="grid grid-cols-1 gap-2">
              {quickMessages.map((msg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(msg)}
                  className={`text-left text-sm p-2 rounded-lg border transition-colors ${
                    message === msg
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Or write your own
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a heartfelt thank you message..."
              className="w-full px-3 py-2 border border-border rounded-lg"
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/300 characters
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
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="flex-1"
            >
              {isSubmitting ? "Sending..." : "Send Thank You 💌"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
