/**
 * PixelForge Board API Client
 *
 * Typed REST API service connecting the frontend to the backend Node.js / PostgreSQL service.
 * Endpoints aligned with revised-canvas-engine routes (boardRoutes, revisionRoutes, objectRoutes).
 */

import {
  BoardSummary,
  BoardDetails,
  BoardApiResponse,
} from '../types/contracts';
import {
  CanvasObject,
  BoardRevision,
} from '../types/whiteboard';

const API_BASE_URL = (
  typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL
) ? String((import.meta as any).env.VITE_API_BASE_URL).replace(/\/$/, '') : 'http://localhost:3001';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<BoardApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();
    return json as BoardApiResponse<T>;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network request failed or server offline',
    };
  }
}

export const BoardApi = {
  /**
   * Health Probe
   */
  async checkHealth(): Promise<{ status: string; databaseConnected?: boolean }> {
    const res = await request<{ status: string; databaseConnected?: boolean }>('/api/health');
    return res.data || { status: 'offline', databaseConnected: false };
  },

  /**
   * Boards API
   */
  async listBoards(params?: { limit?: number; offset?: number }): Promise<BoardApiResponse<BoardSummary[]>> {
    const qs = params ? `?limit=${params.limit || 50}&offset=${params.offset || 0}` : '';
    return request<BoardSummary[]>(`/api/boards${qs}`);
  },

  async getBoard(id: string): Promise<BoardApiResponse<BoardDetails>> {
    return request<BoardDetails>(`/api/boards/${id}`);
  },

  async createBoard(payload: { name: string; settings?: Record<string, unknown>; owner_id?: string }): Promise<BoardApiResponse<BoardSummary>> {
    return request<BoardSummary>('/api/boards', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateBoard(id: string, updates: { name?: string; settings?: Record<string, unknown>; is_archived?: boolean }): Promise<BoardApiResponse<BoardSummary>> {
    return request<BoardSummary>(`/api/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async archiveBoard(id: string): Promise<BoardApiResponse<void>> {
    return request<void>(`/api/boards/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Revisions & History API
   */
  async listRevisions(boardId: string, params?: { limit?: number }): Promise<BoardApiResponse<BoardRevision[]>> {
    const qs = params?.limit ? `?limit=${params.limit}` : '';
    return request<BoardRevision[]>(`/api/boards/${boardId}/revisions${qs}`);
  },

  async createRevision(boardId: string, payload: { kind?: 'manual' | 'autosave'; label?: string; snapshot: unknown }): Promise<BoardApiResponse<BoardRevision>> {
    return request<BoardRevision>(`/api/boards/${boardId}/revisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getRevision(boardId: string, revisionId: string): Promise<BoardApiResponse<BoardRevision>> {
    return request<BoardRevision>(`/api/boards/${boardId}/revisions/${revisionId}`);
  },

  async restoreRevision(boardId: string, revisionId: string): Promise<BoardApiResponse<BoardRevision>> {
    return request<BoardRevision>(`/api/boards/${boardId}/revisions/${revisionId}/restore`, {
      method: 'POST',
    });
  },

  /**
   * Granular Objects API
   */
  async getObjects(boardId: string): Promise<BoardApiResponse<CanvasObject[]>> {
    return request<CanvasObject[]>(`/api/boards/${boardId}/objects`);
  },

  async syncObjects(boardId: string, objects: CanvasObject[]): Promise<BoardApiResponse<{ count: number }>> {
    return request<{ count: number }>(`/api/boards/${boardId}/objects/sync`, {
      method: 'POST',
      body: JSON.stringify({ objects }),
    });
  },

  async deleteObject(boardId: string, objectId: string): Promise<BoardApiResponse<void>> {
    return request<void>(`/api/boards/${boardId}/objects/${objectId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Room-based Canvas Persistence (PostgreSQL canvas_rooms & canvas_revisions schema compatibility)
   */
  async getRoomCanvas(roomId: string): Promise<BoardApiResponse<{ canvas_data: Record<string, unknown> }>> {
    return request<{ canvas_data: Record<string, unknown> }>(`/api/rooms/${roomId}/canvas`);
  },

  async saveRoomCanvas(roomId: string, canvasData: Record<string, unknown>): Promise<BoardApiResponse<void>> {
    return request<void>(`/api/rooms/${roomId}/canvas`, {
      method: 'PUT',
      body: JSON.stringify({ canvas_data: canvasData }),
    });
  },

  async getRoomRevisions(roomId: string): Promise<BoardApiResponse<BoardRevision[]>> {
    return request<BoardRevision[]>(`/api/rooms/${roomId}/revisions`);
  },

  async createRoomRevision(roomId: string, snapshot: unknown, revisionNote?: string): Promise<BoardApiResponse<BoardRevision>> {
    return request<BoardRevision>(`/api/rooms/${roomId}/revisions`, {
      method: 'POST',
      body: JSON.stringify({ snapshot, revision_note: revisionNote }),
    });
  },
};