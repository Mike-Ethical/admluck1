import React from 'react';

interface BloxLuckLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const BloxLuckLogo: React.FC<BloxLuckLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const dimensions = {
    sm: { width: 28, height: 28, textSize: 'text-base' },
    md: { width: 36, height: 36, textSize: 'text-xl sm:text-2xl' },
    lg: { width: 46, height: 46, textSize: 'text-3xl' },
  }[size];

  return (
    <div className={`relative inline-flex items-center gap-2 select-none ${className}`}>
      {/* Exact SVG rendition of the AdmLuck 3D / dynamic AL gaming emblem */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform -rotate-6 hover:rotate-0 transition-transform duration-200 shrink-0"
      >
        {/* Dynamic speed arcs wrapping around */}
        <path
          d="M14 36 C10 44, 10 56, 18 68 C24 78, 36 86, 52 86"
          stroke="#00f090"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="40 10"
          opacity="0.85"
        />
        <path
          d="M22 22 C14 32, 12 48, 20 62 C26 72, 38 80, 54 82"
          stroke="#26e3a6"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M80 20 C88 28, 92 40, 88 56 C84 70, 72 82, 56 86"
          stroke="#00f090"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="25 8"
          opacity="0.8"
        />

        {/* Outer dark stroke background for high contrast */}
        <g stroke="#08101a" strokeWidth="8" strokeLinejoin="miter">
          {/* Slanted A */}
          <path
            d="M24 80 L38 24 L52 24 L66 80 L52 80 L48 62 L38 62 L34 80 Z"
            fill="#0c1724"
          />
          {/* Slanted L attached/interlocking */}
          <path
            d="M58 42 L70 42 L70 70 L88 70 L88 80 L58 80 Z"
            fill="#0c1724"
          />
        </g>

        {/* Inner turquoise fill with gradient and edge highlights */}
        <g fill="none" stroke="#00f090" strokeWidth="3.5" strokeLinejoin="miter">
          <path
            d="M26 78 L38 26 L50 26 L62 78 L52 78 L48 62 L38 62 L34 78 Z"
            fill="#0d1f2d"
          />
          {/* Inner A cutout */}
          <polygon points="44,36 40,54 48,54" fill="#00f090" stroke="none" />

          {/* L shape accent */}
          <path
            d="M56 46 L68 46 L68 68 L84 68 L84 78 L56 78 Z"
            fill="#00f090"
            stroke="#00f090"
            strokeWidth="1"
          />
        </g>

        {/* Top-right shine highlight */}
        <circle cx="70" cy="22" r="2.5" fill="#ffffff" />
        <circle cx="20" cy="40" r="1.5" fill="#ffffff" opacity="0.8" />
      </svg>

      {/* AdmLuck Brand Text in gaming logo typography */}
      {showText && (
        <span className={`font-gaming font-black tracking-wider uppercase italic drop-shadow-md flex items-center leading-none ${dimensions.textSize}`}>
          <span className="text-white">Adm</span>
          <span className="text-[#00f090] drop-shadow-[0_0_12px_rgba(0,240,144,0.65)]">Luck</span>
        </span>
      )}
    </div>
  );
};
