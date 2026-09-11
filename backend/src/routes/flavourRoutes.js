import express from 'express';
import {
  getFlavours,
  getPopularFlavours,
  getFlavourCategories,
  getFlavourById,
  createFlavour,
  updateFlavour,
  deleteFlavour,
} from '../controllers/flavourController.js';

const router = express.Router();

// Static routes BEFORE /:id so "popular" isn't treated as an id
router.get('/popular', getPopularFlavours);
router.get('/categories', getFlavourCategories);

router.route('/').get(getFlavours).post(createFlavour);
router.route('/:id').get(getFlavourById).put(updateFlavour).delete(deleteFlavour);

export default router;
