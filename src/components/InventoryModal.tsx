import React, { useState } from 'react';
import {
  X,
  Search,
  PackageCheck,
  Send,
  AlertCircle,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownToLine,
  Check,
  ExternalLink,
  MessageCircle,
  Sparkles,
  CheckSquare,
  Square,
  Gift
} from 'lucide-react';
import { InventoryItem, User } from '../types';
import { PetImage } from './PetImage';
import { formatCompactValue } from '../utils/format';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onWithdraw: (itemIds: string[]) => Promise<{ discordLink?: string }>;
  robloxUsername: string;
  user: User;
  discordLink: string;
  onOpenRobloxVerify: () => void;
  onInventoryRefreshed?: () => void;
}

type TabType = 'ALL' | 'LEGENDARY' | 'ULTRA-RARE' | 'RARE' | 'UNCOMMON' | 'COMMON' | 'NEON' | 'MEGA';

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onWithdraw,
  robloxUsername,
  user,
  discordLink,
  onOpenRobloxVerify,
  onInventoryRefreshed,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isWithdrawMode, setIsWithdrawMode] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState<{ count: number; value: number } | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Tipping state
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipTargetUser, setTipTargetUser] = useState('');
  const [isTipping, setIsTipping] = useState(false);
  const [tipSuccessMessage, setTipSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalValue = inventory.reduce((acc, curr) => acc + curr.totalValue, 0);

  // Available pets that are not locked in active matches
  const availableItems = inventory.filter((item) => !item.locked);

  // Filter items based on tab & search
  const filteredItems = inventory.filter((item) => {
    // Search
    if (searchQuery && !item.petName.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
      return false;
    }

    // Tabs
    if (activeTab === 'ALL') return true;
    if (activeTab === 'NEON') return item.neon;
    if (activeTab === 'MEGA') return item.mega;
    return item.rarity.toUpperCase() === activeTab;
  });

  const toggleSelectPet = (id: string, locked: boolean) => {
    if (locked) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === availableItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableItems.map((i) => i.id)));
    }
  };

  const handleQuickWithdrawSingle = (item: InventoryItem) => {
    if (!user.verified) {
      onOpenRobloxVerify();
      return;
    }
    setSelectedIds(new Set([item.id]));
    setConfirmModalOpen(true);
  };

  const handleStartWithdrawFlow = () => {
    if (!user.verified) {
      onOpenRobloxVerify();
      return;
    }
    if (inventory.length === 0) {
      setErrorNotice('Your inventory is empty. Deposit Adopt Me pets first.');
      setTimeout(() => setErrorNotice(null), 3500);
      return;
    }
    setIsWithdrawMode(true);
  };

  const handleOpenConfirmModal = () => {
    if (!user.verified) {
      onOpenRobloxVerify();
      return;
    }
    if (selectedIds.size === 0) {
      setErrorNotice('Please select at least one pet to withdraw.');
      setTimeout(() => setErrorNotice(null), 3000);
      return;
    }
    setConfirmModalOpen(true);
  };

  const handleExecuteWithdraw = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmittingWithdraw(true);
    setErrorNotice(null);

    const itemsToWithdraw = inventory.filter((i) => selectedIds.has(i.id));
    const totalVal = Math.round(itemsToWithdraw.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;
    const count = itemsToWithdraw.length;

    try {
      const res = await onWithdraw(Array.from(selectedIds));
      const targetDiscord = res?.discordLink || discordLink || 'https://discord.gg/bloxluck';

      // Pets disappear from inventory after confirming!
      setSelectedIds(new Set());
      setConfirmModalOpen(false);
      setIsWithdrawMode(false);
      setWithdrawSuccess({ count, value: totalVal });

      // Automatically send them to the discord server link which owner has the right to edit!
      try {
        window.open(targetDiscord, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked, using fallback link button', e);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to process withdrawal.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleExecuteTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipTargetUser.trim() || selectedIds.size === 0) return;
    const petId = Array.from(selectedIds)[0];
    const pet = inventory.find((p) => p.id === petId);
    if (!pet) return;

    setIsTipping(true);
    setErrorNotice(null);
    try {
      const res = await fetch('/api/tip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientUsername: tipTargetUser.trim(),
          petId: pet.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to tip pet');
      }
      setTipSuccessMessage(data.message || `Successfully tipped ${pet.petName} to ${tipTargetUser}!`);
      setIsTipModalOpen(false);
      setSelectedIds(new Set());
      setTipTargetUser('');
      if (onInventoryRefreshed) {
        onInventoryRefreshed();
      }
      setTimeout(() => setTipSuccessMessage(null), 6000);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to tip pet');
    } finally {
      setIsTipping(false);
    }
  };

  const tabs: TabType[] = [
    'ALL',
    'LEGENDARY',
    'ULTRA-RARE',
    'RARE',
    'UNCOMMON',
    'COMMON',
    'NEON',
    'MEGA',
  ];

  const selectedItemsList = inventory.filter((i) => selectedIds.has(i.id));
  const selectedTotalValue = Math.round(selectedItemsList.reduce((acc, curr) => acc + curr.totalValue, 0) * 10) / 10;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-[#0e131d] border-0 sm:border border-[#202c42] rounded-none sm:rounded-2xl w-full h-full sm:h-auto sm:max-h-[82vh] sm:max-w-4xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-b border-[#1b2538] flex items-center justify-between bg-[#121825] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#00f090]/20 border border-[#00f090]/40 flex items-center justify-center text-[#00f090] shrink-0">
              <PackageCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-gaming font-black text-white text-xs sm:text-sm tracking-wider uppercase">
                  Adopt Me Vault
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#172236] text-[#00f090] font-mono border border-[#00f090]/30">
                  {inventory.length}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 font-mono">
                <span>Account: <strong className="text-white">{robloxUsername || 'cute240bunny'}</strong></span>
                <span className="text-[#00f090] font-bold">
                  {formatCompactValue(totalValue)} Val
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Controls: Deposit & Withdraw & Close */}
          <div className="flex items-center gap-2">
            {/* Deposit Button */}
            <button
              onClick={() => setIsDepositOpen(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#00f090] hover:bg-[#00dc82] text-slate-950 font-gaming font-black text-[11px] sm:text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(0,240,144,0.3)]"
              title="Deposit Adopt Me pets into your vault"
            >
              <ArrowDownToLine className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              <span>Deposit</span>
            </button>

            {/* Withdraw Button */}
            <button
              onClick={() => {
                if (isWithdrawMode) {
                  setIsWithdrawMode(false);
                  setSelectedIds(new Set());
                } else {
                  handleStartWithdrawFlow();
                }
              }}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg font-gaming font-black text-[11px] sm:text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer border ${
                isWithdrawMode
                  ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'bg-[#151e2f] hover:bg-[#1c283f] text-amber-300 border-amber-400/40'
              }`}
              title="Withdraw your Adopt Me pets via Discord delivery"
            >
              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              <span>{isWithdrawMode ? 'Cancel' : 'Withdraw'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Withdrawal Successful Banner with Discord Link */}
        {withdrawSuccess && (
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-950/90 to-[#0e1f18] border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00f090] shrink-0" />
              <span>
                <strong>Withdrawal Confirmed!</strong> {withdrawSuccess.count} pet(s) ({formatCompactValue(withdrawSuccess.value)} Val) removed from your vault.
              </span>
            </div>
            <a
              href={discordLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#5865F2] hover:bg-[#4752C4] text-white font-gaming font-black text-xs transition shadow cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Open Discord Server</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        )}

        {/* Tip Successful Banner */}
        {tipSuccessMessage && (
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-950/90 to-[#0e1f18] border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#00f090] shrink-0" />
              <span>
                <strong>Tip Sent!</strong> {tipSuccessMessage}
              </span>
            </div>
            <button
              onClick={() => setTipSuccessMessage(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Notice alert */}
        {errorNotice && (
          <div className="px-4 py-2 bg-rose-500/20 border-b border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Deposit Info Panel Overlay */}
        {isDepositOpen && (
          <div className="p-4 bg-[#101726] border-b border-[#1f2b42] text-slate-300 text-xs animate-fadeIn">
            <div className="flex items-start justify-between">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-white font-gaming font-bold text-sm">
                  <ArrowDownToLine className="w-4 h-4 text-[#00f090]" />
                  <span>How to Deposit Adopt Me Pets</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  To deposit pets into your AdmLuck vault, join our official Discord community. Open a deposit trade ticket, and our automated bot will send you a server invite inside Roblox Adopt Me to transfer your pets safely.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={discordLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-gaming font-black text-xs transition shadow-md cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Join Official Discord Server</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>
                  <button
                    onClick={() => setIsDepositOpen(false)}
                    className="px-3 py-2 rounded-lg bg-[#182338] text-slate-400 hover:text-white font-gaming text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={() => setIsDepositOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Search & Tabs bar */}
        <div className="p-2.5 sm:p-3.5 border-b border-[#1b2538] bg-[#101521] space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search inventory pets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#151c2a] border border-[#222c3f] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00f090]"
              />
            </div>

            {/* In-game legitimate trading notice badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-[#141b27] px-2.5 py-1.5 rounded border border-[#212b3e]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00f090]" />
              <span>In-game delivery via Discord</span>
            </div>
          </div>

          {/* Rarity & Modifier Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded text-[11px] font-gaming font-bold tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#00f090] text-slate-950 shadow-[0_0_8px_rgba(0,240,144,0.3)]'
                    : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Pet Grid showing pets WHICH the person actually has */}
        <div className="p-2.5 sm:p-4 overflow-y-auto flex-1 bg-[#0b0f17]">
          {inventory.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-400 font-gaming space-y-3">
              <PackageCheck className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-sm sm:text-base font-bold text-white">Your inventory has no pets</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                You currently do not have any Adopt Me pets deposited in your AdmLuck vault. Click below to deposit pets or win coinflips!
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsDepositOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#00f090] hover:bg-[#00dc82] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,240,144,0.3)] cursor-pointer"
                >
                  Deposit Adopt Me Pets
                </button>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-500 font-gaming text-xs sm:text-sm">
              No pets found matching this filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isWithdrawMode) {
                        toggleSelectPet(item.id, item.locked);
                      }
                    }}
                    className={`bg-[#121825] border rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition-all group relative ${
                      isWithdrawMode && !item.locked ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/40 bg-[#192233]'
                        : 'border-[#1e273a] hover:border-[#2d3b54]'
                    }`}
                  >
                    {/* Modifiers Pill: F / R / N / M */}
                    <div className="flex items-center gap-1 mb-1 flex-wrap">
                      {isWithdrawMode && (
                        <div className="mr-0.5">
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                      )}
                      {item.fly && (
                        <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[8px] sm:text-[9px] font-bold font-mono">
                          F
                        </span>
                      )}
                      {item.ride && (
                        <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-400 border border-purple-500/40 text-[8px] sm:text-[9px] font-bold font-mono">
                          R
                        </span>
                      )}
                      {item.neon && (
                        <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[8px] sm:text-[9px] font-bold font-mono">
                          NEON
                        </span>
                      )}
                      {item.mega && (
                        <span className="px-1 py-0.2 rounded bg-gradient-to-r from-pink-500/30 to-amber-500/30 text-amber-300 border border-amber-500/40 text-[8px] sm:text-[9px] font-bold font-mono">
                          MEGA
                        </span>
                      )}
                      <span className="ml-auto text-[9px] text-slate-500 font-mono">
                        x{item.quantity}
                      </span>
                    </div>

                    {/* Pet Image */}
                    <div className="w-full h-16 sm:h-20 flex items-center justify-center my-0.5 bg-[#0d121c] rounded-lg p-1.5 border border-slate-800/80 group-hover:border-slate-700 transition-colors">
                      <PetImage src={item.petImage} alt={item.petName} className="w-14 h-14 sm:w-16 sm:h-16" rarity={item.rarity} />
                    </div>

                    {/* Name & Value */}
                    <div className="mt-1 text-center">
                      <span className="font-gaming font-bold text-white text-[11px] sm:text-xs block truncate" title={item.petName}>
                        {item.petName}
                      </span>
                      <span className="text-[#00f090] font-mono font-bold text-[10px] sm:text-xs">
                        {formatCompactValue(item.value)} Val
                      </span>
                    </div>

                    {/* Delivery / Withdraw Action */}
                    <div className="mt-1.5 pt-1.5 border-t border-[#1a2335] flex items-center justify-between">
                      <span
                        className={`text-[8px] sm:text-[9px] font-gaming font-bold ${
                          item.locked
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {item.locked ? 'LOCKED' : 'Vault'}
                      </span>

                      {!item.locked && !isWithdrawMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickWithdrawSingle(item);
                          }}
                          className="px-1.5 sm:px-2 py-0.5 rounded bg-[#172132] hover:bg-amber-400 text-slate-300 hover:text-slate-950 text-[9px] sm:text-[10px] font-gaming font-bold transition-all cursor-pointer flex items-center gap-1 border border-slate-700/60 hover:border-amber-400"
                          title="Withdraw this pet to your Roblox account"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Withdraw</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Bottom Bar when in Withdraw Mode */}
        {isWithdrawMode && (
          <div className="p-2 sm:p-3 bg-[#121826] border-t border-[#223048] flex items-center justify-between gap-2 shrink-0 shadow-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 rounded bg-[#162032] hover:bg-[#1d2b44] text-slate-300 font-gaming text-xs flex items-center gap-1 cursor-pointer border border-[#23314d]"
              >
                {selectedIds.size === availableItems.length && availableItems.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#00f090]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className="hidden sm:inline">Select All</span>
                <span>({availableItems.length})</span>
              </button>
              <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <span>Selected: <strong className="text-[#00f090]">{selectedIds.size}</strong></span>
                <span className="text-slate-500 hidden xs:inline">·</span>
                <span className="text-[#00f090] hidden xs:flex items-center font-mono">
                  <span>{selectedTotalValue} Val</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {selectedIds.size === 1 && (
                <button
                  onClick={() => {
                    const id = Array.from(selectedIds)[0];
                    const item = inventory.find((i) => i.id === id);
                    if (item) {
                      setIsTipModalOpen(true);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded bg-[#162032] hover:bg-[#1f2d47] text-[#00f090] border border-[#00f090]/40 font-gaming text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Gift className="w-3 h-3 text-[#00f090]" />
                  <span>Tip</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsWithdrawMode(false);
                  setSelectedIds(new Set());
                }}
                className="px-2.5 py-1.5 rounded bg-[#162032] hover:bg-slate-700 text-slate-300 font-gaming text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenConfirmModal}
                disabled={selectedIds.size === 0}
                className="px-3.5 py-1.5 rounded bg-[#00f090] hover:bg-[#00d980] text-slate-950 font-gaming font-black text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 cursor-pointer shadow-md"
              >
                <Send className="w-3 h-3 fill-current" />
                <span>Withdraw ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        )}

        {/* Tip Pet Modal */}
        {isTipModalOpen && selectedIds.size === 1 && (() => {
          const selectedPet = inventory.find((i) => i.id === Array.from(selectedIds)[0]);
          if (!selectedPet) return null;
          return (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-60 flex items-center justify-center p-4 select-none animate-fadeIn">
              <div className="bg-[#101624] border-2 border-[#00f090] rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#1e2a3f] pb-3">
                  <div className="flex items-center gap-2 text-[#00f090] font-gaming font-black text-sm uppercase">
                    <Gift className="w-5 h-5 text-[#00f090]" />
                    <span>Tip Adopt Me Pet</span>
                  </div>
                  <button
                    onClick={() => setIsTipModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 bg-[#0a0f18] rounded-lg border border-[#1b2538] flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-slate-900 flex items-center justify-center p-1 shrink-0">
                    <PetImage src={selectedPet.petImage} alt={selectedPet.petName} className="w-10 h-10" rarity={selectedPet.rarity} />
                  </div>
                  <div>
                    <div className="font-bold text-white font-gaming text-sm">{selectedPet.petName}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      Value: <span className="text-[#00f090] font-bold">{selectedPet.totalValue} Val</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleExecuteTip} className="space-y-3">
                  <div>
                    <label className="text-xs font-gaming text-slate-300 block mb-1">
                      Recipient Username
                    </label>
                    <input
                      type="text"
                      required
                      value={tipTargetUser}
                      onChange={(e) => setTipTargetUser(e.target.value)}
                      placeholder="e.g. cute240bunny, player123"
                      className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00f090] focus:outline-none font-gaming"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Tip will transfer this pet immediately and broadcast a chat celebration!
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2a3f]">
                    <button
                      type="button"
                      onClick={() => setIsTipModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-[#172132] text-slate-300 hover:text-white font-gaming text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isTipping || !tipTargetUser.trim()}
                      className="px-5 py-2 rounded-lg bg-[#00f090] hover:bg-[#00d980] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      {isTipping ? (
                        <span>Sending Tip...</span>
                      ) : (
                        <>
                          <Gift className="w-3.5 h-3.5" />
                          <span>Send Tip</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

        {/* Withdrawal Confirmation Dialog */}
        {confirmModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-60 flex items-center justify-center p-4 select-none animate-fadeIn">
            <div className="bg-[#101624] border-2 border-[#00f090] rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1e2a3f] pb-3">
                <div className="flex items-center gap-2 text-[#00f090] font-gaming font-black text-sm uppercase">
                  <ArrowUpRight className="w-5 h-5 text-[#00f090]" />
                  <span>Confirm Pet Withdrawal</span>
                </div>
                <button
                  onClick={() => setConfirmModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to withdraw the following <strong>{selectedIds.size} pet(s)</strong> (Total Value: <strong className="text-[#00f090]">{formatCompactValue(selectedTotalValue)} Val</strong>)?
              </p>

              {/* Selected Pets Preview */}
              <div className="max-h-48 overflow-y-auto space-y-2 bg-[#090d15] p-3 rounded-lg border border-[#1b2538]">
                {selectedItemsList.map((pet) => (
                  <div key={pet.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center p-1">
                        <PetImage src={pet.petImage} alt={pet.petName} className="w-6 h-6" rarity={pet.rarity} />
                      </div>
                      <span className="font-bold text-white">{pet.petName}</span>
                    </div>
                    <span className="text-[#00f090] font-mono font-bold">{formatCompactValue(pet.totalValue)} Val</span>
                  </div>
                ))}
              </div>

              {/* Discord Delivery Notice */}
              <div className="p-3 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#8ea1e1] text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-white">
                  <MessageCircle className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>Automatic Discord Redirect:</span>
                </div>
                <p>
                  Upon clicking confirm, these chosen pets will <strong>disappear from your AdmLuck inventory</strong>, and you will be immediately sent to our official Discord server to claim your in-game Adopt Me trade ticket.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2a3f]">
                <button
                  onClick={() => setConfirmModalOpen(false)}
                  disabled={isSubmittingWithdraw}
                  className="px-4 py-2 rounded-lg bg-[#172132] text-slate-300 hover:text-white font-gaming text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteWithdraw}
                  disabled={isSubmittingWithdraw}
                  className="px-5 py-2 rounded-lg bg-[#00f090] hover:bg-[#00d980] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-lg flex items-center gap-2"
                >
                  {isSubmittingWithdraw ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 fill-current" />
                      <span>Confirm & Go to Discord</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
