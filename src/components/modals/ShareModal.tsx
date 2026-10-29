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
      className="fixed inset-0 z-50 bg-[#302633]/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={handleClose}
    >
      <div
        className="bg-white border border-[#EFE5D8] rounded-2xl w-full max-w-lg p-6 shadow-2xl shadow-[#6D3B67]/5 animate-in zoom-in-95 duration-150 space-y-5 text-[#302633]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0ED] border border-[#FCD9D3] text-[#F26B5B] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#302633] tracking-tight">
                Share this workspace
              </h3>
              <p className="text-xs text-[#302633]/60">
                People with access can collaborate on &ldquo;{boardTitle || 'Untitled Board'}&rdquo; in real time.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Access Mode & General Sharing Status */}
        <div className="flex items-center justify-between p-3 bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#EFE5D8] flex items-center justify-center text-[#6D3B67] flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-[#6D3B67]" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[#302633]">General Access</div>
              <div className="text-[11px] text-[#302633]/60 truncate">
                Anyone with this link can view and join the workspace
              </div>
            </div>
          </div>

          <select
            value={accessMode}
            onChange={(e) => setAccessMode(e.target.value as 'editor' | 'viewer')}
            className="bg-white border border-[#EFE5D8] text-[#302633] font-medium rounded-lg px-2 py-1 text-xs outline-none focus:border-[#F26B5B] cursor-pointer"
          >
            <option value="editor">Can edit</option>
            <option value="viewer">Can view</option>
          </select>
        </div>

        {/* Workspace Invite Link with Copy Link */}
        <div className="space-y-1.5">
          <label
            htmlFor="workspace-share-link-input"
            className="block text-xs font-semibold text-[#302633]"
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
                className="w-full bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl px-3 py-2 text-xs text-[#302633] font-mono select-all focus:outline-none focus:border-[#F26B5B]"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                copied
                  ? 'bg-[#3B5B3E] text-white'
                  : 'bg-white border border-[#EFE5D8] text-[#302633] hover:bg-[#FFF9F0]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#302633]/60" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Invite by Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#302633]">
            Invite via Email
          </label>
          <form onSubmit={handleSendInvite} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail className="w-3.5 h-3.5 text-[#302633]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="colleague@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-white border border-[#EFE5D8] rounded-xl pl-8 pr-3 py-2 text-xs text-[#302633] placeholder:text-[#302633]/40 outline-none focus:border-[#F26B5B]"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
              className="bg-white border border-[#EFE5D8] text-[#302633] font-medium rounded-xl px-2.5 py-2 text-xs outline-none focus:border-[#F26B5B] cursor-pointer"
            >
              <option value="editor">Can edit</option>
              <option value="viewer">Can view</option>
            </select>
            <button
              type="submit"
              disabled={!emailInput.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F26B5B] hover:bg-[#E05A4A] active:bg-[#CC4E3F] text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
          </form>

          {/* Invitation Status */}
          {invitationStatus ? (
            <div className="p-2.5 bg-[#FFF0ED] border border-[#FCD9D3] rounded-xl text-xs text-[#F26B5B] space-y-1 animate-in fade-in duration-100">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 text-[#F26B5B] flex-shrink-0" />
                <span>Simulated Invite Queued for {invitationStatus.email} ({invitationStatus.role})</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-[#302633]/50">
              <ShieldCheck className="w-3 h-3 text-[#A8B9A0]" />
              <span>Direct share links allow instant peer participation.</span>
            </div>
          )}
        </div>

        {/* Current Collaborators List */}
        <div className="space-y-2 pt-2 border-t border-[#F0EAE1]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#302633]">
              Who has access ({collaborators.length + 1})
            </span>
            <span className="text-[10px] text-[#3B5B3E] bg-[#EAF0E8] px-2 py-0.5 rounded-full font-semibold">
              Live Room
            </span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {/* Host / Local User */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#FFF0ED] border border-[#FCD9D3]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{ backgroundColor: guestUser?.color || '#F26B5B' }}
                  className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs"
                >
                  {getInitials(guestUser?.name || 'Guest User')}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-[#302633] truncate">
                    {guestUser?.name || 'Guest User'} (You)
                  </div>
                  <div className="text-[10px] text-[#302633]/60">Workspace Host • Active now</div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#302633] bg-white border border-[#EFE5D8] px-2 py-0.5 rounded-md">
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
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FFF9F0] transition border border-transparent hover:border-[#EFE5D8]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{ backgroundColor: c.color }}
                      className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center flex-shrink-0 ring-1 ring-white shadow-2xs"
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs text-[#302633] truncate">
                        {cleanName}
                      </div>
                      <div className="text-[10px] text-[#302633]/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5D8B55] inline-block" />
                        <span>Online • {role}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#302633]/60 font-medium">
                    Can edit
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end pt-3 border-t border-[#F0EAE1]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFF9F0] hover:bg-[#F5EFE6] text-[#302633] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
