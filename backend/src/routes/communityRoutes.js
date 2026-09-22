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
  createReport,
  listReports,
  updateReportStatus,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  suggestChannelForDraft,
} from '../controllers/communityController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import {
  rateLimit,
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
router.get('/admin/reports', requireAdmin, listReports);
router.patch('/admin/reports/:id', requireAdmin, updateReportStatus);
router.post('/reports', commentLimiter, createReport);
router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);
router.post(
  '/suggest-channel',
  rateLimit({ windowMs: 60 * 1000, max: 20, message: 'Too many suggestions — please wait a moment.' }),
  suggestChannelForDraft
);
router.route('/posts/:id').get(getPost).put(updatePost).delete(deletePost);
router.post('/posts/:id/vote', voteLimiter, votePost);
router.post('/posts/:id/comments', commentLimiter, addComment);
router.route('/comments/:id').put(updateComment).delete(deleteComment);
router.post('/comments/:id/vote', voteLimiter, voteComment);

export default router;
