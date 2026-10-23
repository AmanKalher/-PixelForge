import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  ChevronDown,
  MessageSquare,
  Share2,
  Check,
  Edit2,
  Download,
  Users,
  User,
  LogOut,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const WorkspaceHeader: React.FC = () => {
  const {
    boardTitle,
    setBoardTitle,
    setIsGuestModalOpen,
    setIsExportModalOpen,
    setIsShareModalOpen,
    setIsSimulationDrawerOpen,
    collaborators,
    guestUser,
    setGuestUser,
  } = useWorkspace();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(boardTitle || 'Untitled Board');
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCollabPopoverOpen, setIsCollabPopoverOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const collabPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleInput(boardTitle || 'Untitled Board');
  }, [boardTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        titleDropdownRef.current &&
        !titleDropdownRef.current.contains(e.target as Node)
      ) {
        setIsTitleDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        collabPopoverRef.current &&
        !collabPopoverRef.current.contains(e.target as Node)
      ) {
        setIsCollabPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string): string => {
    const clean = name.replace(/\(.*?\)/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'U';
  };

  const visibleCollaborators = (collaborators || []).slice(0, 3);
  const overflowCount = Math.max(0, (collaborators || []).length - 3);

  const handleTitleSubmit = () => {
    const trimmed = titleInput.trim();
    if (trimmed) {
      setBoardTitle(trimmed);
    } else {
      setTitleInput(boardTitle || 'Untitled Board');
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleInput(boardTitle || 'Untitled Board');
      setIsEditingTitle(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-[#EFE5D8] px-3 sm:px-4 flex items-center justify-between z-30 select-none shadow-xs">
      {/* Left: PixelForge Logo, Board Title Dropdown, Sage Live Badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* PixelForge Brand Logo */}
        <div className="flex items-center gap-2 pr-2.5 border-r border-[#EFE5D8] flex-shrink-0">
          <BrandLogo size="xs" variant="transparent" />
          <span className="font-bold text-sm tracking-tight text-[#6D3B67]">
            PixelForge
          </span>
        </div>

        {/* Board Title Dropdown */}
        <div className="relative" ref={titleDropdownRef}>
          {isEditingTitle ? (
            <div className="flex items-center gap-1 bg-white rounded-md px-2 py-0.5 border border-[#F26B5B] shadow-xs">
              <input
                ref={titleInputRef}
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                className="bg-transparent text-xs text-[#302633] outline-none w-36 sm:w-48 font-semibold"
                maxLength={40}
              />
              <button
                onClick={handleTitleSubmit}
                className="text-[#3B5B3E] hover:text-[#2E4731] p-0.5"
                title="Save title"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
              className="flex items-center gap-1 text-xs font-semibold text-[#302633] hover:bg-[#FFF9F0] px-2 py-1 rounded-md transition cursor-pointer"
              title="Board options"
            >
              <span className="truncate max-w-[150px] sm:max-w-[220px]">
                {boardTitle || 'Untitled Board'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#302633]/40 flex-shrink-0" />
            </button>
          )}

          {/* Title Dropdown Menu */}
          {isTitleDropdownOpen && (
            <div className="absolute top-9 left-0 w-44 bg-white border border-[#EFE5D8] rounded-xl shadow-lg py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setIsEditingTitle(true);
                  setIsTitleDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[#302633] hover:bg-[#FFF9F0] transition text-left cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#302633]/50" />
                <span>Rename Canvas</span>
              </button>
            </div>
          )}
        </div>

        {/* Live · Connected Soft Sage Pill Badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF0E8] text-[#3B5B3E] flex-shrink-0"
          title="Live room connected via collaborative sync"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#5D8B55] animate-pulse" />
          <span>• Live · Connected</span>
        </div>
      </div>

      {/* Right: Overlapping Collaborators, Export, Coral Share Button, User Avatar Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Dynamic Overlapping Collaborators with Overflow Label & Status Popover */}
        <div className="relative" ref={collabPopoverRef}>
          <button
            onClick={() => setIsCollabPopoverOpen(!isCollabPopoverOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#FFF9F0] transition select-none cursor-pointer"
            title="View room collaborators"
          >
            {visibleCollaborators.length > 0 ? (
              <div className="flex items-center -space-x-1.5">
                {visibleCollaborators.map((c) => (
                  <div
                    key={c.id}
                    style={{ backgroundColor: c.color }}
                    className="w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-xs"
                    title={c.name}
                  >
                    {getInitials(c.name)}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{ backgroundColor: guestUser?.color || '#F26B5B' }}
                className="w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-xs"
                title={guestUser?.name || 'Local User'}
              >
                {getInitials(guestUser?.name || 'Guest User')}
              </div>
            )}

            <span className="text-xs font-medium text-[#302633]/70 hidden md:inline">
              {overflowCount > 0
                ? `+${overflowCount} Collaborator${overflowCount > 1 ? 's' : ''}`
                : visibleCollaborators.length > 0
                ? `${visibleCollaborators.length + 1} Online`
                : 'Solo Mode'}
            </span>
          </button>

          {/* Collaborator List & Presence Popover */}
          {isCollabPopoverOpen && (
            <div className="absolute top-10 right-0 w-64 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0EAE1]">
                <span className="font-semibold text-[#302633] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#6D3B67]" />
                  Active Collaborators ({collaborators.length + 1})
                </span>
                <span className="text-[10px] text-[#3B5B3E] bg-[#EAF0E8] px-1.5 py-0.5 rounded-full font-semibold">
                  Live
                </span>
              </div>

              {/* Local User Row */}
              <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#FFF0ED] mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    style={{ backgroundColor: guestUser?.color || '#F26B5B' }}
                    className="w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0"
                  >
                    {getInitials(guestUser?.name || 'Guest User')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[#302633] truncate">
                      {guestUser?.name || 'Guest User'} (You)
                    </div>
                    <div className="text-[10px] text-[#302633]/60">Host / Local Editor</div>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#5D8B55] flex-shrink-0" title="Connected" />
              </div>

              {/* Remote Collaborators List */}
              <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                {collaborators.length === 0 ? (
                  <div className="text-center py-2 text-[#302633]/50 text-[11px]">
                    No remote collaborators connected yet.
                  </div>
                ) : (
                  collaborators.map((c) => {
                    const initials = getInitials(c.name);
                    const cleanName = c.name.replace(/\(.*?\)/g, '').trim();
                    const role = c.name.match(/\((.*?)\)/)?.[1] || 'Editor';

                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-[#FFF9F0] transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            style={{ backgroundColor: c.color }}
                            className="w-6 h-6 rounded-full text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 ring-1 ring-white"
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-[#302633] truncate">{cleanName}</div>
                            <div className="text-[10px] text-[#302633]/50 truncate">{role}</div>
                          </div>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5D8B55] flex-shrink-0" title="Active now" />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-2 mt-2 border-t border-[#F0EAE1] flex items-center justify-between text-[11px]">
                <button
                  onClick={() => {
                    setIsCollabPopoverOpen(false);
                    setIsShareModalOpen(true);
                  }}
                  className="text-[#F26B5B] hover:text-[#E05A4A] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3 h-3" />
                  Invite Link
                </button>
                <button
                  onClick={() => {
                    setIsCollabPopoverOpen(false);
                    setIsSimulationDrawerOpen(true);
                  }}
                  className="text-[#302633]/60 hover:text-[#302633] font-medium cursor-pointer"
                >
                  Simulate Users...
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-[#EFE5D8] hidden sm:block" />

        {/* Comment Icon Button */}
        <div className="flex items-center gap-0.5">
          <button
            className="p-1.5 rounded-md text-[#302633]/70 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
            title="Comments & Annotations"
            aria-label="Comments"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Dedicated Export Button (immediately beside Share) */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E8DEC8] text-[#302633] hover:bg-[#FFF9F0] hover:text-[#302633] active:bg-[#F5EFE6] shadow-2xs transition cursor-pointer"
          title="Export Canvas snapshot (PNG or SVG)"
        >
          <Download className="w-3.5 h-3.5 text-[#302633]/60" />
          <span>Export</span>
        </button>

        {/* Dedicated Primary Coral Share & Invite Button */}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F26B5B] hover:bg-[#E05A4A] active:bg-[#CC4E3F] text-white shadow-xs transition cursor-pointer"
          title="Share workspace & invite collaborators"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        {/* User Profile Avatar Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-[#E8DEC8] transition cursor-pointer"
            title="User Profile"
            aria-label="User Profile"
          >
            <div
              style={{ backgroundColor: guestUser?.color || '#F26B5B' }}
              className="w-7 h-7 rounded-full text-white flex items-center justify-center shadow-xs"
            >
              <User className="w-4 h-4" />
            </div>
            <ChevronDown className="w-3 h-3 text-[#302633]/60" />
          </button>

          {isProfileDropdownOpen && (
            <div className="absolute top-9 right-0 w-44 bg-white border border-[#EFE5D8] rounded-xl shadow-lg py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-[#F0EAE1] font-medium text-[#302633]">
                <div>{guestUser?.name || 'Guest User'}</div>
                <div className="text-[10px] text-[#302633]/60 font-normal">Guest Editor</div>
              </div>
              <button
                onClick={() => {
                  setIsGuestModalOpen(true);
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
              >
                Edit Guest Profile...
              </button>
              <button
                onClick={() => {
                  setGuestUser({ hasEntered: false });
                  setIsProfileDropdownOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-[#302633] hover:bg-[#FFF9F0] transition flex items-center justify-between border-t border-[#F0EAE1] mt-0.5 pt-1.5 cursor-pointer"
              >
                <span>Switch Guest User</span>
                <LogOut className="w-3.5 h-3.5 text-[#302633]/50" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
