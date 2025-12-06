"use client";

import { useState, useCallback } from "react";
import { Button } from "~/components/ui/Button";
import { useSendToken } from "@coinbase/onchainkit/minikit";

const DEVELOPER_ADDRESS = "0x98a9b1596f1837eb20669edd4409fdfb02ffadf0";

// Preset amounts for quick selection
const PRESET_AMOUNTS = [
  { value: "1", label: "$1" },
  { value: "5", label: "$5" },
  { value: "10", label: "$10" },
  { value: "25", label: "$25" },
];

interface SupportDeveloperModalProps {
  onClose: () => void;
}

export function SupportDeveloperModal({ onClose }: SupportDeveloperModalProps) {
  const [amount, setAmount] = useState<string>("5");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [success, setSuccess] = useState(false);

  const { sendToken, isPending, error, data } = useSendToken();

  const handleSendToken = useCallback((): void => {
    const finalAmount = isCustom ? customAmount : amount;
    if (!finalAmount || parseFloat(finalAmount) <= 0) return;

    sendToken({
      token: "eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
      amount: (parseFloat(finalAmount) * 1000000).toString(), // Convert to 6 decimals for USDC
      recipientAddress: DEVELOPER_ADDRESS,
    });
  }, [sendToken, amount, customAmount, isCustom]);

  // Check if transaction was successful
  if (data && !success) {
    setSuccess(true);
  }

  const finalAmount = isCustom ? customAmount : amount;
  const isValidAmount = finalAmount && parseFloat(finalAmount) > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            ❤️ Support Developer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {success ? (
          // Success State
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Thank You!
            </h3>
            <p className="text-gray-600 mb-4">
              Your support means the world! 🙏
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You just helped keep the holiday magic alive! ✨
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Description */}
            <p className="text-gray-600 text-sm mb-4">
              Help keep Secret Santa Chain running! Your support helps pay for
              servers, development, and spreading holiday cheer. 🎄
            </p>

            {/* Preset Amounts */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setAmount(preset.value);
                    setIsCustom(false);
                  }}
                  disabled={isPending}
                  className={`py-3 px-2 rounded-xl font-semibold text-sm transition-all ${
                    !isCustom && amount === preset.value
                      ? "bg-gradient-to-r from-red-500 to-green-500 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mb-4">
              <button
                onClick={() => setIsCustom(true)}
                className={`w-full text-left text-sm mb-2 ${
                  isCustom ? "text-green-600 font-semibold" : "text-gray-500"
                }`}
              >
                {isCustom ? "✓ Custom amount" : "Or enter custom amount"}
              </button>
              {isCustom && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="0.01"
                    step="0.01"
                    disabled={isPending}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Payment</span>
                <span className="font-semibold text-gray-800">
                  {isValidAmount ? `${finalAmount} USDC` : "Select amount"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-500">Network</span>
                <span className="font-semibold text-blue-600 flex items-center gap-1">
                  <span className="w-4 h-4 bg-blue-600 rounded-full inline-block"></span>
                  Base
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
                {error.message || "Transaction failed. Please try again."}
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendToken}
              disabled={isPending || !isValidAmount}
              isLoading={isPending}
              className="w-full bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-semibold py-3 rounded-xl"
            >
              {isPending
                ? "Processing..."
                : isValidAmount
                ? `Send ${finalAmount} USDC ❤️`
                : "Select an amount"}
            </Button>

            {/* Footer Note */}
            <p className="text-xs text-gray-400 text-center mt-3">
              Payments are made in USDC on Base network
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default SupportDeveloperModal;
