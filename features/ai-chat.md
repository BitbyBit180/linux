# Feature: DistroPedia AI Chat

**What:** Login-protected assistant. Sidebar history (create/rename/delete), markdown + code blocks + tables, typewriter reveal, copy/download `.md`. Answers cite Reddit threads + web sources.
**Route:** `/chat` (guards to `/login` when no token). **API:** `GET|POST /api/chat`, `GET|DELETE /api/chat/:id`, `PUT /:id/rename`, `POST /:id/messages { content }`.

## User flow
1. Login → `/chat` lists chats (`listChats`).
2. New chat → `createChat` → type message → `sendMessage` (takes 20-60s: LLM + search).
3. Reply streams in (typewriter), sources listed, chat auto-titles from first message.

## Code chain
```
ChatPage.jsx → services/chatApi.js:77 sendMessage() (Bearer dp_token)
  → routes/chatRoutes.js (all protect + chatMessageLimiter 30/m)
  → controllers/chatController.js:69 sendMessage pipeline:
      1. save user msg first (retry-safe)
      2. PARALLEL: searchReddit() + runWebResearch()  (best-effort, capped)
      3. synthesizeAnswer() → Markdown + Sources
      4. filterSources() → Jev Noul drops off-topic (never strips all)
      5. save assistant msg, auto-title, log timings/tokens
  → services/groqClient.js (plain fetch, GROQ_MODEL) + redditService.js + jevClient.js
```

Key snippets:
```js
// chatController.js — parallel research
const [redditStage, webStage] = await Promise.all([
  timed('reddit', () => searchReddit(content)),
  timed('web', () => runWebResearch({ question: content, history })),
]);
// no key → fast-fail 503 BEFORE saving
if (!process.env.GROQ_API_KEY) return res.status(503).json(...);
```

## Files involved
- Frontend: `src/pages/ChatPage.jsx` (`CodeBlock`, `TableBlock`, `extractText`), `src/services/chatApi.js`, `src/hooks/useAuth.js`.
- Backend: `src/routes/chatRoutes.js`, `src/controllers/chatController.js`, `src/models/Chat.js` (`messages[{role,content,sources}]`), `src/services/groqClient.js`, `src/services/redditService.js`, `src/services/webResearchAgent.js`, `src/services/synthesizerAgent.js`, `src/services/citationAgent.js`.

## How to demo / viva line
"Two researchers run in parallel, synthesizer writes the answer, Jev filters citations. User msg is saved before AI runs so retry is safe." Open `backend/src/controllers/chatController.js:101`.
