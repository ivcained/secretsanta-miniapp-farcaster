"use client";

import { useCallback, useState } from "react";
import { Button } from "~/components/ui/Button";
import { useAddFrame } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";

export function AddMiniAppAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Use MiniKit's useAddFrame hook as primary method
  const addFrame = useAddFrame();

  const handleAddMiniApp = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      // Try OnchainKit's useAddFrame first
      let result = null;
      try {
        result = await addFrame();
        console.log("[AddMiniApp] OnchainKit result:", result);
      } catch (onchainErr) {
        console.log(
          "[AddMiniApp] OnchainKit failed, trying Farcaster SDK:",
          onchainErr
        );
      }

      // If OnchainKit didn't work, try Farcaster SDK's addMiniApp
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
        setStatus("Mini App added successfully! Notifications enabled.");
      } else {
        setError(
          "Failed to add Mini App - user may have cancelled or an error occurred"
        );
      }
    } catch (err) {
      setError(
        `Failed to add Mini App: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [addFrame]);

  return (
    <div className="mb-4">
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
        <pre className="font-mono text-xs text-emerald-500 dark:text-emerald-400">
          sdk.actions.addMiniApp()
        </pre>
      </div>

      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg my-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {status && (
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg my-2 text-xs text-green-600 dark:text-green-400">
          {status}
        </div>
      )}

      <Button onClick={handleAddMiniApp} disabled={loading} isLoading={loading}>
        Add Mini App
      </Button>
    </div>
  );
}
