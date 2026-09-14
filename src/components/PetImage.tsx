import React, { useState, useMemo } from 'react';
import { getPetImageUrl } from '../data/petsData';

interface PetImageProps {
  src?: string;
  alt: string;
  className?: string;
  rarity?: string;
}

export const PetImage: React.FC<PetImageProps> = ({ src, alt, className = 'w-10 h-10', rarity }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-resolve any AMVGG image URL or fallback to AMVGG catalog by pet name
  const effectiveSrc = useMemo(() => {
    if (!src || src.trim() === '') {
      return getPetImageUrl(alt);
    }

    // Convert any direct AMVGG url to proxy to ensure it bypasses Cloudflare referer blocks
    const match = src.match(/(?:adoptmevalues\.gg\/api\/adoptme\/item-image\/|\/api\/adoptme\/item-image\/)(\d+)/);
    if (match) {
      return `/api/adoptme/item-image/${match[1]}`;
    }

    return src;
  }, [src, alt]);

  // Determine fallback color accent based on rarity
  const getRarityBadgeColor = () => {
    switch (rarity) {
      case 'Legendary':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Ultra-Rare':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Rare':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Uncommon':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className={`relative flex items-center justify-center rounded overflow-hidden select-none shrink-0 ${className}`}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-slate-800/40 animate-pulse flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full border border-[#00f090] border-t-transparent animate-spin" />
        </div>
      )}

      {hasError ? (
        // Secondary AMVGG image fallback by name
        <img
          src={getPetImageUrl(alt)}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            // Absolute last resort: clean badge
            (e.target as HTMLElement).style.display = 'none';
          }}
          className="w-full h-full object-contain filter drop-shadow"
        />
      ) : (
        <img
          src={effectiveSrc}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`w-full h-full object-contain filter drop-shadow transition-opacity duration-150 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
    </div>
  );
};
