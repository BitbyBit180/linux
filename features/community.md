# Feature: Community Forum

**What:** Reddit-style forum. Channels = `general` or a `distroId`. Posts (title≤150, body≤10k, optional link), one-level threaded comments, up/down votes, search, sort `hot|new|top`, pagination, reports, notifications, admin audit.
**Routes:** `/community?channel=&sort=&search=` and `/community/:id`. **API:** `/api/community/*` (all `protect`).

## User flow
1. Feed: pick channel (left nav), sort, debounced search → `listPosts`.
2. Composer: write post → AI `suggestChannel` suggests `d/<distro>` → submit (optimistic).
3. Post detail: vote pill, edit/delete (author/admin), comment + reply, Best/New sort, report flag.
4. Bell polls `getNotifications` every 30s; admin triages `/admin/reports` + `/admin/audit`.

## Code chain
```
CommunityPage.jsx / PostDetailPage.jsx → services/communityApi.js
  → routes/communityRoutes.js:36  router.use(protect) + per-action limiters
      postLimiter 5/10m, commentLimiter 20/10m, voteLimiter 60/m
  → controllers/communityController.js
      listPosts (hotScore aggregation), CRUD (delete cascades), Vote.applyVote ($inc),
      addComment → Notification.create, screenContent → Report(source:'ai')
  → models/{Post,Comment,Vote,Report,Notification,AuditLog}.js
  → services/moderationAgent.js (Jev 3×Noul ≥0.7) + channelSuggestAgent.js (Jev Choice)
```

Key snippets:
```js
// communityRoutes.js — everything behind login
router.use(protect);
router.route('/posts').get(listPosts).post(postLimiter, createPost);

// Vote model — one vote per user/target, atomic score
// unique(user, targetType, targetId) + applyVote({value: 1|-1|0})
```

## Files involved
- Frontend: `src/pages/CommunityPage.jsx`, `src/pages/PostDetailPage.jsx`, `src/services/communityApi.js`, `src/components/community/*` (`CommunityShell`, `CommunityNav`, `CommunitySidebar`, `PostCard`, `CommentItem`, `VotePill`, `NotificationBell`, `ReportButton`, `Avatar`), `src/utils/timeAgo.js`.
- Backend: `src/routes/communityRoutes.js`, `src/controllers/communityController.js`, `src/models/Post.js|Comment.js|Vote.js|Report.js|Notification.js|AuditLog.js`, `src/services/moderationAgent.js|channelSuggestAgent.js`, `src/utils/auditLog.js`.

## How to demo / viva line
"Channels are validated against flavours; votes are atomic; AI moderation fire-and-forget flags spam into the same queue as user reports." Open `backend/src/routes/communityRoutes.js:36` and `backend/src/services/moderationAgent.js`.
