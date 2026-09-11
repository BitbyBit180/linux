import express from 'express';
import {
  getDistroById,
  createDistro,
  updateDistro,
  deleteDistro,
} from '../controllers/distroController.js';

const router = express.Router();

// Detail collection only — catalogue lives at /api/flavours
router.route('/').post(createDistro);
router.route('/:id').get(getDistroById).put(updateDistro).delete(deleteDistro);

export default router;
