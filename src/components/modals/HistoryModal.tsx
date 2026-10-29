import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { History, Clock, X, Database, Plus, Check, AlertCircle, Loader2 } from 'lucide-react';

export const HistoryModal: React.FC = () => {
  const {
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    revisions,
    createCheckpoint,
    refreshRevisions,
    isBackendOnline,
  } = useWorkspace();

  const [isSavingRevision, setIsSavingRevision] = useState(false);
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Refresh revisions on modal open
  useEffect(() => {
    if (isHistoryModalOpen) {
      refreshRevisions();
    }
  }, [isHistoryModalOpen, refreshRevisions]);

  const handleCreateCheckpoint = async () => {
    if (isSavingRevision) return;
    setIsSavingRevision(true);
    setRevisionNotice(null);
    setErrorNotice(null);

    try {
      const result = await createCheckpoint();
      if (result.success && result.revision) {
        const msg =
          result.source === 'database'
            ? `Checkpoint #${result.revision.revisionNumber || ''} created & saved to PostgreSQL.`
            : `Local checkpoint created & recorded in session.`;
        setRevisionNotice(msg);
        setTimeout(() => setRevisionNotice(null), 3500);
      } else {
        setErrorNotice(result.error || 'Could not persist revision checkpoint.');
        setTimeout(() => setErrorNotice(null), 4000);
      }
    } catch (err: any) {
      setErrorNotice(err?.message || 'Failed to create revision checkpoint.');
      setTimeout(() => setErrorNotice(null), 4000);
    } finally {
      setIsSavingRevision(false);
    }
  };

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

  const formatTimestamp = (val?: string | number) => {
    if (!val) return 'Just now';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

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
          <div className="bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl p-3.5 space-y-3 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-[#302633]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6D3B67]" />
                <span>Session Revisions ({revisions.length + 2})</span>
              </div>
              <span className="text-[10px] font-medium text-[#302633]/50">
                {isBackendOnline ? 'PostgreSQL Active' : 'Session Mode'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* 1. Current Live State */}
              <div className="p-2.5 bg-white rounded-lg border border-[#EFE5D8] flex items-center justify-between shadow-2xs">
                <div>
                  <div className="font-semibold text-[#302633]">Current Live State</div>
                  <div className="text-[10px] text-[#302633]/50">In-memory working canvas</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#EAF0E8] text-[#3B5B3E] border border-[#A8B9A0]/40 font-semibold">
                  Active
                </span>
              </div>

              {/* 2. Dynamic Recorded Checkpoints */}
              {revisions.map((rev, index) => {
                const isDb = isBackendOnline || Boolean((rev as any).board_id && !String(rev.id).startsWith('local-'));
                const displayRevNum = rev.revisionNumber || (revisions.length - index);
                return (
                  <div
                    key={rev.id || `rev-${index}`}
                    className="p-2.5 bg-white rounded-lg border border-[#EFE5D8] flex items-center justify-between shadow-2xs transition hover:border-[#F26B5B]/30"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-[#302633] truncate">
                        {rev.label || `Checkpoint #${displayRevNum}`}
                      </div>
                      <div className="text-[10px] text-[#302633]/50 flex items-center gap-1.5 mt-0.5">
                        <span>{formatTimestamp(rev.createdAt)}</span>
                        {rev.createdBy && (
                          <>
                            <span>•</span>
                            <span className="truncate">by {rev.createdBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 border ${
                        isDb
                          ? 'bg-[#EAF0E8] text-[#3B5B3E] border-[#A8B9A0]/40'
                          : 'bg-[#FFF0ED] text-[#F26B5B] border-[#FCD9D3]'
                      }`}
                    >
                      {isDb ? `PostgreSQL #${displayRevNum}` : `Local #${displayRevNum}`}
                    </span>
                  </div>
                );
              })}

              {/* 3. Base Initial Mount */}
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

          {revisionNotice && (
            <div className="p-2.5 bg-[#EAF0E8] border border-[#A8B9A0]/50 rounded-xl flex items-center gap-2 text-xs text-[#3B5B3E] font-medium animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-[#3B5B3E] shrink-0" />
              <span>{revisionNotice}</span>
            </div>
          )}

          {errorNotice && (
            <div className="p-2.5 bg-[#FFF0ED] border border-[#FCD9D3] rounded-xl flex items-center gap-2 text-xs text-[#F26B5B] font-medium animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-[#F26B5B] shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          <div className="p-3 bg-[#FFFDF9] rounded-xl border border-[#EFE5D8] space-y-1.5 text-xs text-[#302633]/70">
            <div className="flex items-center gap-2 font-medium text-[#302633]">
              <Database className="w-3.5 h-3.5 text-[#6D3B67]" />
              <span>Persistence Target:</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                isBackendOnline
                  ? 'bg-[#EAF0E8] text-[#3B5B3E] border-[#A8B9A0]/50'
                  : 'bg-[#FFF9F0] text-[#8C6B38] border-[#EAD8B8]'
              }`}>
                {isBackendOnline ? 'PostgreSQL Active' : 'Local Session (Backend Offline)'}
              </span>
            </div>
            <p className="leading-relaxed text-[11px] text-[#302633]/60">
              {isBackendOnline
                ? 'Revisions are saved to the PostgreSQL database and shared across connected collaborators.'
                : 'Backend server is not reachable. Checkpoints are recorded locally in this browser session.'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCreateCheckpoint}
              disabled={isSavingRevision}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FFF0ED] hover:bg-[#FCD9D3] text-[#F26B5B] border border-[#FCD9D3] transition cursor-pointer disabled:opacity-50"
            >
              {isSavingRevision ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Checkpoint</span>
                </>
              )}
            </button>
            <button
              type="button"
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
