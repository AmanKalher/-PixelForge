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
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => setIsHistoryModalOpen(false)}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Audit & Version Timeline</h3>
              <p className="text-xs text-slate-500">Board snapshot revisions & mutation activity</p>
            </div>
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(false)}
            aria-label="Close modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Current Session Revisions</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="font-semibold text-slate-800">Current Live State</div>
                  <div className="text-[10px] text-slate-500">In-memory frontend session</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Active
                </span>
              </div>

              <div className="p-2.5 bg-white/60 rounded-lg border border-slate-200/60 flex items-center justify-between opacity-75">
                <div>
                  <div className="font-medium text-slate-600">Initial Board Mount</div>
                  <div className="text-[10px] text-slate-400">Session started</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Base
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Database className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-800">Architecture Notice:</strong> Persistent revision histories, time-travel restore, and differential snapshot rollbacks are part of Member 3's PostgreSQL persistence pipeline.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

