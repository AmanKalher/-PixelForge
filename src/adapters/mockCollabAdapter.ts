import { CollaborationClientContract } from '../types/contracts';
import {
  ConnectionStatus,
  Collaborator,
  BoardOperationPayload,
} from '../types/whiteboard';
import { MOCK_COLLABORATORS } from '../mocks/demoData';

/**
 * MockCollabAdapter
 * 
 * Standalone mock implementation of CollaborationClientContract.
 * Satisfies the contract for frontend UI verification without establishing
 * real Socket.IO connections or server-side sync, keeping boundaries intact for Member 3.
 */
export class MockCollabAdapter implements CollaborationClientContract {
  private status: ConnectionStatus = 'connected';
  private collaborators: Collaborator[] = [...MOCK_COLLABORATORS];
  private localUser: { name: string; color: string } = {
    name: 'Guest Maker',
    color: '#6366f1',
  };

  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private collaboratorListeners: Set<(collaborators: Collaborator[]) => void> = new Set();
  private operationListeners: Set<(op: BoardOperationPayload) => void> = new Set();

  public lastBroadcastedPresence: { x: number; y: number } | null = null;
  public operationsSent: BoardOperationPayload[] = [];

  async connect(boardId: string, user: { name: string; color: string }): Promise<void> {
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

