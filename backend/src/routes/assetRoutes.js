import { Router } from 'express';
import { AssetController, uploadMiddleware } from '../controllers/assetController.js';

const router = Router({ mergeParams: true });

router.post('/upload', uploadMiddleware.single('file'), AssetController.uploadAsset);
router.get('/', AssetController.listAssets);

export default router;
