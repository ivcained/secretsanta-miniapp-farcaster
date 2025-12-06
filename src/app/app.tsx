"use client";

import dynamic from "next/dynamic";
import { useMiniKit, useIsInMiniApp } from "@coinbase/onchainkit/minikit";
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
  const { isInMiniApp } = useIsInMiniApp();
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Show add frame prompt when in miniapp
  useEffect(() => {
    if (isFrameReady && isInMiniApp) {
      setShowAddPrompt(true);
    }
  }, [isFrameReady, isInMiniApp]);

  return (
    <>
      <SecretSantaChain />
      {showAddPrompt && (
        <AddFramePrompt onClose={() => setShowAddPrompt(false)} />
      )}
    </>
  );
}
