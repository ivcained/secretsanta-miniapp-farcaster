"use client";

import React from "react";
import { Button } from "~/components/ui/Button";

interface GiftCardProps {
  gift: {
    id: string;
    chain_id: string;
    chain_name?: string;
    status: "pending" | "sent" | "received" | "revealed";
    message?: string;
    gift_type?: string;
    gift_value?: string;
    sent_at?: string;
    received_at?: string;
    is_giver: boolean;
    receiver_username?: string;
    giver_username?: string;
  };
  onSendGift?: (giftId: string) => void;
  onMarkReceived?: (giftId: string) => void;
  onSendThankYou?: (giftId: string) => void;
}

export function GiftCard({
  gift,
  onSendGift,
  onMarkReceived,
  onSendThankYou,
}: GiftCardProps) {
  const getStatusBadge = () => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      sent: "bg-blue-100 text-blue-800",
      received: "bg-green-100 text-green-800",
      revealed: "bg-purple-100 text-purple-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusStyles[gift.status]
        }`}
      >
        {gift.status}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-foreground">
            {gift.is_giver ? "🎁 Gift to Send" : "📦 Gift to Receive"}
          </h3>
          {gift.chain_name && (
            <p className="text-xs text-muted-foreground">{gift.chain_name}</p>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {gift.is_giver ? (
        <div className="space-y-3">
          {gift.status === "pending" && (
            <>
              <p className="text-sm text-muted-foreground">
                You need to send a gift to your assigned recipient.
              </p>
              {gift.receiver_username && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Recipient:</span>{" "}
                  <span className="font-medium">@{gift.receiver_username}</span>
                </p>
              )}
              {onSendGift && (
                <Button onClick={() => onSendGift(gift.id)} className="w-full">
                  Send Gift
                </Button>
              )}
            </>
          )}
          {gift.status === "sent" && (
            <>
              <p className="text-sm text-muted-foreground">
                Your gift has been sent! Waiting for recipient to confirm.
              </p>
              {gift.sent_at && (
                <p className="text-xs text-muted-foreground">
                  Sent: {formatDate(gift.sent_at)}
                </p>
              )}
            </>
          )}
          {gift.status === "received" && (
            <>
              <p className="text-sm text-green-600">
                ✓ Your gift was received!
              </p>
              {gift.received_at && (
                <p className="text-xs text-muted-foreground">
                  Received: {formatDate(gift.received_at)}
                </p>
              )}
            </>
          )}
          {gift.status === "revealed" && (
            <>
              <p className="text-sm text-purple-600">
                🎉 Identity revealed! The recipient knows it was you.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {gift.status === "pending" && (
            <p className="text-sm text-muted-foreground">
              Someone is preparing a gift for you! 🎄
            </p>
          )}
          {gift.status === "sent" && (
            <>
              <p className="text-sm text-muted-foreground">
                A gift has been sent to you! Mark it as received when you get
                it.
              </p>
              {gift.message && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Message:</p>
                  <p className="text-sm italic">&quot;{gift.message}&quot;</p>
                </div>
              )}
              {onMarkReceived && (
                <Button
                  onClick={() => onMarkReceived(gift.id)}
                  className="w-full"
                >
                  Mark as Received
                </Button>
              )}
            </>
          )}
          {gift.status === "received" && (
            <>
              <p className="text-sm text-green-600">
                ✓ You received your gift!
              </p>
              {gift.message && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Message:</p>
                  <p className="text-sm italic">&quot;{gift.message}&quot;</p>
                </div>
              )}
              {onSendThankYou && (
                <Button
                  onClick={() => onSendThankYou(gift.id)}
                  className="w-full"
                >
                  Send Thank You
                </Button>
              )}
            </>
          )}
          {gift.status === "revealed" && (
            <>
              <p className="text-sm text-purple-600">
                🎉 Your Secret Santa was @{gift.giver_username}!
              </p>
              {gift.message && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Message:</p>
                  <p className="text-sm italic">&quot;{gift.message}&quot;</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
