"use client";

import { useCallback, useState, useEffect } from "react";
import { useAddFrame } from "@coinbase/onchainkit/minikit";
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

    try {
      const notificationDetails = await addFrame();

      if (notificationDetails) {
        // Successfully added, close the prompt
        handleClose();
      }
    } catch (err) {
      console.error("Failed to add frame:", err);
    } finally {
      setLoading(false);
    }
  }, [addFrame]);

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
              Add this mini app to your Farcaster client for quick access and to
              receive notifications about your Secret Santa chains!
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

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleAddFrame}
                disabled={loading}
                isLoading={loading}
                className="w-full bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-semibold py-3 rounded-xl"
              >
                Add Mini App
              </Button>

              <button
                onClick={handleDismiss}
                className="w-full text-gray-500 dark:text-gray-400 text-sm py-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddFramePrompt;
