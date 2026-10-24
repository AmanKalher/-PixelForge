import React, { useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { STICKY_TEMPLATES } from '../../engine/stickyNoteTemplates';
import { Check, Sparkles, X } from 'lucide-react';

interface StickyTemplateGalleryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: 'bottom' | 'right';
}

export const StickyTemplateGalleryPopover: React.FC<StickyTemplateGalleryPopoverProps> = ({
  isOpen,
  onClose,
  placement = 'right',
}) => {
  const {
    selectedStickyTemplate,
    setSelectedStickyTemplate,
    setActiveTool,
    canvasEngine,
  } = useWorkspace();

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

  const handleSelectTemplate = (templateKey: string) => {
    setSelectedStickyTemplate(templateKey);
    if (canvasEngine.changeStickyTemplate) {
      canvasEngine.changeStickyTemplate(templateKey);
    }
    setActiveTool('sticky');
  };

  const handlePlaceDefault = () => {
    if (canvasEngine.createStickyNoteAt) {
      canvasEngine.createStickyNoteAt({
        template: selectedStickyTemplate,
        x: 400 + Math.random() * 80,
        y: 260 + Math.random() * 60,
      });
    }
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className={`absolute ${
        placement === 'right'
          ? 'left-full top-1/2 -translate-y-1/2 ml-3'
          : 'top-12 left-1/2 -translate-x-1/2'
      } w-80 sm:w-96 bg-white border border-[#EFE5D8] rounded-2xl shadow-2xl p-4 z-50 text-[#302633] animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto`}
      role="dialog"
      aria-label="Sticky Note Templates"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F7D774]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D3B67]">
            Sticky Note Templates
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          aria-label="Close template gallery"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[11px] text-[#302633]/60 mt-2 mb-3">
        Choose a design below. Click anywhere on the board or use the button to place it.
      </p>

      {/* 9 Templates Grid */}
      <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {Object.entries(STICKY_TEMPLATES).map(([key, item]) => {
          const isSelected = selectedStickyTemplate === key;
          return (
            <button
              key={key}
              onClick={() => handleSelectTemplate(key)}
              type="button"
              className={`group relative rounded-xl border p-1.5 flex flex-col items-center gap-1.5 transition text-left cursor-pointer ${
                isSelected
                  ? 'border-[#F26B5B] ring-2 ring-[#FCD9D3] bg-[#FFF0ED] shadow-xs'
                  : 'border-[#EFE5D8] hover:border-[#F26B5B]/30 hover:bg-[#FFF9F0]'
              }`}
            >
              <div className="w-full h-16 rounded-lg overflow-hidden bg-[#FFF9F0] flex items-center justify-center relative shadow-2xs">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-[#F26B5B] text-white rounded-full p-0.5 shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-[#302633] text-center truncate w-full">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-[#F0EAE1] flex items-center justify-between">
        <span className="text-[11px] text-[#302633]/60 font-medium">
          Active: <strong className="text-[#6D3B67] font-semibold">{STICKY_TEMPLATES[selectedStickyTemplate]?.name || 'Sunny Fold'}</strong>
        </span>
        <button
          onClick={handlePlaceDefault}
          className="px-3 py-1.5 bg-[#F26B5B] hover:bg-[#E05A4A] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
        >
          + Drop on Board
        </button>
      </div>
    </div>
  );
};
