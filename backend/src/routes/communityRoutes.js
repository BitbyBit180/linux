import express from 'express';
import {
  listPosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
  votePost,
  addComment,
  updateComment,
  deleteComment,
  voteComment,
  getChannelStats,
  getAuditLog,
} from '../controllers/communityController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import {
  voteLimiter,
  postLimiter,
  commentLimiter,
} from '../middleware/rateLimit.js';

const router = express.Router();

// All community routes require a logged-in user
router.use(protect);

router.route('/posts').get(listPosts).post(postLimiter, createPost);
router.get('/stats', getChannelStats);
router.get('/admin/audit', requireAdmin, getAuditLog);
router.route('/posts/:id').get(getPost).put(updatePost).delete(deletePost);
router.post('/posts/:id/vote', voteLimiter, votePost);
router.post('/posts/:id/comments', commentLimiter, addComment);
router.route('/comments/:id').put(updateComment).delete(deleteComment);
router.post('/comments/:id/vote', voteLimiter, voteComment);

export default router;
