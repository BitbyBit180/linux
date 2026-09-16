import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Vote, { applyVote } from '../models/Vote.js';
import Flavour from '../models/Flavour.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Community (Reddit-style) posts + comments, scoped to per-distro channels.
// Every route is behind `protect` (see communityRoutes) — req.user is set.

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Validate a post title (shared by create + edit): 3-150 chars after trim.
const validatedTitle = (req, res, { optional = false } = {}) => {
  const raw = req.body?.title;
  if (raw === undefined && optional) return undefined;
  const title = (raw || '').trim();
  if (title.length < 3 || title.length > 150) {
    res.status(400);
    throw new Error('Title must be between 3 and 150 characters');
  }
  return title;
};

// Validate linkUrl if present: empty is fine (no link), otherwise http(s).
const validatedLinkUrl = (req, res, { optional = false } = {}) => {
  const raw = req.body?.linkUrl;
  if (raw === undefined && optional) return undefined;
  const link = (raw || '').trim();
  if (link && !/^https?:\/\//i.test(link)) {
    res.status(400);
    throw new Error('linkUrl must start with http:// or https://');
  }
  return link;
};

// Validate a channel: 'general' or an existing Flavour distroId slug.
const validatedChannel = async (req, res) => {
  const channel = (req.body?.channel || '').trim().toLowerCase();
  if (!channel) {
    res.status(400);
    throw new Error('Channel is required');
  }
  if (channel !== 'general' && !(await Flavour.exists({ distroId: channel }))) {
    res.status(400);
    throw new Error('Unknown channel');
  }
  return channel;
};

// Attach each doc's caller vote (0 when none) in ONE query for the whole batch.
const withUserVotes = async (userId, targetType, docs) => {
  if (docs.length === 0) return [];
  const votes = await Vote.find({
    user: userId,
    targetType,
    targetId: { $in: docs.map((d) => d._id) },
  }).lean();
  const byTarget = new Map(votes.map((v) => [v.targetId.toString(), v.value]));
  return docs.map((d) => ({
    ...d.toJSON(),
    userVote: byTarget.get(d._id.toString()) || 0,
  }));
};

// GET /api/community/posts?channel=&sort=hot|new|top&search=&page=&limit=
export const listPosts = asyncHandler(async (req, res) => {
  const channel = (req.query.channel || 'all').toLowerCase();
  const sort = req.query.sort || 'hot';
  const search = (req.query.search || '').trim();
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  const filter = {};
  if (channel !== 'all') filter.channel = channel;
  if (search) filter.title = new RegExp(escapeRegex(search), 'i');

  const total = await Post.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  let posts;
  if (sort === 'hot') {
    // hotScore = (score*2 + commentCount + 1) / (hoursOld + 2)^1.4
    const ranked = await Post.aggregate([
      { $match: filter },
      {
        $addFields: {
          hotScore: {
            $divide: [
              { $add: [{ $multiply: ['$score', 2] }, '$commentCount', 1] },
              {
                $pow: [
                  {
                    $add: [
                      { $divide: [{ $subtract: ['$$NOW', '$createdAt'] }, 3600000] },
                      2,
                    ],
                  },
                  1.4,
                ],
              },
            ],
          },
        },
      },
      { $sort: { hotScore: -1, _id: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { _id: 1 } },
    ]);
    const ids = ranked.map((r) => r._id);
    const found = await Post.find({ _id: { $in: ids } }).populate('author', 'name');
    const byId = new Map(found.map((p) => [p._id.toString(), p]));
    posts = ids.map((id) => byId.get(id.toString())).filter(Boolean);
  } else {
    // 'new' -> createdAt desc; anything else falls back to 'top' (score desc)
    const sortSpec = sort === 'new' ? { createdAt: -1 } : { score: -1 };
    posts = await Post.find(filter)
      .populate('author', 'name')
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit);
  }

  res.json({
    success: true,
    data: {
      posts: await withUserVotes(req.user._id, 'post', posts),
      page,
      totalPages,
      hasMore: page * limit < total,
    },
  });
});

// POST /api/community/posts { channel, title, body?, linkUrl? }
export const createPost = asyncHandler(async (req, res) => {
  const channel = await validatedChannel(req, res);
  const title = validatedTitle(req, res);
  const linkUrl = validatedLinkUrl(req, res);
  const body = req.body?.body || '';

  const post = await Post.create({
    author: req.user._id,
    channel,
    title,
    body,
    linkUrl,
  });
  await post.populate('author', 'name');
  res.status(201).json({ success: true, data: { ...post.toJSON(), userVote: 0 } });
});

// GET /api/community/posts/:id — post plus its comments as a tree.
export const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name');
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const [postShaped] = await withUserVotes(req.user._id, 'post', [post]);

  const comments = await Comment.find({ post: post._id })
    .populate('author', 'name')
    .sort({ createdAt: 1 });

  const votes = await Vote.find({
    user: req.user._id,
    targetType: 'comment',
    targetId: { $in: comments.map((c) => c._id) },
  }).lean();
  const voteByTarget = new Map(votes.map((v) => [v.targetId.toString(), v.value]));

  // Build the tree: parent null -> root; otherwise nested under its parent.
  const shaped = comments.map((c) => ({
    ...c.toJSON(),
    userVote: voteByTarget.get(c._id.toString()) || 0,
    replies: [],
  }));
  const byId = new Map(shaped.map((c) => [c.id, c]));
  const tree = [];
  for (const c of shaped) {
    const parent = c.parent ? byId.get(c.parent.toString()) : null;
    if (parent) parent.replies.push(c);
    else tree.push(c);
  }

  res.json({ success: true, data: { post: postShaped, comments: tree } });
});

// PUT /api/community/posts/:id { title?, body?, linkUrl? } — author or admin.
export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name');
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  if (!post.author._id.equals(req.user._id) && !req.user.isAdmin) {
    res.status(403);
    throw new Error('You can only edit your own posts');
  }

  const title = validatedTitle(req, res, { optional: true });
  if (title !== undefined) post.title = title;
  if (req.body?.body !== undefined) post.body = req.body.body;
  const linkUrl = validatedLinkUrl(req, res, { optional: true });
  if (linkUrl !== undefined) post.linkUrl = linkUrl;

  await post.save();
  res.json({
    success: true,
    data: { ...post.toJSON(), userVote: await getUserVote(req.user._id, 'post', post._id) },
  });
});

// Single-target variant of withUserVotes.
const getUserVote = (userId, targetType, targetId) =>
  Vote.findOne({ user: userId, targetType, targetId })
    .then((v) => v?.value || 0);

// DELETE /api/community/posts/:id — author or admin; cascades to comments + votes.
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  if (!post.author.equals(req.user._id) && !req.user.isAdmin) {
    res.status(403);
    throw new Error('You can only delete your own posts');
  }

  const commentIds = (
    await Comment.find({ post: post._id }).select('_id').lean()
  ).map((c) => c._id);

  await Comment.deleteMany({ post: post._id });
  await Vote.deleteMany({
    $or: [
      { targetType: 'post', targetId: post._id },
      { targetType: 'comment', targetId: { $in: commentIds } },
    ],
  });
  await post.deleteOne();

  res.json({ success: true, message: 'Post deleted' });
});

// POST /api/community/posts/:id/vote { value } — 1, -1 or 0 (remove vote).
export const votePost = asyncHandler(async (req, res) => {
  const value = Number(req.body?.value);
  if (![1, -1, 0].includes(value)) {
    res.status(400);
    throw new Error('value must be 1, -1, or 0 (0 removes your vote)');
  }
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const result = await applyVote({
    userId: req.user._id,
    targetType: 'post',
    targetId: post._id,
    value,
  });
  res.json({ success: true, data: result });
});

// POST /api/community/posts/:id/comments { body, parentId? }
export const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  const body = (req.body?.body || '').trim();
  if (!body || body.length > 5000) {
    res.status(400);
    throw new Error('Comment body is required (1-5000 characters)');
  }
  const parentId = req.body?.parentId || null;
  if (parentId) {
    const parent = await Comment.findById(parentId);
    if (!parent || !parent.post.equals(post._id)) {
      res.status(400);
      throw new Error('Parent comment does not belong to this post');
    }
  }

  const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    parent: parentId,
    body,
  });
  await Post.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } });
  await comment.populate('author', 'name');
  res.status(201).json({ success: true, data: { ...comment.toJSON(), userVote: 0 } });
});

// PUT /api/community/comments/:id { body } — author or admin.
export const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id).populate('author', 'name');
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  if (!comment.author._id.equals(req.user._id) && !req.user.isAdmin) {
    res.status(403);
    throw new Error('You can only edit your own comments');
  }
  const body = (req.body?.body || '').trim();
  if (!body || body.length > 5000) {
    res.status(400);
    throw new Error('Comment body is required (1-5000 characters)');
  }
  comment.body = body;
  await comment.save();
  res.json({
    success: true,
    data: {
      ...comment.toJSON(),
      userVote: await getUserVote(req.user._id, 'comment', comment._id),
    },
  });
});

// DELETE /api/community/comments/:id — author or admin.
// Deletes the comment AND its replies (recursively), decrements the post's
// commentCount accordingly, and removes votes for every deleted comment.
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  if (!comment.author.equals(req.user._id) && !req.user.isAdmin) {
    res.status(403);
    throw new Error('You can only delete your own comments');
  }

  // Collect the comment plus all descendants (replies of replies included).
  const ids = [comment._id];
  let frontier = [comment._id];
  while (frontier.length > 0) {
    const children = await Comment.find({ parent: { $in: frontier } })
      .select('_id')
      .lean();
    frontier = children.map((c) => c._id);
    ids.push(...frontier);
  }

  await Comment.deleteMany({ _id: { $in: ids } });
  await Vote.deleteMany({ targetType: 'comment', targetId: { $in: ids } });
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -ids.length } });

  res.json({
    success: true,
    message: `Comment deleted${ids.length > 1 ? ` (with ${ids.length - 1} repl${ids.length === 2 ? 'y' : 'ies'})` : ''}`,
  });
});

// POST /api/community/comments/:id/vote { value }
export const voteComment = asyncHandler(async (req, res) => {
  const value = Number(req.body?.value);
  if (![1, -1, 0].includes(value)) {
    res.status(400);
    throw new Error('value must be 1, -1, or 0 (0 removes your vote)');
  }
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }
  const result = await applyVote({
    userId: req.user._id,
    targetType: 'comment',
    targetId: comment._id,
    value,
  });
  res.json({ success: true, data: result });
});
