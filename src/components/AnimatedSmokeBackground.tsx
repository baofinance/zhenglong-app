"use client";

import React, { useMemo } from "react";

const AnimatedSmokeBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map(() => {
      const size = `${Math.random() * 100 + 50}px`;
      return {
        left: `${Math.random() * 100}%`,
        bottom: `-${size}`,
        width: size,
        height: size,
        animationDelay: `${Math.random() * 30}s`,
        animationDuration: `${Math.random() * 30 + 20}s`,
      };
    });
  }, []);

  return (
    <div
      className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {particles.map((style, i) => (
        <div
          key={i}
          className="smoke-particle-el"
          style={style as React.CSSProperties}
        />
      ))}
    </div>
  );
};

export default AnimatedSmokeBackground;
