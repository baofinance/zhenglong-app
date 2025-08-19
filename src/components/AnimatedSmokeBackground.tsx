"use client";

import React, { useState, useEffect } from "react";

const AnimatedSmokeBackground = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 50 }).map(() => {
        const size = `${Math.random() * 100 + 50}px`;
        return {
          left: `${Math.random() * 100}%`,
          bottom: `-${size}`,
          width: size,
          height: size,
          animationDelay: `${Math.random() * 30}s`,
          animationDuration: `${Math.random() * 30 + 20}s`,
        };
      })
    );
  }, []);

  return (
    <div
      className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Glowing gradient band */}
      <div className="absolute inset-0">
        <div className="mx-auto max-w-[1000px] h-72 bg-gradient-to-r from-emerald-600/30 via-teal-500/20 to-emerald-600/30 blur-3xl" />

        {/* Floating glow orbs */}
        <div className="absolute top-10 left-1/4 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-[floatA_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-8 right-1/5 w-52 h-52 bg-teal-400/20 rounded-full blur-3xl animate-[floatB_12s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-[floatC_14s_ease-in-out_infinite]" />
        <div className="absolute top-20 right-1/3 w-24 h-24 bg-emerald-400/15 rounded-full blur-3xl animate-[floatD_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-teal-300/15 rounded-full blur-3xl animate-[floatE_9s_ease-in-out_infinite]" />
      </div>

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
