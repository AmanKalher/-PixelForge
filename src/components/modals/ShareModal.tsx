import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Users,
  Copy,
  Check,
  Send,
  Mail,
  X,
  Globe,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export const ShareModal: React.FC = () => {
  const {
    isShareModalOpen,
    setIsShareModalOpen,
    collaborators,
    guestUser,
    boardTitle,
  } = useWorkspace();

  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [accessMode, setAccessMode] = useState<'editor' | 'viewer'>('editor');
  const [invitationStatus, setInvitationStatus] = useState<{
    email: string;
    role: string;
  } | null>(null);

  // Derive real current workspace invitation URL
  const currentUrl =
    typeof window !== 'undefined' && window.location?.href
      ? window.location.href
      : 'http://localhost:5173/';

  useEffect(() => {
    if (!isShareModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShareModalOpen]);

  if (!isShareModalOpen) return null;

  const handleClose = () => {
    setIsShareModalOpen(false);
    setCopied(false);
    setEmailInput('');
    setInvitationStatus(null);
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const input = document.getElementById('workspace-share-link-input') as HTMLInputElement;
        if (input) {
          input.select();
          document.execCommand('copy');
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.getElementById('workspace-share-link-input') as HTMLInputElement;
      if (input) {
        input.select();
      }
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) return;

    setInvitationStatus({
      email: trimmed,
      role: inviteRole === 'editor' ? 'Can edit' : 'Can view',
    });
    setEmailInput('');
  };

  const getInitials = (name: string): string => {
    const clean = name.replace(/\(.*?\)/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={handleClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Share this workspace
              </h3>
              <p className="text-xs text-slate-500">
                People with access can collaborate on &ldquo;{boardTitle || 'Webster Sprint Canvas'}&rdquo; in real time.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Access Mode & General Sharing Status */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-800">General Access</div>
              <div className="text-[11px] text-slate-500 truncate">
                Anyone with this link can view and join the workspace
              </div>
            </div>
          </div>

          <select
            value={accessMode}
            onChange={(e) => setAccessMode(e.target.value as 'editor' | 'viewer')}
            className="bg-white border border-slate-300 text-slate-700 font-medium rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="editor">Can edit</option>
            <option value="viewer">Can view</option>
          </select>
        </div>

        {/* Workspace Invite Link with Copy Link */}
        <div className="space-y-1.5">
          <label
            htmlFor="workspace-share-link-input"
            className="block text-xs font-semibold text-slate-700"
          >
            Workspace Invitation Link
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="workspace-share-link-input"
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono select-all focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Real URL: copies the current active workspace URL directly to your clipboard.
          </p>
        </div>

        {/* Invite by Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Invite via Email
          </label>
          <form onSubmit={handleSendInvite} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="colleague@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
              className="bg-white border border-slate-300 text-slate-700 font-medium rounded-xl px-2.5 py-2 text-xs outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button
              type="submit"
              disabled={!emailInput.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#4F46E5] hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          </form>

          {/* Honest Backend Integration Notice */}
          {invitationStatus ? (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1 animate-in fade-in duration-100">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>Simulated Invite Queued for {invitationStatus.email} ({invitationStatus.role})</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                (Member 3 backend integration required: automated SMTP invitation dispatch and persistent access tokens will be dispatched once the authentication and collaboration server are connected.)
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-slate-400" />
              <span>Email invitations will integrate with Member 3&apos;s collaboration service.</span>
            </div>
          )}
        </div>

        {/* Current Collaborators List */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              Who has access ({collaborators.length + 1})
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
              Live Room
            </span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {/* Host / Local User */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/60 border border-indigo-100/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{ backgroundColor: guestUser?.color || '#6366f1' }}
                  className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs"
                >
                  {getInitials(guestUser?.name || 'Guest User')}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">
                    {guestUser?.name || 'Guest User'} (You)
                  </div>
                  <div className="text-[10px] text-slate-500">Workspace Host • Active now</div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                Owner
              </span>
            </div>

            {/* Remote Collaborators */}
            {collaborators.map((c) => {
              const initials = getInitials(c.name);
              const cleanName = c.name.replace(/\(.*?\)/g, '').trim();
              const role = c.name.match(/\((.*?)\)/)?.[1] || 'Editor';

              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{ backgroundColor: c.color }}
                      className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0 ring-1 ring-white shadow-2xs"
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-slate-800 truncate">
                        {cleanName}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Online • {role}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Can edit
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

