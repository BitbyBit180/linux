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
} from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All community routes require a logged-in user
router.use(protect);

router.route('/posts').get(listPosts).post(createPost);
router.route('/posts/:id').get(getPost).put(updatePost).delete(deletePost);
router.post('/posts/:id/vote', votePost);
router.post('/posts/:id/comments', addComment);
router.route('/comments/:id').put(updateComment).delete(deleteComment);
router.post('/comments/:id/vote', voteComment);

export default router;
