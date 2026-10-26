import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { AssetModel } from '../models/assetModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const AssetController = {
  async uploadAsset(req, res, next) {
    try {
      const { id: boardId } = req.params;
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No media file provided' });
      }

      const storageKey = req.file.filename;
      const publicUrl = `/uploads/${storageKey}`;
      const mimeType = req.file.mimetype;
      const byteSize = req.file.size;

      const asset = await AssetModel.save({
        boardId,
        assetType: mimeType.startsWith('image/') ? 'image' : 'file',
        storageKey,
        publicUrl,
        mimeType,
        byteSize,
      });

      res.status(201).json({
        success: true,
        data: {
          ...asset,
          url: publicUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async listAssets(req, res, next) {
    try {
      const { id: boardId } = req.params;
      const assets = await AssetModel.listByBoard(boardId);
      res.json({ success: true, count: assets.length, data: assets });
    } catch (err) {
      next(err);
    }
  },
};
