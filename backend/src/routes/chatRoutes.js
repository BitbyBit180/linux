import express from 'express';
import {
  getChats,
  createChat,
  getChat,
  renameChat,
  deleteChat,
  sendMessage,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { chatMessageLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// All chat routes require a logged-in user
router.use(protect);

router.route('/').get(getChats).post(createChat);
router.route('/:id').get(getChat).delete(deleteChat);
router.put('/:id/rename', renameChat);
router.post('/:id/messages', chatMessageLimiter, sendMessage);

export default router;
