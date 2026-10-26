import { ObjectModel } from '../models/objectModel.js';
import { BoardModel } from '../models/boardModel.js';

export const ObjectController = {
  async getObjects(req, res, next) {
    try {
      const { boardId } = req.params;
      const objects = await ObjectModel.getByBoardId(boardId);
      res.json({ success: true, count: objects.length, data: objects });
    } catch (err) {
      next(err);
    }
  },

  async upsertObject(req, res, next) {
    try {
      const { boardId } = req.params;
      const objData = req.body;
      const saved = await ObjectModel.upsert(boardId, objData);
      res.status(200).json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  },

  async syncObjects(req, res, next) {
    try {
      const { boardId } = req.params;
      const { objects } = req.body;
      if (!Array.isArray(objects)) {
        return res.status(400).json({ success: false, error: 'Expected objects array' });
      }

      const results = await ObjectModel.batchUpsert(boardId, objects);
      res.json({ success: true, count: results.length, data: results });
    } catch (err) {
      next(err);
    }
  },

  async deleteObject(req, res, next) {
    try {
      const { boardId, objectId } = req.params;
      const deleted = await ObjectModel.softDelete(boardId, objectId);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Object not found' });
      }
      res.json({ success: true, message: 'Object deleted successfully', data: deleted });
    } catch (err) {
      next(err);
    }
  },

  async clearBoard(req, res, next) {
    try {
      const { boardId } = req.params;
      await ObjectModel.clearBoard(boardId);
      res.json({ success: true, message: 'All board objects cleared' });
    } catch (err) {
      next(err);
    }
  },
};
