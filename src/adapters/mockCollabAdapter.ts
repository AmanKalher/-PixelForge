import { CollaborationClientContract } from '../types/contracts';
import {
  ConnectionStatus,
  Collaborator,
  BoardOperationPayload,
  BoardRevision,
} from '../types/whiteboard';

/**
 * MockCollabAdapter
 * 
 * Standalone mock implementation of CollaborationClientContract.
 * Satisfies the contract for frontend UI verification without establishing
 * real Socket.IO connections or server-side sync, keeping boundaries intact for Member 3.
 */
export class MockCollabAdapter implements CollaborationClientContract {
  private status: ConnectionStatus = 'connected';
  private collaborators: Collaborator[] = [];
  private localUser: { name: string; color: string } = {
    name: 'Guest Maker',
    color: '#6366f1',
  };
  private currentBoardId: string = 'default-board';
  private revisions: BoardRevision[] = [];

  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private collaboratorListeners: Set<(collaborators: Collaborator[]) => void> = new Set();
  private operationListeners: Set<(op: BoardOperationPayload) => void> = new Set();
  private revisionListeners: Set<(revisions: BoardRevision[]) => void> = new Set();

  public lastBroadcastedPresence: { x: number; y: number } | null = null;
  public operationsSent: BoardOperationPayload[] = [];

  constructor() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const saved = window.sessionStorage.getItem('pixelforge_session_revisions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.revisions = parsed;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  async connect(boardId: string, user: { name: string; color: string }): Promise<void> {
    this.currentBoardId = boardId;
    this.localUser = user;
    console.debug(`[MockCollabAdapter] Simulated connect to board "${boardId}" for ${user.name}`);
    this.status = 'connected';
    this.notifyStatus();
    this.notifyCollaborators();
  }

  disconnect(): void {
    console.debug('[MockCollabAdapter] Simulated disconnect');
    this.status = 'offline';
    this.notifyStatus();
  }

  updatePresence(cursor: { x: number; y: number }): void {
    this.lastBroadcastedPresence = cursor;
    // No-op for real network, logs or verifies in tests
  }

  updateDisplayName(name: string): void {
    this.localUser.name = name;
    console.debug(`[MockCollabAdapter] Local user display name updated: ${name}`);
  }

  updateColor(color: string): void {
    this.localUser.color = color;
    console.debug(`[MockCollabAdapter] Local user color updated: ${color}`);
  }

  sendOperation(operation: BoardOperationPayload): void {
    this.operationsSent.push(operation);
    console.debug('[MockCollabAdapter] Board operation logged (simulated):', operation.type);
  }

  sendCanvasSync(payload: { objects?: import('../types/whiteboard').CanvasObject[]; fabricState?: unknown }): void {
    console.debug('[MockCollabAdapter] Canvas sync dispatched (simulated):', payload.objects?.length ?? 0, 'objects');
  }

  async createRevision(payload: { kind?: 'manual' | 'autosave'; label?: string; snapshot?: unknown }): Promise<BoardRevision> {
    const rev: BoardRevision = {
      id: `local-rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      boardId: this.currentBoardId,
      revisionNumber: this.revisions.length + 1,
      kind: payload.kind || 'manual',
      label: payload.label || `Checkpoint ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      snapshot: payload.snapshot || { objects: [], timestamp: Date.now() },
      createdBy: this.localUser.name || 'Anonymous Guest',
      createdAt: new Date().toISOString(),
    };
    this.revisions.unshift(rev);
    this.persistRevisions();
    this.notifyRevisions();
    console.debug('[MockCollabAdapter] Revision created and recorded:', rev.id, rev.label);
    return rev;
  }

  getRevisions(): BoardRevision[] {
    return [...this.revisions];
  }

  onRevisionsChange(listener: (revisions: BoardRevision[]) => void): () => void {
    this.revisionListeners.add(listener);
    listener([...this.revisions]);
    return () => this.revisionListeners.delete(listener);
  }

  private notifyRevisions() {
    const copy = [...this.revisions];
    for (const listener of this.revisionListeners) {
      listener(copy);
    }
  }

  private persistRevisions() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('pixelforge_session_revisions', JSON.stringify(this.revisions));
      }
    } catch {
      // ignore quota limits
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getCollaborators(): Collaborator[] {
    return this.collaborators;
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  onCollaboratorsChange(listener: (collaborators: Collaborator[]) => void): () => void {
    this.collaboratorListeners.add(listener);
    listener(this.collaborators);
    return () => this.collaboratorListeners.delete(listener);
  }

  onOperationReceived(listener: (operation: BoardOperationPayload) => void): () => void {
    this.operationListeners.add(listener);
    return () => this.operationListeners.delete(listener);
  }

  private notifyStatus() {
    for (const listener of this.statusListeners) {
      listener(this.status);
    }
  }

  private notifyCollaborators() {
    for (const listener of this.collaboratorListeners) {
      listener(this.collaborators);
    }
  }

  /**
   * Development / Simulation helper to toggle connection statuses
   */
  setSimulatedStatus(status: ConnectionStatus) {
    this.status = status;
    this.notifyStatus();
  }

  /**
   * Development / Simulation helper to toggle mock collaborators
   */
  setSimulatedCollaborators(collaborators: Collaborator[]) {
    this.collaborators = collaborators;
    this.notifyCollaborators();
  }
}

