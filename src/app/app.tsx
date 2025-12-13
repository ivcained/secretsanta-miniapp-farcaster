"use client";

import dynamic from "next/dynamic";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";
import { AddFramePrompt } from "~/components/AddFramePrompt";

const SecretSantaChain = dynamic(
  () => import("~/components/SecretSantaChain"),
  {
    ssr: false,
  }
);

export default function App() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Show add frame prompt when frame is ready (works on both mobile and web)
  useEffect(() => {
    if (isFrameReady) {
      // Small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        setShowAddPrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFrameReady]);

  return (
    <>
      <SecretSantaChain />
      {showAddPrompt && (
        <AddFramePrompt onClose={() => setShowAddPrompt(false)} />
      )}
    </>
  );
}
