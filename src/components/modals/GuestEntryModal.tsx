import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { COLOR_PALETTE } from '../../mocks/demoData';
import { ArrowRight, UserCheck, X } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const GuestEntryModal: React.FC = () => {
  const {
    isGuestModalOpen,
    setIsGuestModalOpen,
    guestUser,
    setGuestUser,
  } = useWorkspace();

  const [name, setName] = useState(guestUser.name);
  const [selectedColor, setSelectedColor] = useState(guestUser.color);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGuestModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsGuestModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGuestModalOpen, setIsGuestModalOpen]);

  if (!isGuestModalOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Display name cannot be empty.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 28) {
      setError('Name must be 28 characters or fewer.');
      return;
    }

    setGuestUser({
      name: trimmed,
      color: selectedColor,
      hasEntered: true,
    });
    setError(null);
    setIsGuestModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#302633]/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => setIsGuestModalOpen(false)}
    >
      <div
        className="bg-white border border-[#EFE5D8] rounded-2xl w-full max-w-md p-6 shadow-xl shadow-[#6D3B67]/5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with PixelForge Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" variant="transparent" />
            <div>
              <h2 className="text-base font-semibold text-[#302633] tracking-tight">
                Guest Access
              </h2>
              <p className="text-xs text-[#302633]/60">
                Join the collaborative canvas workspace
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsGuestModalOpen(false)}
            aria-label="Close modal"
            className="p-1 rounded-md text-[#302633]/50 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-semibold text-[#302633] mb-1.5">
              Your Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Alex, Sam, Ada Lovelace"
              maxLength={32}
              autoFocus
              className="w-full bg-[#FFFDF9] border border-[#EFE5D8] focus:bg-white focus:border-[#F26B5B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F26B5B]/15 rounded-xl px-3.5 py-2 text-sm text-[#302633] placeholder-[#302633]/40 transition"
            />
            {error && (
              <p className="text-xs text-[#F26B5B] mt-1.5 flex items-center gap-1 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Cursor Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#302633] mb-2">
              Choose Your Cursor & Presence Color
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_PALETTE.guestColors.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-[#F26B5B] ring-offset-2 ring-offset-white scale-105 shadow-xs'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Select color: ${color}`}
                  >
                    {isSelected && <UserCheck className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guest notice */}
          <div className="bg-[#FFF9F0] rounded-xl p-3 border border-[#EFE5D8] text-[11px] text-[#302633]/70">
            No password or account required. You will join the collaborative canvas as a guest creator.
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsGuestModalOpen(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#302633]/70 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#F26B5B] hover:bg-[#E05A4A] active:bg-[#CC4E3F] text-white shadow-xs transition cursor-pointer"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
