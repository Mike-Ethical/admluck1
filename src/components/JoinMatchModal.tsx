import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { CoinflipMatch, InventoryItem } from '../types';
import { PetImage } from './PetImage';
import { SideBadge } from './CoinChip';
import { formatCompactValue } from '../utils/format';

interface JoinMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: CoinflipMatch | null;
  inventory: InventoryItem[];
  onJoin: (matchId: string, selectedItemIds: string[]) => Promise<void>;
}

export const JoinMatchModal: React.FC<JoinMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  inventory,
  onJoin,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !match) return null;

  const unlockedItems = inventory.filter((i) => !i.locked);
  const creatorValue = match.creator.totalValue;
  const minRange = Math.max(1, Math.floor(creatorValue * 0.95));
  const maxRange = Math.ceil(creatorValue * 1.05);

  const toggleSelect = (id: string) => {
    setError(null);
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      // Check pet limit
      if (match.maxJoinerPets && prev.length >= match.maxJoinerPets) {
        setError(`This match only allows joining with at most ${match.maxJoinerPets} pet${match.maxJoinerPets > 1 ? 's' : ''}.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const selectedItems = unlockedItems.filter((i) => selectedIds.includes(i.id));
  const totalSelectedValue = Math.round(selectedItems.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;
  const isValueInRange = totalSelectedValue >= minRange && totalSelectedValue <= maxRange;

  // Opponent side is opposite of creator
  const opponentSide = match.creator.side === 'HEADS' ? 'TAILS' : 'HEADS';

  const handleJoin = async () => {
    if (selectedIds.length === 0) {
      setError('Please select pets to match the bet value');
      return;
    }
    if (match.maxJoinerPets && selectedIds.length > match.maxJoinerPets) {
      setError(`Match allows at most ${match.maxJoinerPets} pet${match.maxJoinerPets > 1 ? 's' : ''}`);
      return;
    }
    if (totalSelectedValue < minRange) {
      setError(`Your bet (${totalSelectedValue} Val) is too low. You need at least ${minRange} Val to join.`);
      return;
    }
    if (totalSelectedValue > maxRange) {
      setError(`Your bet (${totalSelectedValue} Val) exceeds the allowed maximum (${maxRange} Val).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onJoin(match.id, selectedIds);
      setSelectedIds([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to join match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0f1420] border border-[#222e44] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#131a29]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2b6bf5] shadow-[0_0_8px_#2b6bf5]" />
            <h2 className="font-gaming font-black text-white text-base tracking-wider uppercase">
              Join Coinflip #{match.id.replace('match-', '')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2337] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Opponent & Match Details Header */}
          <div className="p-3.5 bg-[#111724] rounded-xl border border-[#1b2539] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <img
                src={match.creator.avatarUrl}
                alt={match.creator.username}
                className="w-9 h-9 rounded-full border border-slate-700 object-cover"
              />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-gaming uppercase">Host</span>
                <span className="font-gaming font-bold text-white text-sm">
                  {match.creator.username}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Creator Paw badge - NO text */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-gaming mb-1">Their Paw</span>
                <SideBadge side={match.creator.side} size="md" />
              </div>

              {/* Your Paw badge - NO text */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-gaming mb-1">Your Paw</span>
                <SideBadge side={opponentSide} size="md" />
              </div>

              {/* Pet limit badge if set */}
              {match.maxJoinerPets && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 uppercase font-gaming">Max Pets</span>
                  <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md mt-0.5">
                    {match.maxJoinerPets} Pet{match.maxJoinerPets > 1 ? 's' : ''} Max
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Select Inventory Pets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-gaming font-bold text-xs uppercase tracking-wider text-slate-300">
                Deposit Pets (Target: {minRange} - {maxRange} Val)
                {match.maxJoinerPets && (
                  <span className="text-sky-400 ml-1.5 font-normal">
                    [{selectedIds.length}/{match.maxJoinerPets} pets max]
                  </span>
                )}
              </span>
              <span className="font-mono text-xs text-[#4c82ff] font-bold">
                {formatCompactValue(totalSelectedValue)} / {formatCompactValue(creatorValue)} Val
              </span>
            </div>

            {unlockedItems.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-700/80 rounded-xl text-slate-400 font-gaming text-xs bg-[#0b0f17]">
                No unlocked pets in inventory. Add pets to your vault to join.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 bg-[#0b0f17] rounded-xl border border-[#192233]">
                {unlockedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer relative flex flex-col items-center text-center ${
                        isSelected
                          ? 'bg-[#2b6bf5]/15 border-[#2b6bf5] shadow-[0_0_8px_rgba(43,107,245,0.3)]'
                          : 'bg-[#121927] border-[#1d273a] hover:border-slate-500'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2b6bf5] text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <PetImage src={item.petImage} alt={item.petName} className="w-10 h-10 mb-1" />
                      <span className="font-gaming font-bold text-white text-[11px] truncate w-full">
                        {item.petName}
                      </span>
                      <span className="text-[10px] text-[#4c82ff] font-mono font-bold">
                        {formatCompactValue(item.value)} Val
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1b2538] bg-[#111724] flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-gaming">Your Bet:</span>
              <span className={`text-sm font-bold font-mono ${isValueInRange ? 'text-[#4c82ff]' : 'text-amber-400'}`}>
                {formatCompactValue(totalSelectedValue)} Val
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                / {minRange} - {maxRange} Val
              </span>
            </div>
            {selectedIds.length > 0 && (
              <span className={`text-[10px] font-gaming ${isValueInRange ? 'text-[#4c82ff]' : 'text-rose-400'}`}>
                {isValueInRange
                  ? '✓ Value matches host requirement!'
                  : totalSelectedValue < minRange
                  ? `Need ${(minRange - totalSelectedValue).toFixed(1)} more Val to match`
                  : `Exceeds max by ${(totalSelectedValue - maxRange).toFixed(1)} Val`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-gaming text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={isSubmitting || selectedIds.length === 0 || !isValueInRange}
              id="btn-confirm-join-match"
              className="px-5 py-2 rounded-xl bg-[#2b6bf5] hover:bg-[#1f5de0] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#2b6bf5] text-white font-gaming font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(43,107,245,0.35)] cursor-pointer"
            >
              {isSubmitting ? 'Joining...' : 'Confirm & Flip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
