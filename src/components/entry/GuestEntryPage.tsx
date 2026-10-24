import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  AlertCircle,
  User,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const GuestEntryPage: React.FC = () => {
  const { guestUser, setGuestUser, collaborators } = useWorkspace();

  const [name, setName] = useState(guestUser.name || '');
  const [selectedColor, setSelectedColor] = useState(guestUser.color || '#F26B5B');
  const [error, setError] = useState<string | null>(null);

  // Creative & warm palette aligned with brand direction
  const cursorPalette = [
    { id: 'coral', name: 'Coral Flame', hex: '#F26B5B' },
    { id: 'yellow', name: 'Butter Yellow', hex: '#F7D774' },
    { id: 'sage', name: 'Soft Sage', hex: '#A8B9A0' },
    { id: 'plum', name: 'Royal Plum', hex: '#6D3B67' },
    { id: 'cyan', name: 'Ocean Cyan', hex: '#38BDF8' },
    { id: 'lavender', name: 'Sweet Lavender', hex: '#A78BFA' },
  ];

  const selectedColorObj =
    cursorPalette.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase()) ||
    cursorPalette[0];

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Please enter a display name to join.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 32) {
      setError('Display name must be 32 characters or fewer.');
      return;
    }

    setGuestUser({
      name: trimmed,
      color: selectedColor,
      hasEntered: true,
    });
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#FFF9F0] select-none animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-heading"
    >
      <div className="w-full max-w-md flex flex-col items-center space-y-5 my-auto py-6">
        {/* Brand Mark & Title Group */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-1 rounded-2xl bg-white shadow-sm border border-[#F0E7DB]">
            <BrandLogo size="lg" variant="transparent" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold tracking-tight text-[#6D3B67]">
              PixelForge
            </h2>
            <p className="text-[11px] font-semibold tracking-wider text-[#A8B9A0] uppercase">
              Collaborate • Create • Build
            </p>
          </div>
        </div>

        {/* Headings */}
        <div className="text-center space-y-1">
          <h1
            id="entry-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#302633] tracking-tight"
          >
            Enter The Shared Sanctum
          </h1>
          <p className="text-xs sm:text-sm text-[#302633]/70 font-medium max-w-sm mx-auto">
            Real-time collaborative infinite canvas workspace for creative minds.
          </p>
        </div>

        {/* Centered Entry Card */}
        <form
          onSubmit={handleJoin}
          className="w-full bg-white border border-[#EFE5D8] rounded-2xl shadow-xl shadow-[#6D3B67]/5 p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150"
        >
          {/* 1. Display Name Input with Live Counter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="guest-display-name" className="font-semibold text-[#302633]">
                Display Name <span className="text-[#F26B5B]">*</span>
              </label>
              <span
                className={`font-mono text-[11px] flex items-center gap-1 ${
                  name.trim().length >= 2 ? 'text-[#4A7245] font-semibold' : 'text-[#302633]/50'
                }`}
              >
                {name.length} / 32
                {name.trim().length >= 2 && <CheckCircle2 className="w-3.5 h-3.5 text-[#A8B9A0]" />}
              </span>
            </div>

            <div className="relative">
              <User className="w-4 h-4 text-[#302633]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="guest-display-name"
                type="text"
                maxLength={32}
                autoFocus
                placeholder="e.g. Aria Chen"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                className={`w-full bg-[#FFFDF9] border rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-[#302633] placeholder:text-[#302633]/40 outline-none transition font-medium ${
                  error
                    ? 'border-[#F26B5B] focus:ring-2 focus:ring-[#F26B5B]/20 bg-[#FFF0ED]'
                    : 'border-[#E8DEC8] focus:border-[#F26B5B] focus:bg-white focus:ring-2 focus:ring-[#F26B5B]/15'
                }`}
              />
            </div>

            {error && (
              <p className="text-[11px] text-[#F26B5B] flex items-center gap-1 font-medium animate-in fade-in duration-100">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* 2. Live Workspace Cursor Tokens & Palette */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#302633]">Live Workspace Cursor Tokens</span>
                <span className="text-[10px] text-[#302633]/50">({selectedColorObj.name})</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#302633]/70">
                <span>Board is</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF0E8] text-[#3B5B3E] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5D8B55] animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-[#FFFDF9] rounded-xl border border-[#EFE5D8]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {cursorPalette.map((c) => {
                  const isSelected = selectedColor === c.hex;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-[#F26B5B] scale-110 shadow-xs'
                          : 'hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Cursor Token */}
              <div className="flex items-center gap-1.5 pl-2.5 border-l border-[#EFE5D8] select-none">
                <svg
                  className="w-3.5 h-3.5 drop-shadow-xs"
                  viewBox="0 0 24 24"
                  fill={selectedColor}
                  stroke="white"
                  strokeWidth="1.5"
                >
                  <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
                </svg>
                <div
                  style={{ backgroundColor: selectedColor }}
                  className="text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs truncate max-w-[120px]"
                >
                  {name.trim() || 'Aria Chen'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Join Collaborative Board Button (Coral Primary) */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#F26B5B] hover:bg-[#E05A4A] active:bg-[#CC4E3F] text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span>Join Collaborative Board</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* 4. No Sign-up Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#302633]/60 font-medium pt-1">
            <Lock className="w-3 h-3 text-[#302633]/40" />
            <span>No sign-up required. Enter a display name to join the workspace.</span>
          </div>
        </form>

        {/* Subtle Status Footer */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[11px] text-[#302633]/70 font-medium flex-wrap pt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5D8B55] animate-pulse" />
            {collaborators.length > 0
              ? `${collaborators.length} Active Curator${collaborators.length > 1 ? 's' : ''} Online`
              : 'Ready to Collaborate'}
          </span>
          <span className="text-[#302633]/30">•</span>
          <span>Latency: 14ms (Simulated)</span>
          <span className="text-[#302633]/30">•</span>
          <span className="text-[#6D3B67] font-semibold">Sync: Connected</span>
        </div>
      </div>
    </div>
  );
};
