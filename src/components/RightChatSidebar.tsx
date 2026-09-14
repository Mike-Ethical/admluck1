import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Flag,
  AlertCircle,
  X,
  MessageSquare,
  Crown,
  ChevronDown,
  Sparkles,
  Smile,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChatMessage, User } from '../types';
import { soundEffects } from '../utils/audio';

interface RightChatSidebarProps {
  messages: ChatMessage[];
  currentUser: User;
  onlineCount: number;
  onSendMessage: (msg: string) => Promise<boolean>;
  onReportMessage: (messageId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenRobloxVerify?: () => void;
}

const QUICK_CHATS = [
  'GL! 🍀',
  'GG! 🤝',
  'Huge flip! 🔥',
  'Who wants to flip? 🐾',
  'One more! ⚡',
  'To the moon! 🚀',
];

const EMOJIS = ['🐾', '🐉', '🔥', '🍀', '💎', '👑', '⚡', '🤑', '🎉', '🤝'];

export const RightChatSidebar: React.FC<RightChatSidebarProps> = ({
  messages,
  currentUser,
  onlineCount,
  onSendMessage,
  onReportMessage,
  isOpen,
  onClose,
  onOpenRobloxVerify,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom when near bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setIsScrolledUp(false);
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 80;
    setIsScrolledUp(isUp);
  };

  useEffect(() => {
    if (isOpen && !isScrolledUp) {
      scrollToBottom(false);
    }
  }, [messages, isOpen, isScrolledUp]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = (customText || inputText).trim();
    if (!text || isSending) return;

    if (!currentUser.verified && onOpenRobloxVerify) {
      onOpenRobloxVerify();
      return;
    }

    setIsSending(true);
    setErrorNotice(null);
    try {
      const success = await onSendMessage(text);
      if (success) {
        if (!customText) {
          setInputText('');
        }
        if (soundEnabled) soundEffects.playChatPop();
        scrollToBottom();
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to send message');
      setTimeout(() => setErrorNotice(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className="fixed top-14 bottom-16 md:bottom-0 right-0 w-full sm:w-80 md:w-88 bg-[#0b101a]/95 backdrop-blur-md border-l border-[#192438] flex flex-col select-none shadow-[0_0_40px_rgba(0,0,0,0.8)] z-40 animate-in slide-in-from-right duration-200"
    >
      {/* Chat header: green pulse dot + online count + Audio + Close button */}
      <div className="h-13 px-4 border-b border-[#182236] flex items-center justify-between bg-[#0e1422] shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f090] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00f090] shadow-[0_0_6px_#00f090]"></span>
          </span>
          <span className="font-gaming text-xs font-black text-white tracking-wider flex items-center gap-1.5 uppercase">
            <i className="fa-solid fa-comments text-[#00f090] text-xs" />
            <span>Live Chat</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-[#00f090] bg-[#00f090]/15 border border-[#00f090]/30 px-2 py-0.5 rounded-full">
            {onlineCount} Online
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              soundEffects.enabled = !soundEnabled;
            }}
            title={soundEnabled ? 'Mute Chat Sound' : 'Unmute Chat Sound'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#151f30] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#00f090]" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-[#141d2e] hover:bg-[#1b263d] transition-colors flex items-center gap-1.5 cursor-pointer border border-[#1f2d45]"
            title="Close Chat"
          >
            <X className="w-3.5 h-3.5" />
            <span className="text-[11px] font-gaming font-bold">Close</span>
          </button>
        </div>
      </div>

      {/* Error alert toast */}
      {errorNotice && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span className="truncate">{errorNotice}</span>
        </div>
      )}

      {/* Messages Feed Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2.5 scroll-smooth relative"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
            <div className="w-10 h-10 rounded-full bg-[#131b2c] border border-[#1e2a40] flex items-center justify-center text-slate-400 mb-2">
              <MessageSquare className="w-5 h-5 text-[#00f090]" />
            </div>
            <p className="font-gaming font-bold text-slate-300">No chat messages yet</p>
            <p className="text-[11px] mt-1 text-slate-500 max-w-[200px]">
              Say hello or discuss pet coinflips with other players!
            </p>
          </div>
        ) : (
          messages
            .filter((msg) => !msg.isSystemWin)
            .map((msg) => {
            const isOwner =
              msg.username?.toLowerCase() === 'cute240bunny' ||
              msg.username?.toLowerCase() === 'adpcoin' ||
              msg.isOwner ||
              msg.isAdmin;
            const isMe = msg.username === (currentUser.robloxUsername || currentUser.username);

            return (
              <div
                key={msg.id}
                className={`group relative flex items-start gap-2.5 text-xs p-2.5 rounded-xl transition-all duration-150 border ${
                  isOwner
                    ? 'bg-[#151c2c]/90 border-amber-500/30 hover:border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.06)]'
                    : isMe
                    ? 'bg-[#101b24]/90 border-[#00f090]/25 hover:border-[#00f090]/40'
                    : 'bg-[#101623]/60 border-transparent hover:border-[#1a263d] hover:bg-[#121929]/80'
                }`}
              >
                {/* User Roblox Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  <img
                    src={
                      msg.username?.toLowerCase() === 'cute240bunny'
                        ? 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular'
                        : msg.avatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular'
                    }
                    alt={msg.username}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular';
                    }}
                    className={`w-7 h-7 rounded-full object-cover border bg-slate-900 shadow-sm ${
                      isOwner ? 'border-amber-400' : isMe ? 'border-[#00f090]' : 'border-slate-700'
                    }`}
                  />
                  {isOwner && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                      <Crown className="w-2.5 h-2.5 fill-slate-950 stroke-[2.5]" />
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-gaming font-black truncate tracking-wide ${
                        isOwner
                          ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                          : isMe
                          ? 'text-[#00f090]'
                          : 'text-slate-200'
                      }`}
                    >
                      {msg.username}
                    </span>

                    {isMe && !isOwner && (
                      <span className="text-[8px] font-black px-1 py-0.2 rounded bg-[#00f090]/20 text-[#00f090] font-gaming uppercase tracking-wider">
                        YOU
                      </span>
                    )}

                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      {msg.timestamp}
                    </span>
                  </div>

                  <p className="text-slate-200 text-xs mt-1 break-words font-sans leading-relaxed selection:bg-teal-500/30">
                    {msg.message}
                  </p>
                </div>

                {/* Quick Report Flag button on hover */}
                <button
                  onClick={() => onReportMessage(msg.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1 cursor-pointer shrink-0"
                  title="Report this chat message"
                >
                  <Flag className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {isScrolledUp && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => scrollToBottom(true)}
            className="px-3 py-1.5 rounded-full bg-[#182338] border border-[#2c3d5e] text-slate-200 hover:text-white text-xs font-gaming font-bold shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5 text-[#00f090]" />
            <span>Latest Messages</span>
          </button>
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="p-2 bg-[#121927] border-t border-[#1b2538] flex items-center justify-between gap-1 flex-wrap shrink-0">
          {EMOJIS.map((emo) => (
            <button
              key={emo}
              type="button"
              onClick={() => {
                setInputText((prev) => prev + emo);
                setShowEmojiPicker(false);
              }}
              className="w-8 h-8 rounded-lg hover:bg-[#1a2438] flex items-center justify-center text-base cursor-pointer active:scale-90 transition-transform"
            >
              {emo}
            </button>
          ))}
        </div>
      )}

      {/* Quick Chat reaction chips */}
      <div className="px-3 pt-2 pb-1.5 bg-[#0c121e] border-t border-[#182338] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {QUICK_CHATS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSend(undefined, chip)}
              disabled={isSending}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#141c2c] hover:bg-[#1a253a] border border-[#212f47] hover:border-[#00f090]/40 text-slate-300 hover:text-white font-gaming transition-colors cursor-pointer active:scale-95 shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Message Input Form */}
      <div className="border-t border-[#182338] bg-[#0a0f19] p-3 shrink-0 z-10">
        <form onSubmit={(e) => handleSend(e)} className="flex items-center gap-2">
          {/* Active Roblox Profile Avatar */}
          <div
            className="relative shrink-0"
            title={`Chatting as @${currentUser.robloxUsername || currentUser.username}`}
          >
            <img
              src={
                currentUser.avatarUrl ||
                'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular'
              }
              alt={currentUser.username}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-2A0DE04FF101FD93723B00B54581C2D3-Png/150/150/AvatarHeadshot/Png/isCircular';
              }}
              className="w-8 h-8 rounded-full border border-[#00f090]/50 object-cover shadow-sm"
            />
          </div>

          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                currentUser.verified
                  ? `Message as @${currentUser.robloxUsername || currentUser.username}...`
                  : 'Log in to chat...'
              }
              maxLength={200}
              id="input-chat-message"
              className="w-full bg-[#111827] border border-[#1e2a40] focus:border-[#00f090] focus:ring-1 focus:ring-[#00f090]/40 focus:outline-none rounded-xl pl-3 pr-14 py-2 text-xs text-white placeholder-slate-500 transition-all"
            />
            {/* Emoji toggle icon button inside input */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-7 top-2 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="Add Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            {inputText.length > 0 && (
              <span className="absolute right-2 top-2.5 text-[8px] font-mono text-slate-500">
                {inputText.length}
              </span>
            )}
          </div>

          {/* Green Send Message Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            id="btn-chat-send"
            className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#00f090] to-[#00dc82] hover:from-[#00ff9a] hover:to-[#00e285] active:scale-95 disabled:opacity-40 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,240,144,0.3)] shrink-0 cursor-pointer font-gaming font-black text-xs uppercase"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Send</span>
          </button>
        </form>
      </div>
    </aside>
  );
};
