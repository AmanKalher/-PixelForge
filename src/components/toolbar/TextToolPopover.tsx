import React, { useRef, useEffect } from 'react';
import { Type, X } from 'lucide-react';
import { TextFormattingToolbar } from './TextFormattingToolbar';

interface TextToolPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TextToolPopover: React.FC<TextToolPopoverProps> = ({ isOpen, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute top-12 left-1/2 -translate-x-1/2 w-max max-w-[94vw] bg-white border border-[#EFE5D8] rounded-2xl shadow-2xl p-4 z-50 text-[#302633] animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label="Text Settings"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-[#6D3B67]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D3B67]">
            Text Settings
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          aria-label="Close Text Options"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Formatting controls */}
      <TextFormattingToolbar />

      <div className="mt-2.5 pt-2 border-t border-[#F0EAE1] text-[10px] text-[#302633]/60 flex items-center justify-between">
        <span>Click canvas in Text mode to place box</span>
        <kbd className="px-1.5 py-0.5 rounded bg-[#FFF9F0] border border-[#EFE5D8] font-mono text-[9px]">T</kbd>
      </div>
    </div>
  );
};