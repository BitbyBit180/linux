import express from 'express';
import {
  getDistrosForCompare,
  getDistroById,
  createDistro,
  updateDistro,
  deleteDistro,
} from '../controllers/distroController.js';

const router = express.Router();

// Detail collection only — catalogue lives at /api/flavours
router.route('/').post(createDistro);
// Must be registered before /:id so "compare" isn't matched as a distro id
router.route('/compare').get(getDistrosForCompare);
router.route('/:id').get(getDistroById).put(updateDistro).delete(deleteDistro);

export default router;
