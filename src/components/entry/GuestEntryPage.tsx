import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  AlertCircle,
  Hash,
  BadgeCheck,
} from 'lucide-react';

export const GuestEntryPage: React.FC = () => {
  const { guestUser, setGuestUser, collaborators } = useWorkspace();

  const [name, setName] = useState(guestUser.name || '');
  const [selectedColor, setSelectedColor] = useState(guestUser.color || '#4F46E5');
  const [error, setError] = useState<string | null>(null);

  const cursorPalette = [
    { id: 'indigo', name: 'Electric Indigo', hex: '#4F46E5' },
    { id: 'emerald', name: 'Emerald Green', hex: '#10B981' },
    { id: 'cyan', name: 'Cyan Sky', hex: '#06B6D4' },
    { id: 'amber', name: 'Sunset Amber', hex: '#F59E0B' },
    { id: 'purple', name: 'Vibrant Purple', hex: '#8B5CF6' },
    { id: 'rose', name: 'Coral Red', hex: '#EF4444' },
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/35 backdrop-blur-md select-none animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-heading"
    >
      <div className="w-full max-w-lg flex flex-col items-center space-y-4 my-auto py-6">
        {/* Brand 3D Cube Icon */}
        <div className="w-14 h-14 rounded-2xl bg-white shadow-xl border border-slate-100 flex items-center justify-center p-2.5">
          <svg className="w-9 h-9" viewBox="0 0 32 32" fill="none">
            {/* 3D Isometric Gradient Cube */}
            <path d="M16 3L28 10L16 17L4 10L16 3Z" fill="#8B5CF6" />
            <path d="M4 10L16 17V30L4 23V10Z" fill="#4F46E5" />
            <path d="M16 17L28 10V23L16 30V17Z" fill="#06B6D4" />
          </svg>
        </div>

        {/* Node Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-[11px] font-semibold text-slate-700 tracking-wider shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="uppercase text-[10px] tracking-wide">Workspace Node #142 • Active Mesh</span>
        </div>

        {/* Headings */}
        <div className="text-center space-y-1">
          <h1
            id="entry-heading"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
          >
            Enter The Shared Sanctum
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto">
            Real-time collaborative canvas workspace for WEBSTER 2026.
          </p>
        </div>

        {/* Centered Entry Card */}
        <form
          onSubmit={handleJoin}
          className="w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150"
        >
          {/* 1. Display Name Input with Live Counter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="guest-display-name" className="font-semibold text-slate-800">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <span
                className={`font-mono text-[11px] flex items-center gap-1 ${
                  name.trim().length >= 2 ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                }`}
              >
                {name.length} / 32
                {name.trim().length >= 2 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </span>
            </div>

            <div className="relative">
              <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                className={`w-full bg-slate-50 border rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition font-medium ${
                  error
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/40'
                    : 'border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100'
                }`}
              />
            </div>

            {error && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium animate-in fade-in duration-100">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          {/* 2. Live Multiplayer Cursor Token & Palette */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Live Multiplayer Cursor Token</span>
              <span className="text-[11px] font-medium text-slate-500">
                {selectedColorObj.name}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {cursorPalette.map((c) => {
                  const isSelected = selectedColor === c.hex;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-xs'
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
              <div className="flex items-center gap-1.5 pl-2.5 border-l border-slate-200 select-none">
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

          {/* 3. Room & Mesh Banner */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 font-semibold">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
              <span>sprint-14-architecture</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <span className="font-mono">Socket.IO v4</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 bg-emerald-50 font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200">
                Fabric.js Ready
              </span>
            </div>
          </div>

          {/* 4. Join Collaborative Board Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-[#4F46E5] hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span>Join Collaborative Board</span>
            <ArrowRight className="w-4 h-4" />
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 font-mono ml-1">
              Enter
            </span>
          </button>

          {/* 5. No Sign-up Note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>No sign-up required. Enter a display name to join the workspace.</span>
          </div>
        </form>

        {/* Subtle Status Footer */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-600 font-medium flex-wrap pt-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {collaborators.length} Active Curators Online (Demo)
          </span>
          <span className="text-slate-400">•</span>
          <span>Latency: 14ms (Simulated)</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-700 font-semibold">Sync State: Clean</span>
        </div>
      </div>
    </div>
  );
};

