import React, { useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { History, Clock, X, Database } from 'lucide-react';

export const HistoryModal: React.FC = () => {
  const { isHistoryModalOpen, setIsHistoryModalOpen } = useWorkspace();

  useEffect(() => {
    if (!isHistoryModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHistoryModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryModalOpen, setIsHistoryModalOpen]);

  if (!isHistoryModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#302633]/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => setIsHistoryModalOpen(false)}
    >
      <div
        className="bg-white border border-[#EFE5D8] rounded-2xl w-full max-w-md p-6 shadow-xl shadow-[#6D3B67]/5 animate-in zoom-in-95 duration-150 text-[#302633]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0ED] border border-[#FCD9D3] text-[#F26B5B] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#302633]">Audit & Version Timeline</h3>
              <p className="text-xs text-[#302633]/60">Board snapshot revisions & mutation activity</p>
            </div>
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(false)}
            aria-label="Close modal"
            className="p-1 rounded-md text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#302633]">
              <Clock className="w-4 h-4 text-[#6D3B67]" />
              <span>Current Session Revisions</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-[#EFE5D8] flex items-center justify-between shadow-2xs">
                <div>
                  <div className="font-semibold text-[#302633]">Current Live State</div>
                  <div className="text-[10px] text-[#302633]/50">In-memory frontend session</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#EAF0E8] text-[#3B5B3E] border border-[#A8B9A0]/40 font-semibold">
                  Active
                </span>
              </div>

              <div className="p-2.5 bg-white/60 rounded-lg border border-[#EFE5D8]/60 flex items-center justify-between opacity-75">
                <div>
                  <div className="font-medium text-[#302633]/70">Initial Board Mount</div>
                  <div className="text-[10px] text-[#302633]/40">Session started</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#FFF9F0] border border-[#EFE5D8] text-[#302633]/60">
                  Base
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#FFFDF9] rounded-xl border border-[#EFE5D8] flex items-start gap-2.5 text-xs text-[#302633]/70">
            <Database className="w-4 h-4 text-[#6D3B67] flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-[#302633]">Architecture Notice:</strong> Persistent revision histories, time-travel restore, and differential snapshot rollbacks are part of Member 3&apos;s PostgreSQL persistence pipeline.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFF9F0] hover:bg-[#F5EFE6] text-[#302633] transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
