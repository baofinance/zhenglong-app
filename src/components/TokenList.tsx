"use client";

import { useEffect, useState } from "react";

interface TokenListProps {
  tokens: string[];
  duration: number;
}

export default function TokenList({ tokens, duration }: TokenListProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show each token for 3 seconds
    const DISPLAY_TIME = 3000;
    const FADE_TIME = 500;

    const timer = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((current) => (current + 1) % tokens.length);
        setIsVisible(true);
      }, FADE_TIME);
    }, DISPLAY_TIME + FADE_TIME);

    return () => clearInterval(timer);
  }, [tokens, tokens.length]);

  return (
    <div className="h-16 relative overflow-hidden">
      <div className="token-list">
        <div
          className="token-item"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(10px)",
          }}
        >
          {tokens[currentIndex]}
        </div>
      </div>
      <style jsx>{`
        .token-list {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .token-item {
          position: absolute;
          font-size: 1.125rem;
          font-weight: 500;
          text-align: center;
          width: 100%;
          transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
