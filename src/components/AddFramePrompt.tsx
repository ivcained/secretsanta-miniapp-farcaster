"use client";

import { useCallback, useState, useEffect } from "react";
import { useAddFrame } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import { useFrameContext } from "~/components/providers/FrameProvider";
import { Button } from "~/components/ui/Button";

interface AddFramePromptProps {
  onClose?: () => void;
}

export function AddFramePrompt({ onClose }: AddFramePromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addFrame = useAddFrame();
  const frameContext = useFrameContext();

  // Check if the miniapp is already added
  const isAlreadyAdded =
    frameContext?.context &&
    "client" in frameContext.context &&
    (frameContext.context as { client?: { added?: boolean } }).client?.added;

  useEffect(() => {
    // Don't show if already added or dismissed
    if (isAlreadyAdded || dismissed) {
      return;
    }

    // Check localStorage to see if user has already added the miniapp
    const hasAdded = localStorage.getItem("miniAppAdded");
    if (hasAdded === "true") {
      setDismissed(true);
      return;
    }

    // Check localStorage to see if user has dismissed before
    const hasDismissed = localStorage.getItem("addFramePromptDismissed");
    if (hasDismissed) {
      setDismissed(true);
      return;
    }

    // Trigger slide-up animation after a short delay
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => setIsVisible(true), 50);
    }, 500);

    return () => clearTimeout(timer);
  }, [isAlreadyAdded, dismissed]);

  const handleAddFrame = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      console.log("[AddFrame] Starting addFrame call...");
      console.log("[AddFrame] Frame context:", frameContext);

      // Try using OnchainKit's addFrame first
      let result = null;
      try {
        result = await addFrame();
        console.log("[AddFrame] OnchainKit result:", result);
      } catch (onchainErr) {
        console.log(
          "[AddFrame] OnchainKit failed, trying Farcaster SDK:",
          onchainErr
        );
      }

      // If OnchainKit didn't work, try Farcaster SDK directly
      if (!result) {
        try {
          console.log("[AddMiniApp] Trying Farcaster SDK addMiniApp...");
          const sdkResult = await sdk.actions.addMiniApp();
          console.log("[AddMiniApp] Farcaster SDK result:", sdkResult);

          if (sdkResult) {
            result = sdkResult;
          }
        } catch (sdkErr) {
          console.log("[AddMiniApp] Farcaster SDK also failed:", sdkErr);
        }
      }

      if (result) {
        // Store the notification token for push notifications
        const context = frameContext?.context as
          | { user?: { fid?: number } }
          | undefined;
        const userFid = context?.user?.fid;

        // Check if result has notification details
        const notificationDetails = result as
          | {
              token?: string;
              url?: string;
              notificationDetails?: { token: string; url: string };
            }
          | undefined;

        const token =
          notificationDetails?.token ||
          notificationDetails?.notificationDetails?.token;
        const url =
          notificationDetails?.url ||
          notificationDetails?.notificationDetails?.url;

        if (userFid && token && url) {
          try {
            await fetch("/api/notifications/token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userFid,
                token,
                url,
              }),
            });
            console.log("[AddFrame] Notification token stored successfully");
          } catch (tokenErr) {
            console.error(
              "[AddFrame] Failed to store notification token:",
              tokenErr
            );
          }
        }
        // Successfully added - save to localStorage so we don't show again
        localStorage.setItem("miniAppAdded", "true");
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        console.log("[AddFrame] No result returned, user may have cancelled");
        setError("Could not add mini app. Please try again.");
      }
    } catch (err) {
      console.error("[AddFrame] Failed to add frame:", err);
      setError(err instanceof Error ? err.message : "Failed to add mini app");
    } finally {
      setLoading(false);
    }
  }, [addFrame, frameContext]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setIsAnimating(false);
      setDismissed(true);
      onClose?.();
    }, 300);
  }, [onClose]);

  const handleDismiss = useCallback(() => {
    // Save dismissal to localStorage
    localStorage.setItem("addFramePromptDismissed", "true");
    handleClose();
  }, [handleClose]);

  // Don't render if already added, dismissed, or not animating
  if (isAlreadyAdded || dismissed || !isAnimating) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleDismiss}
      />

      {/* Slide-up panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl p-6 pb-8 safe-area-bottom">
          {/* Handle bar */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            {success ? (
              // Success State
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">✓</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-green-600">
                  Added Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  You'll now receive notifications about your Secret Santa
                  chains! 🎄
                </p>
              </>
            ) : (
              // Default State
              <>
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🎅</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Add Secret Santa
                </h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs mx-auto">
                  Add this mini app to your Farcaster client for quick access
                  and to receive notifications about your Secret Santa chains!
                </p>

                {/* Benefits */}
                <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <span>🔔</span>
                    <span>Notifications</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>⚡</span>
                    <span>Quick Access</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🎁</span>
                    <span>Gift Alerts</span>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleAddFrame}
                    disabled={loading}
                    isLoading={loading}
                    className="w-full bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-semibold py-3 rounded-xl"
                  >
                    {loading ? "Adding..." : "Add Mini App"}
                  </Button>

                  <button
                    onClick={handleDismiss}
                    className="w-full text-gray-500 dark:text-gray-400 text-sm py-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AddFramePrompt;
