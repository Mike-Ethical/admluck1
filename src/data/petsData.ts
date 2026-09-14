import { Pet, PetCategory, PetDemand, PetRarity } from '../types';
import rawAmvggCatalog from './amvggCatalog.json';

export interface AmvggRawItem {
  id: string;
  itemId?: string;
  name: string;
  rarity: string;
  image: string;
  proxyImage?: string;
  value: number;
  frostValue?: number;
  neonValue?: number;
  megaValue?: number;
  demand?: number;
  category?: string;
  origin?: string;
}

function mapRarity(r: string): PetRarity {
  switch (r) {
    case 'Legendary':
      return 'Legendary';
    case 'Ultra-Rare':
      return 'Ultra-Rare';
    case 'Rare':
      return 'Rare';
    case 'Uncommon':
      return 'Uncommon';
    default:
      return 'Common';
  }
}

function mapDemand(d?: number): PetDemand {
  if (typeof d !== 'number') return 'High';
  if (d >= 8) return 'Extreme';
  if (d >= 6) return 'High';
  if (d >= 4) return 'Decent';
  if (d >= 2) return 'Medium';
  return 'Low';
}

function mapCategory(item: AmvggRawItem): PetCategory {
  if (item.value >= 100) return 'High Tier';
  if (item.value >= 15) return 'Mid Tier';
  if (item.name.toLowerCase().includes('egg')) return 'Eggs & Gifts';
  if (item.rarity === 'Legendary') return 'Mid Tier';
  return 'Low Tier';
}

// Convert all extracted AMVGG items into typed Pet records (values 1 or higher only)
export function generateFullAmvggCatalog(): Pet[] {
  return (rawAmvggCatalog as AmvggRawItem[])
    .filter((item) => typeof item.value === 'number' && item.value >= 1)
    .map((item) => ({
      id: item.id || `amvgg-${item.itemId || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: item.name,
      // Always route to AMVGG item image via proxy to guarantee valid webp image load
      image: item.itemId ? `/api/adoptme/item-image/${item.itemId}` : (item.image || ''),
      rarity: mapRarity(item.rarity),
      value: Math.max(1, Math.round(item.value * 10) / 10),
      demand: mapDemand(item.demand),
      neon: true,
      mega: true,
      fly: true,
      ride: true,
      category: mapCategory(item),
      lastUpdated: new Date().toISOString(),
    }));
}

export const initialPets: Pet[] = generateFullAmvggCatalog();

export function getPetImageUrl(name: string, fallback?: string): string {
  const norm = name.trim().toLowerCase();
  const found = initialPets.find((p) => p.name.toLowerCase() === norm);
  if (found && found.image) return found.image;
  const partial = initialPets.find((p) => p.name.toLowerCase().includes(norm) || norm.includes(p.name.toLowerCase()));
  if (partial && partial.image) return partial.image;
  return fallback || '/api/adoptme/item-image/1';
}

// Compute pet value based on variants (Neon: ~3.8x, Mega: ~15.2x, Fly: +12%, Ride: +8%)
export function calculatePetItemValue(
  baseValue: number,
  variant: 'Normal' | 'Neon' | 'Mega',
  fly: boolean,
  ride: boolean
): number {
  let multiplier = 1.0;
  if (variant === 'Neon') {
    multiplier = 3.8;
  } else if (variant === 'Mega') {
    multiplier = 15.2;
  }

  let val = baseValue * multiplier;
  if (fly) val += Math.max(0.5, baseValue * 0.12);
  if (ride) val += Math.max(0.4, baseValue * 0.08);

  return Math.round(val * 10) / 10;
}
