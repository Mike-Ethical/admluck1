import React from 'react';
import { PawPrint } from 'lucide-react';
import { CoinSide } from '../types';

interface Coin3DProps {
  rotationY: number;
  rotationX: number;
  height: number;
  isSpinning: boolean;
  phase: 'waiting' | 'intro' | 'flipping' | 'landed' | 'finished';
  winnerSide: CoinSide;
}

export const Coin3D: React.FC<Coin3DProps> = ({
  rotationY,
  rotationX,
  height,
  isSpinning,
  phase,
  winnerSide: _winnerSide,
}) => {
  // 3D edge slice offsets to give the coin true physical cylinder thickness
  const edgeSlices = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: '240px', height: '260px' }}>
      {/* 3D Perspective Stage */}
      <div
        className="relative flex items-center justify-center"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
          width: '180px',
          height: '180px',
        }}
      >
        {/* Physical 3D Coin Model */}
        <div
          className="relative w-36 h-36 rounded-full"
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transform: `translateY(${height}px) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
            transition:
              phase === 'intro'
                ? 'transform 0.4s ease-out'
                : phase === 'flipping'
                ? 'transform 2.6s cubic-bezier(0.12, 0.85, 0.28, 1)'
                : phase === 'landed'
                ? 'transform 0.16s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                : 'transform 0.3s ease-out',
            willChange: 'transform',
          }}
        >
          {/* Edge Thickness Layers (Creates true 3D coin cylinder depth) */}
          {edgeSlices.map((z) => (
            <div
              key={z}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                transform: `translateZ(${z}px)`,
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 25%, #78350f 50%, #d97706 75%, #fef08a 100%)',
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.6)',
                border: '1.5px solid rgba(180, 83, 9, 0.7)',
              }}
            />
          ))}

          {/* FRONT FACE: HEADS (Bubblegum Rose Luxury Token) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center overflow-hidden"
            style={{
              transform: 'translateZ(6px)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'radial-gradient(circle at 35% 32%, #ff6b9d 0%, #e11d48 45%, #881337 80%, #4c0519 100%)',
              boxShadow: 'inset 0 0 16px rgba(0,0,0,0.8), 0 0 20px rgba(244,63,94,0.4)',
              border: '4px solid #fbcfe8',
            }}
          >
            {/* Outer Golden Notched Rim */}
            <div className="absolute inset-1 rounded-full border-2 border-dashed border-amber-300/80 pointer-events-none" />

            {/* Specular Radial Sheen */}
            <div
              className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none"
              style={{
                transform: isSpinning ? 'rotate(45deg) translateY(-20%)' : 'rotate(35deg)',
                transition: 'transform 0.5s ease',
              }}
            />

            {/* Inner Ring with Subtle Dark Vignette - Only Paw, No Text */}
            <div className="w-[106px] h-[106px] rounded-full bg-gradient-to-b from-[#2a0818] via-[#430f28] to-[#1d0410] border border-pink-400/60 shadow-inner flex items-center justify-center relative">
              {/* Glowing Heads Paw Icon */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-pink-500/50 rounded-full blur-md" />
                <PawPrint className="w-14 h-14 text-pink-200 fill-pink-400 drop-shadow-[0_0_14px_rgba(244,114,182,1)] relative z-10" />
              </div>
            </div>
          </div>

          {/* BACK FACE: TAILS (Pastel Mint / Cyan Diamond Token) */}
          <div
            className="absolute inset-0 rounded-full flex flex-col items-center justify-center overflow-hidden"
            style={{
              transform: 'rotateY(180deg) translateZ(6px)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'radial-gradient(circle at 35% 32%, #38bdf8 0%, #0284c7 45%, #075985 80%, #082f49 100%)',
              boxShadow: 'inset 0 0 16px rgba(0,0,0,0.8), 0 0 20px rgba(14,165,233,0.4)',
              border: '4px solid #bae6fd',
            }}
          >
            {/* Outer Platinum Notched Rim */}
            <div className="absolute inset-1 rounded-full border-2 border-dashed border-cyan-200/80 pointer-events-none" />

            {/* Specular Radial Sheen */}
            <div
              className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none"
              style={{
                transform: isSpinning ? 'rotate(45deg) translateY(-20%)' : 'rotate(35deg)',
                transition: 'transform 0.5s ease',
              }}
            />

            {/* Inner Ring with Dark Cyan Vignette - Only Paw, No Text */}
            <div className="w-[106px] h-[106px] rounded-full bg-gradient-to-b from-[#061e2b] via-[#0b3247] to-[#04131c] border border-cyan-400/60 shadow-inner flex items-center justify-center relative">
              {/* Glowing Tails Paw Icon */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-cyan-400/50 rounded-full blur-md" />
                <PawPrint className="w-14 h-14 text-cyan-100 fill-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,1)] relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
