"use client";

import { useState } from "react";

interface Step {
  emoji: string;
  title: string;
  description: string;
  details?: string[];
}

const STEPS: Step[] = [
  {
    emoji: "🎄",
    title: "Join or Create a Chain",
    description:
      "Find a Secret Santa chain that interests you, or create your own!",
    details: [
      "Browse available chains in the Chains tab",
      "Each chain has a theme, budget range, and deadlines",
      "Create your own chain and invite friends",
      "Share your chain on Farcaster to get more participants",
    ],
  },
  {
    emoji: "🎯",
    title: "Get Matched",
    description:
      "Once enough people join, you'll be secretly assigned someone to gift!",
    details: [
      "Matching happens automatically after the join deadline",
      "You'll see your recipient in the Gifts tab",
      "Your identity stays secret until the reveal date",
      "Only you know who you're gifting to!",
    ],
  },
  {
    emoji: "🎁",
    title: "Send Your Gift",
    description:
      "Send a thoughtful gift to your assigned recipient before the deadline.",
    details: [
      "Click 'Send Gift' in the Gifts tab",
      "Choose to send USDC or ETH on Base",
      "Add a personal message (stays anonymous!)",
      "Your recipient will be notified they received a gift",
    ],
  },
  {
    emoji: "🎉",
    title: "The Big Reveal",
    description:
      "On reveal day, everyone discovers who their Secret Santa was!",
    details: [
      "Identities are revealed on the reveal date",
      "See who sent you a gift",
      "Send a thank you message to your Santa",
      "Share the joy on Farcaster!",
    ],
  },
];

const FAQS = [
  {
    question: "What is a quality score?",
    answer:
      "Your quality score is calculated by Neynar based on your Farcaster activity. A score of 0.28 or higher is required to participate, which helps prevent spam and ensures genuine participants.",
  },
  {
    question: "What currencies can I use?",
    answer:
      "You can send gifts in USDC or ETH on the Base network. The chain creator sets the budget range, so make sure your gift falls within those limits!",
  },
  {
    question: "Is my identity really secret?",
    answer:
      "Yes! Your identity as a gift giver is completely hidden until the reveal date. Only you know who you're gifting to, and only the system knows who's gifting to you.",
  },
  {
    question: "What if I miss the deadline?",
    answer:
      "Try to send your gift before the deadline! If you miss it, your recipient might not receive a gift, which isn't very festive. Set a reminder!",
  },
  {
    question: "Can I join multiple chains?",
    answer:
      "Absolutely! You can join as many chains as you'd like. Each chain is independent, so you'll have different recipients in each one.",
  },
  {
    question: "How do I get notifications?",
    answer:
      "Add the mini app to your Farcaster client when prompted. This enables push notifications for when you're matched, receive gifts, and when reveals happen!",
  },
];

export function HowItWorks() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          How Secret Santa Works
        </h2>
        <p className="text-gray-600 text-sm">
          Anonymous gift-giving magic on Farcaster! 🎅✨
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <button
              onClick={() =>
                setExpandedStep(expandedStep === index ? null : index)
              }
              className="w-full p-4 flex items-center gap-4 text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {step.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 mt-1">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              <div
                className={`text-gray-400 transition-transform ${
                  expandedStep === index ? "rotate-180" : ""
                }`}
              >
                ▼
              </div>
            </button>

            {expandedStep === index && step.details && (
              <div className="px-4 pb-4 pt-0">
                <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-xl p-4">
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <span className="text-green-500 mt-0.5">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
          <span>💡</span> Quick Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span>🔔</span>
            <span>Enable notifications to never miss a gift or reveal!</span>
          </li>
          <li className="flex items-start gap-2">
            <span>📅</span>
            <span>Check deadlines - don't leave your recipient hanging!</span>
          </li>
          <li className="flex items-start gap-2">
            <span>💝</span>
            <span>
              Add a heartfelt message with your gift - it means a lot!
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span>📢</span>
            <span>Share chains on Farcaster to get more participants!</span>
          </li>
        </ul>
      </div>

      {/* FAQs */}
      <div>
        <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
          <span>❓</span> Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedFaq(expandedFaq === index ? null : index)
                }
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <span className="font-medium text-gray-800 text-sm">
                  {faq.question}
                </span>
                <span
                  className={`text-gray-400 transition-transform ${
                    expandedFaq === index ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm mb-2">
          Ready to spread some holiday cheer?
        </p>
        <p className="text-2xl">🎄🎁🎅</p>
      </div>
    </div>
  );
}

export default HowItWorks;
