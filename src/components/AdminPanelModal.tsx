import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  PlusCircle,
  Users,
  Database,
  History,
  CheckCircle,
  AlertCircle,
  Upload,
  Lock,
  Trash2,
  MessageCircle,
  ExternalLink,
  Save,
  Search
} from 'lucide-react';
import { Pet, InventoryItem, AdminAuditLog, User } from '../types';
import { PetImage } from './PetImage';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onInventoryUpdated: () => void;
}

type AdminTab = 'add-pet' | 'users' | 'catalog' | 'importer' | 'discord' | 'audit';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onInventoryUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('add-pet');
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Add Pet Form State
  const [targetUsername, setTargetUsername] = useState(currentUser.username);
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [petSearchFilter, setPetSearchFilter] = useState('');
  const [useCustomPet, setUseCustomPet] = useState(false);
  const [customPetName, setCustomPetName] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customValue, setCustomValue] = useState('1');
  const [variant, setVariant] = useState<'Normal' | 'Neon' | 'Mega'>('Normal');
  const [fly, setFly] = useState(true);
  const [ride, setRide] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Admin grant for testing/payout');

  // Value edit state
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [newPetValue, setNewPetValue] = useState<number>(0);

  // Status message
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Selected user for inventory inspection
  const [inspectUserId, setInspectUserId] = useState<string>(currentUser.id);
  const [inspectItems, setInspectItems] = useState<InventoryItem[]>([]);

  // AMVGG Importer State
  const [importJson, setImportJson] = useState('');

  // Discord Server Settings State (Owner editable)
  const [discordLinkInput, setDiscordLinkInput] = useState('https://discord.gg/bloxluck');
  const [savingDiscord, setSavingDiscord] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsUnauthorized(false);
      setMessage(null);
      return;
    }

    // Fast-path client check: cute240bunny (Roblox User ID: 3058833903)
    const rawId = String(currentUser.robloxUserId || '').trim();
    const isOwnerId = rawId === '3058833903' || rawId.includes('3058833903') || currentUser.id.includes('3058833903');
    const nameStr = (currentUser.robloxUsername || currentUser.username || '').toLowerCase().trim();
    const isOwnerName = nameStr === 'cute240bunny' || currentUser.id.toLowerCase().includes('cute240bunny');
    const isAdminRole = currentUser.role === 'admin';

    if (!currentUser.verified || !isAdminRole || (!isOwnerId && !isOwnerName)) {
      setIsUnauthorized(true);
      return;
    }
    setIsUnauthorized(false);

    // Load admin data with server-side check
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // 0. Verify server-side authorization check first
        const checkRes = await fetch('/api/admin/check');
        if (checkRes.status === 403 || !checkRes.ok) {
          setIsUnauthorized(true);
          return;
        }

        // 1. Fetch users
        const usersRes = await fetch('/api/admin/users');
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }

        // 2. Fetch pets
        const petsRes = await fetch('/api/pets?limit=200');
        if (petsRes.ok) {
          const petsData = await petsRes.json();
          setPets(petsData.pets || []);
          if (petsData.pets?.length > 0 && !selectedPetId) {
            setSelectedPetId(petsData.pets[0].id);
          }
        }

        // 3. Fetch audit logs
        const auditRes = await fetch('/api/admin/audit-log');
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditLogs(auditData.logs || []);
        }

        // 4. Fetch system settings (Discord link)
        try {
          const setRes = await fetch('/api/settings');
          if (setRes.ok) {
            const setData = await setRes.json();
            if (setData.discordLink) {
              setDiscordLinkInput(setData.discordLink);
            }
          }
        } catch (e) {
          console.error(e);
        }

        // 5. Fetch inspect items
        fetchUserInventory(inspectUserId || currentUser.id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isOpen, currentUser.id, currentUser.robloxUserId, currentUser.role]);

  const fetchUserInventory = async (uid: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setInspectItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPetToInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername) return;
    if (!useCustomPet && !selectedPetId) return;
    if (useCustomPet && !customPetName) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/inventory/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: targetUsername.trim(),
          petId: useCustomPet ? undefined : selectedPetId,
          petName: useCustomPet ? customPetName.trim() : undefined,
          imageUrl: useCustomPet && customImageUrl ? customImageUrl.trim() : undefined,
          value: useCustomPet ? Math.max(1, Number(customValue) || 1) : undefined,
          variant,
          fly,
          ride,
          quantity: Number(quantity),
          reason,
        }),
      });

      if (res.status === 403) {
        setIsUnauthorized(true);
        setMessage({ type: 'error', text: '403 Forbidden: Only cute240bunny (Roblox ID 3058833903) can execute admin actions.' });
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        onInventoryUpdated();
        // Refresh audit logs
        const auditRes = await fetch('/api/admin/audit-log');
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add pet' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Server error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from user inventory?')) return;
    try {
      const res = await fetch('/api/admin/inventory/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, reason: 'Admin manual removal' }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      if (res.ok) {
        fetchUserInventory(inspectUserId);
        onInventoryUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateValue = async (petId: string) => {
    try {
      const res = await fetch('/api/admin/pets/update-value', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ petId, newValue: newPetValue }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      if (res.ok) {
        setEditingPetId(null);
        // refresh pets
        const petsRes = await fetch('/api/pets?limit=200');
        const petsData = await petsRes.json();
        setPets(petsData.pets || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePetStatus = async (petId: string, currentDisabled: boolean) => {
    try {
      const res = await fetch('/api/admin/pets/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ petId, disabled: !currentDisabled }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      const petsRes = await fetch('/api/pets?limit=200');
      const petsData = await petsRes.json();
      setPets(petsData.pets || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportAmvggCatalog = async () => {
    if (!importJson.trim()) return;
    try {
      const parsed = JSON.parse(importJson);
      const res = await fetch('/api/pets/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ petsData: parsed, source: 'AMVGG JSON Import' }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Imported ${data.importedCount} pets successfully!` });
        setImportJson('');
        const petsRes = await fetch('/api/pets?limit=200');
        const petsData = await petsRes.json();
        setPets(petsData.pets || []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Import failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Invalid JSON format: ' + err.message });
    }
  };

  const handleSaveDiscordLink = async () => {
    if (!discordLinkInput.trim().startsWith('http')) {
      setMessage({ type: 'error', text: 'Discord link must start with https://' });
      return;
    }
    setSavingDiscord(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ discordLink: discordLinkInput.trim() }),
      });
      if (res.status === 403) {
        setMessage({ type: 'error', text: '403 Forbidden: Admin privileges required.' });
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Discord server link updated to "${data.discordLink}"` });
        setDiscordLinkInput(data.discordLink);
        // Refresh audit logs
        const auditRes = await fetch('/api/admin/audit-log');
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save Discord link' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating settings' });
    } finally {
      setSavingDiscord(false);
    }
  };

  if (!isOpen) return null;

  // Genuine 403 Forbidden State if non-admin or unverified user attempts access
  if (!currentUser.verified || currentUser.role !== 'admin' || isUnauthorized) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-[#121722] border border-rose-500/50 rounded-xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="font-gaming font-black text-white text-lg uppercase tracking-wider">
            403 Forbidden
          </h3>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[11px] font-bold">
            RESTRICTED ADMIN PORTAL
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Strict server-side permission checks enforced: <strong>@cute240bunny</strong> (Roblox ID: <strong>3058833903</strong>) is the sole authorized administrator. Non-admin users are strictly denied access.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-slate-800 text-white font-gaming text-xs font-bold hover:bg-slate-700 transition cursor-pointer border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-[#0e131d] border border-[#202c42] rounded-xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1b2538] flex items-center justify-between bg-[#121825]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-gaming font-black text-white text-base tracking-wider uppercase flex items-center gap-2">
                AdmLuck Admin Control Center
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SERVER PROTECTED
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Notice */}
        {message && (
          <div
            className={`px-5 py-2 text-xs flex items-center gap-2 border-b ${
              message.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-[#101521] border-b border-[#1b2538] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('add-pet')}
            className={`px-3 py-1.5 rounded text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add-pet'
                ? 'bg-[#00f090] text-slate-950 shadow-[0_0_8px_rgba(0,240,144,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Pet to User</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-[#00f090] text-slate-950 shadow-[0_0_8px_rgba(0,240,144,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Inventories</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-[#00f090] text-slate-950 shadow-[0_0_8px_rgba(0,240,144,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Pet Values & Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab('importer')}
            className={`px-3 py-1.5 rounded text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'importer'
                ? 'bg-[#00f090] text-slate-950 shadow-[0_0_8px_rgba(0,240,144,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>AMVGG Importer</span>
          </button>

          <button
            onClick={() => setActiveTab('discord')}
            className={`px-3 py-1.5 rounded text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'discord'
                ? 'bg-[#00f090] text-slate-950 shadow-[0_0_8px_rgba(0,240,144,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Discord Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded text-xs font-gaming font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-[#00f090] text-slate-950 shadow-[0_0_8px_rgba(0,240,144,0.3)]'
                : 'bg-[#151c2a] text-slate-400 hover:text-slate-200 border border-[#20293b]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#0b0f17]">
          {/* TAB 1: ADD PET TO INVENTORY */}
          {activeTab === 'add-pet' && (
            <form onSubmit={handleAddPetToInventory} className="max-w-2xl space-y-4 mx-auto">
              <div className="p-4 bg-[#111724] border border-[#1d273a] rounded-xl space-y-4">
                <span className="font-gaming font-bold text-sm text-white block uppercase tracking-wider">
                  Admin Add Pet Form
                </span>

                {/* 1. Target Username */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-gaming text-slate-400 block">
                      Target Username (Select or Type Any Username)
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                      placeholder="e.g. novapxa or Admin"
                      className="flex-1 bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-gaming"
                    />
                    {users.length > 0 && (
                      <select
                        value={targetUsername}
                        onChange={(e) => setTargetUsername(e.target.value)}
                        className="bg-[#151c2a] border border-[#232f45] rounded-lg px-2 py-2 text-xs text-slate-300 focus:border-amber-400 focus:outline-none max-w-[140px]"
                      >
                        <option value="">Choose user...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.username}>
                            {u.username}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* 2. Pet Selector Mode: Catalog vs Custom */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-gaming text-slate-400 block">
                      Pet Selection Mode
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setUseCustomPet(false)}
                        className={`px-2 py-1 rounded text-[10px] font-gaming font-bold tracking-wider transition-colors cursor-pointer border ${
                          !useCustomPet
                            ? 'bg-[#00f090] text-slate-950 border-[#00f090]'
                            : 'bg-[#151c2a] text-slate-400 border-[#222c3f]'
                        }`}
                      >
                        Catalog ({pets.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseCustomPet(true)}
                        className={`px-2 py-1 rounded text-[10px] font-gaming font-bold tracking-wider transition-colors cursor-pointer border ${
                          useCustomPet
                            ? 'bg-[#00f090] text-slate-950 border-[#00f090]'
                            : 'bg-[#151c2a] text-slate-400 border-[#222c3f]'
                        }`}
                      >
                        Custom Pet URL
                      </button>
                    </div>
                  </div>

                  {!useCustomPet ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={petSearchFilter}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPetSearchFilter(val);
                            const matched = pets.filter((p) => p.name.toLowerCase().includes(val.toLowerCase()));
                            if (matched.length > 0 && !matched.some((p) => p.id === selectedPetId)) {
                              setSelectedPetId(matched[0].id);
                            }
                          }}
                          placeholder="Search pet by name (e.g. Bat Dragon, Shadow Dragon, Cow, Frost...)"
                          className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00f090] focus:outline-none"
                        />
                      </div>

                      {/* Filtered Pet Grid / Quick Select */}
                      <div className="max-h-44 overflow-y-auto bg-[#0d121c] border border-[#1e283d] rounded-lg p-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {pets
                          .filter((p) => p.name.toLowerCase().includes(petSearchFilter.toLowerCase()))
                          .slice(0, 30)
                          .map((p) => {
                            const isSelected = p.id === selectedPetId;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPetId(p.id)}
                                className={`flex items-center gap-2 p-1.5 rounded text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#00f090]/20 border border-[#00f090] text-white'
                                    : 'hover:bg-[#141b29] text-slate-300 border border-transparent'
                                }`}
                              >
                                <PetImage src={p.image} alt={p.name} className="w-7 h-7 shrink-0" rarity={p.rarity} />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold font-gaming truncate">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                                    <span className="text-[#00f090] font-bold">{p.value} Val</span>
                                    <span>•</span>
                                    <span>{p.rarity}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="w-3.5 h-3.5 text-[#00f090] shrink-0 mr-1" />
                                )}
                              </button>
                            );
                          })}
                        {pets.filter((p) => p.name.toLowerCase().includes(petSearchFilter.toLowerCase())).length === 0 && (
                          <div className="col-span-full py-4 text-center text-slate-500 text-xs font-gaming">
                            No pets found matching "{petSearchFilter}"
                          </div>
                        )}
                      </div>

                      {/* Selected Pet Details Preview */}
                      {(() => {
                        const sel = pets.find((p) => p.id === selectedPetId);
                        if (!sel) return null;
                        return (
                          <div className="p-2.5 bg-[#0e1420] border border-[#00f090]/40 rounded-lg flex items-center gap-3">
                            <PetImage src={sel.image} alt={sel.name} className="w-12 h-12" rarity={sel.rarity} />
                            <div>
                              <div className="text-xs font-bold text-white font-gaming flex items-center gap-2">
                                <span>{sel.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#00f090]/20 text-[#00f090] border border-[#00f090]/30 uppercase font-mono">Selected</span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="text-[#00f090] font-mono font-bold">Base: {sel.value} Val</span>
                                <span>•</span>
                                <span className="text-slate-300">{sel.rarity}</span>
                                <span>•</span>
                                <span className="text-emerald-400 font-mono">Demand: {sel.demand}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="space-y-2.5 p-3 bg-[#0d121c] border border-[#1d273f] rounded-xl">
                      <div>
                        <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                          Custom Pet Name
                        </label>
                        <input
                          type="text"
                          value={customPetName}
                          onChange={(e) => setCustomPetName(e.target.value)}
                          placeholder="e.g. Neon Shadow Dragon, Candy Cannon"
                          className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00f090] focus:outline-none font-gaming"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                            Pet Image URL
                          </label>
                          <input
                            type="text"
                            value={customImageUrl}
                            onChange={(e) => setCustomImageUrl(e.target.value)}
                            placeholder="https://... (Adopt Me image URL)"
                            className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00f090] focus:outline-none font-mono text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-gaming text-slate-400 block mb-1">
                            Value (Only 1 or higher accepted)
                          </label>
                          <input
                            type="number"
                            min={1}
                            step="any"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00f090] focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      {customImageUrl && (
                        <div className="flex items-center gap-2.5 p-2 bg-[#141b2a] rounded-lg border border-[#202c42]">
                          <img
                            src={customImageUrl}
                            alt="Custom Preview"
                            className="w-10 h-10 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="text-xs text-slate-300 font-gaming truncate">
                            Preview: {customPetName || 'Custom Pet'} ({Math.max(1, Number(customValue) || 1)} Val)
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Variant (Normal / Neon / Mega) */}
                <div>
                  <label className="text-xs font-gaming text-slate-400 block mb-1">Variant</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Normal', 'Neon', 'Mega'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVariant(v)}
                        className={`py-2 rounded font-gaming font-bold text-xs uppercase transition-colors cursor-pointer border ${
                          variant === v
                            ? 'bg-[#00f090]/20 border-[#00f090] text-[#00f090]'
                            : 'bg-[#151c2a] border-[#222c3f] text-slate-400 hover:text-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Fly / Ride Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#151c2a] border border-[#222c3f] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fly}
                      onChange={(e) => setFly(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00f090] focus:ring-0"
                    />
                    <span className="text-xs font-gaming font-bold text-white">Fly (F)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#151c2a] border border-[#222c3f] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ride}
                      onChange={(e) => setRide(e.target.checked)}
                      className="w-4 h-4 rounded text-[#00f090] focus:ring-0"
                    />
                    <span className="text-xs font-gaming font-bold text-white">Ride (R)</span>
                  </label>
                </div>

                {/* 5. Quantity & Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-gaming text-slate-400 block mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00f090] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-gaming text-slate-400 block mb-1">
                      Audit Reason
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00f090] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded bg-[#00f090] hover:bg-[#00d980] text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,144,0.3)] cursor-pointer active:scale-95"
                >
                  {loading ? 'Adding to Inventory...' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: USER INVENTORIES */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-gaming text-slate-400">Select User:</span>
                <select
                  value={inspectUserId}
                  onChange={(e) => {
                    setInspectUserId(e.target.value);
                    fetchUserInventory(e.target.value);
                  }}
                  className="bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} (Games: {u.totalGames}, Profit: {u.totalProfit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {inspectItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#111724] border border-[#1b2538] rounded-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>{item.variant}</span>
                        <span>x{item.quantity}</span>
                      </div>
                      <PetImage src={item.petImage} alt={item.petName} className="w-12 h-12 mx-auto my-1" />
                      <span className="font-gaming font-bold text-white text-xs block text-center truncate">
                        {item.petName}
                      </span>
                      <span className="text-amber-400 font-mono text-center block text-xs">
                        {item.totalValue} Val
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="mt-2 text-rose-400 hover:text-rose-300 text-[10px] font-gaming flex items-center justify-center gap-1 p-1 bg-rose-500/10 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Item</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PET CATALOG & VALUES */}
          {activeTab === 'catalog' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-gaming block">
                Manage AMVGG pet base values and active trading status:
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-gaming">
                  <thead>
                    <tr className="border-b border-[#1b2538] text-slate-400 text-[10px] uppercase">
                      <th className="py-2 px-3">Pet</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Rarity</th>
                      <th className="py-2 px-3">AMVGG Value</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161f30]">
                    {pets.map((p) => (
                      <tr key={p.id} className="hover:bg-[#121927]">
                        <td className="py-2 px-3 flex items-center gap-2">
                          <PetImage src={p.image} alt={p.name} className="w-6 h-6" />
                          <span className="font-bold text-white">{p.name}</span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{p.category}</td>
                        <td className="py-2 px-3 text-amber-400">{p.rarity}</td>
                        <td className="py-2 px-3 font-mono">
                          {editingPetId === p.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={newPetValue}
                              onChange={(e) => setNewPetValue(parseFloat(e.target.value) || 0)}
                              className="w-20 bg-slate-900 border border-amber-400 rounded px-1 text-white text-xs"
                            />
                          ) : (
                            <span className="text-white font-bold">{p.value}</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              p.disabled
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {p.disabled ? 'DISABLED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right space-x-2">
                          {editingPetId === p.id ? (
                            <button
                              onClick={() => handleUpdateValue(p.id)}
                              className="px-2 py-1 bg-[#00f090] text-slate-950 font-bold rounded text-[10px] cursor-pointer"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPetId(p.id);
                                setNewPetValue(p.value);
                              }}
                              className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded text-[10px] cursor-pointer"
                            >
                              Edit Val
                            </button>
                          )}
                          <button
                            onClick={() => handleTogglePetStatus(p.id, !!p.disabled)}
                            className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded text-[10px] cursor-pointer"
                          >
                            {p.disabled ? 'Enable' : 'Disable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AMVGG IMPORTER */}
          {activeTab === 'importer' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 bg-[#111724] border border-[#1b2538] rounded-xl space-y-3">
                <span className="font-gaming font-bold text-sm text-white block uppercase tracking-wider">
                  Import AMVGG Pet Catalog JSON
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Paste authorized AMVGG dataset JSON format (array of pets with name, value, rarity, demand). The system merges into the live catalog with server-side caching.
                </p>
                <textarea
                  rows={8}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='[{"name": "Candy Hare", "value": 4.2, "rarity": "Legendary", "demand": "High"}]'
                  className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg p-3 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                <button
                  onClick={handleImportAmvggCatalog}
                  className="w-full py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Import Dataset Into Catalog
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: DISCORD SERVER LINK SETTINGS (Owner Editable) */}
          {activeTab === 'discord' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-5 bg-[#111724] border border-[#1d273a] rounded-xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2]">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-gaming font-bold text-sm text-white uppercase tracking-wider">
                      Discord Server Link & Pet Withdrawals
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure the official Discord server invite link. Users will be automatically redirected to this link after confirming a pet withdrawal or when requesting pet deposits.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-gaming font-bold text-slate-300 uppercase">
                    Official Discord Server Invite URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={discordLinkInput}
                      onChange={(e) => setDiscordLinkInput(e.target.value)}
                      placeholder="https://discord.gg/your-server"
                      className="w-full bg-[#151c2a] border border-[#232f45] rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Example: <span className="font-mono text-slate-300">https://discord.gg/bloxluck</span> or your custom vanity URL.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-[#1a2436]">
                  <button
                    onClick={handleSaveDiscordLink}
                    disabled={savingDiscord}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-gaming font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-40"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingDiscord ? 'Saving...' : 'Save Discord Server Link'}</span>
                  </button>

                  <a
                    href={discordLinkInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-[#182338] text-slate-300 hover:text-white font-gaming text-xs flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Link</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-gaming block">
                Immutable Admin Security & Action Audit Trail:
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-gaming border-collapse">
                  <thead>
                    <tr className="border-b border-[#1b2538] text-slate-400 text-[10px] uppercase">
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Admin</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Target User</th>
                      <th className="py-2 px-3">Pet</th>
                      <th className="py-2 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#161f30] font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#121927]">
                        <td className="py-2 px-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-2 px-3 text-amber-400 font-bold">{log.admin}</td>
                        <td className="py-2 px-3 text-[#00f090] font-bold">{log.action}</td>
                        <td className="py-2 px-3 text-white">{log.user}</td>
                        <td className="py-2 px-3 text-slate-200">{log.pet}</td>
                        <td className="py-2 px-3 text-slate-400 font-sans text-xs">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
