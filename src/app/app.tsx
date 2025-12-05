"use client";

import dynamic from "next/dynamic";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";

const SecretSantaChain = dynamic(
  () => import("~/components/SecretSantaChain"),
  {
    ssr: false,
  }
);

export default function App() {
  const { isFrameReady, setFrameReady } = useMiniKit();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return <SecretSantaChain />;
}
