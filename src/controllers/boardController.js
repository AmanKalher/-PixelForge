import { BoardModel } from '../models/boardModel.js';
import { ObjectModel } from '../models/objectModel.js';
import { RevisionModel } from '../models/revisionModel.js';

export const BoardController = {
  async createBoard(req, res, next) {
    try {
      const { name, settings, owner_id } = req.body;
      const board = await BoardModel.create({ name, settings, owner_id });
      res.status(201).json({ success: true, data: board });
    } catch (err) {
      next(err);
    }
  },

  async listBoards(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const boards = await BoardModel.list({ limit, offset });
      res.json({ success: true, count: boards.length, data: boards });
    } catch (err) {
      next(err);
    }
  },

  async getBoardById(req, res, next) {
    try {
      const { id } = req.params;
      const board = await BoardModel.getById(id);
      if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }

      // Include active canvas objects and revisions summary
      const objects = await ObjectModel.getByBoardId(id);
      const revisions = await RevisionModel.list(id, { limit: 5 });

      res.json({
        success: true,
        data: {
          ...board,
          objects,
          recentRevisions: revisions,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async updateBoard(req, res, next) {
    try {
      const { id } = req.params;
      const { name, settings, is_archived } = req.body;
      const updated = await BoardModel.update(id, { name, settings, is_archived });
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteBoard(req, res, next) {
    try {
      const { id } = req.params;
      const archived = await BoardModel.delete(id);
      if (!archived) {
        return res.status(404).json({ success: false, error: 'Board not found' });
      }
      res.json({ success: true, message: 'Board archived successfully' });
    } catch (err) {
      next(err);
    }
  },
};
