import { Router } from 'express';
import { ShareController } from '../controllers/shareController.js';

const router = Router();

router.get('/:token', ShareController.resolveShareLink);

export default router;
