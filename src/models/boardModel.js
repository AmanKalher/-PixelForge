import { v4 as uuidv4 } from 'uuid';
import { query, isDbConnected, memoryStore } from '../config/db.js';

export const BoardModel = {
  async create({ name = 'Untitled board', settings = {}, owner_id = null } = {}) {
    if (isDbConnected()) {
      try {
        const text = `
          INSERT INTO pixelforge.boards (name, settings, owner_id)
          VALUES ($1, $2, $3)
          RETURNING *;
        `;
        const res = await query(text, [name, JSON.stringify(settings), owner_id]);
        return res.rows[0];
      } catch (err) {
        console.warn('[BoardModel.create] Falling back to memoryStore:', err.message);
      }
    }

    const board = {
      id: uuidv4(),
      name,
      owner_id,
      schema_version: 1,
      settings,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    };
    memoryStore.boards.set(board.id, board);
    return board;
  },

  async getById(id) {
    if (isDbConnected()) {
      try {
        const text = `SELECT * FROM pixelforge.boards WHERE id = $1 AND is_archived = false;`;
        const res = await query(text, [id]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[BoardModel.getById] Falling back to memoryStore:', err.message);
      }
    }
    const board = memoryStore.boards.get(id);
    return board && !board.is_archived ? board : null;
  },

  async list({ limit = 50, offset = 0 } = {}) {
    if (isDbConnected()) {
      try {
        const text = `
          SELECT * FROM pixelforge.boards
          WHERE is_archived = false
          ORDER BY last_activity_at DESC
          LIMIT $1 OFFSET $2;
        `;
        const res = await query(text, [limit, offset]);
        return res.rows;
      } catch (err) {
        console.warn('[BoardModel.list] Falling back to memoryStore:', err.message);
      }
    }
    return Array.from(memoryStore.boards.values())
      .filter((b) => !b.is_archived)
      .sort((a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at))
      .slice(offset, offset + limit);
  },

  async update(id, { name, settings, is_archived } = {}) {
    if (isDbConnected()) {
      try {
        const updates = [];
        const params = [id];
        let idx = 2;

        if (name !== undefined) {
          updates.push(`name = $${idx++}`);
          params.push(name);
        }
        if (settings !== undefined) {
          updates.push(`settings = $${idx++}`);
          params.push(JSON.stringify(settings));
        }
        if (is_archived !== undefined) {
          updates.push(`is_archived = $${idx++}`);
          params.push(is_archived);
        }

        if (updates.length === 0) return await this.getById(id);

        const text = `
          UPDATE pixelforge.boards
          SET ${updates.join(', ')}, updated_at = now(), last_activity_at = now()
          WHERE id = $1
          RETURNING *;
        `;
        const res = await query(text, params);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('[BoardModel.update] Falling back to memoryStore:', err.message);
      }
    }

    const board = memoryStore.boards.get(id);
    if (!board) return null;
    if (name !== undefined) board.name = name;
    if (settings !== undefined) board.settings = settings;
    if (is_archived !== undefined) board.is_archived = is_archived;
    board.updated_at = new Date().toISOString();
    board.last_activity_at = new Date().toISOString();
    return board;
  },

  async delete(id) {
    return await this.update(id, { is_archived: true });
  },
};
