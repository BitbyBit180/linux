import Chat from '../models/Chat.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { searchReddit } from '../services/redditService.js';
import { runWebResearch } from '../services/webResearchAgent.js';
import { synthesizeAnswer, synthesizeAnswerStream } from '../services/synthesizerAgent.js';
import { filterSources } from '../services/citationAgent.js';
import { NO_KEY_MESSAGE, hasGroqKeys } from '../services/groqClient.js';

// Chats are private: a mismatch is reported as 404 so we don't leak existence.
const findOwnedChat = async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (chat && chat.user.equals(req.user._id)) return chat;
  res.status(404);
  throw new Error('Chat not found');
};

// GET /api/chat — lean list (id, title, updatedAt, messageCount), newest first.
export const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
  res.json({
    success: true,
    count: chats.length,
    data: chats.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      updatedAt: c.updatedAt,
      messageCount: (c.messages || []).length,
    })),
  });
});

// POST /api/chat — create an empty chat.
export const createChat = asyncHandler(async (req, res) => {
  const chat = await Chat.create({ user: req.user._id });
  res.status(201).json({ success: true, data: chat });
});

// GET /api/chat/:id — full chat with all messages.
export const getChat = asyncHandler(async (req, res) => {
  const chat = await findOwnedChat(req, res);
  res.json({ success: true, data: chat });
});

// PUT /api/chat/:id/rename { title }
export const renameChat = asyncHandler(async (req, res) => {
  const chat = await findOwnedChat(req, res);
  const title = (req.body?.title || '').trim().slice(0, 80);
  if (!title) {
    res.status(400);
    throw new Error('A chat title is required');
  }
  chat.title = title;
  await chat.save();
  res.json({ success: true, data: chat });
});

// DELETE /api/chat/:id
export const deleteChat = asyncHandler(async (req, res) => {
  const chat = await findOwnedChat(req, res);
  await chat.deleteOne();
  res.json({ success: true, message: `Chat ${req.params.id} deleted` });
});

// POST /api/chat/:id/messages { content }
// Multi-agent pipeline: the user message is saved first, then the two research
// agents (Reddit + web research) run IN PARALLEL, and the synthesizer produces
// the final answer. The user message stays saved on failure so the client can
// retry; the assistant message is only added on success.
export const sendMessage = asyncHandler(async (req, res) => {
  const chat = await findOwnedChat(req, res);

  const content = (req.body?.content || '').trim();
  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  // Fast-fail before doing any work or saving anything.
  if (!hasGroqKeys()) {
    res.status(503).json({ success: false, message: NO_KEY_MESSAGE });
    return;
  }

  // History for the model = everything before this new message.
  const history = chat.messages.map((m) => ({ role: m.role, text: m.content }));

  const userMessage = { role: 'user', content, sources: [] };
  chat.messages.push(userMessage);
  await chat.save(); // persisted first so the client can retry on failure

  // Research agents in parallel — each self-capped (Reddit ~8s, web ~20s)
  // and best-effort (reddit → [], web → { findings: '', sources: [] }).
  // Stage timings + token usage are logged as one line per message so slow
  // or expensive stages show up in plain server logs (data before tuning).
  const started = Date.now();
  const timed = async (label, fn) => {
    const t0 = Date.now();
    const out = await fn();
    return { label, out, ms: Date.now() - t0 };
  };
  const [redditStage, webStage] = await Promise.all([
    timed('reddit', () => searchReddit(content)),
    timed('web', () => runWebResearch({ question: content, history })),
  ]);
  const redditResults = redditStage.out;
  const webResearch = webStage.out;

  // Final answer from the synthesizer (no search tool — synthesis only).
  let answer;
  let synthMs = 0;
  try {
    const t0 = Date.now();
    answer = await synthesizeAnswer({
      question: content,
      history,
      redditResults,
      webFindings: webResearch.findings,
      webSources: webResearch.sources,
    });
    synthMs = Date.now() - t0;
  } catch (err) {
    res.status(502).json({
      success: false,
      message: err.message || 'AI assistant failed to produce an answer. Please try again.',
    });
    return;
  }

  // Merge web sources with the top 3 Reddit thread URLs, deduped.
  const redditThreads = redditResults
    .slice(0, 3)
    .map((r) => ({ title: r.title, url: r.url }));
  const seen = new Set();
  const sources = [];
  for (const s of [...(answer.sources || []), ...redditThreads]) {
    if (!s?.url || seen.has(s.url)) continue;
    seen.add(s.url);
    sources.push(s);
  }

  // Relevance screen: drop cited sources Jev judges off-topic (keeps all
  // on doubt or failure — the filter must never strip everything).
  const screened = await filterSources({ question: content, sources });

  const assistantMessage = {
    role: 'assistant',
    content: answer.content,
    sources: screened.sources,
  };
  chat.messages.push(assistantMessage);
  if (chat.title === 'New chat') {
    chat.title = content.slice(0, 48);
  }
  await chat.save();

  const tokens = (webResearch.usage?.total_tokens || 0) + (answer.usage?.total_tokens || 0);
  console.log(
    `[chat] chat=${chat._id} reddit=${redditStage.ms}ms(n=${redditResults.length}) ` +
      `web=${webStage.ms}ms(tok=${webResearch.usage?.total_tokens || 0}) ` +
      `synth=${synthMs}ms(tok=${answer.usage?.total_tokens || 0}) ` +
      `citations=dropped:${screened.dropped}/${sources.length} ` +
      `total=${Date.now() - started}ms tokens=${tokens}`
  );

  res.json({ success: true, data: { userMessage, assistantMessage } });
});

// POST /api/chat/:id/messages/stream { content }
// SSE twin of sendMessage: same pipeline, but the synthesizer's tokens are
// relayed live (`token` events) instead of waiting for the full answer.
// Events: `stage` {stage}, `token` {text}, `done` {userMessage,
// assistantMessage}, `error` {message}. The legacy JSON endpoint above is
// untouched — the client falls back to it when streaming is unavailable.
//
// NOTE: not wrapped in asyncHandler on purpose — once SSE headers flush,
// errors must go out as `error` events, not errorMiddleware JSON.
export const sendMessageStream = async (req, res) => {
  // ---- pre-SSE phase: normal JSON errors, same contract as sendMessage ----
  let chat;
  let content;
  try {
    chat = await Chat.findById(req.params.id);
    if (!chat || !chat.user.equals(req.user._id)) {
      res.status(404).json({ success: false, message: 'Chat not found' });
      return;
    }
    content = (req.body?.content || '').trim();
    if (!content) {
      res.status(400).json({ success: false, message: 'Message content is required' });
      return;
    }
    if (!hasGroqKeys()) {
      res.status(503).json({ success: false, message: NO_KEY_MESSAGE });
      return;
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Stream failed to start' });
    return;
  }

  const history = chat.messages.map((m) => ({ role: m.role, text: m.content }));

  const userMessage = { role: 'user', content, sources: [] };
  chat.messages.push(userMessage);
  await chat.save(); // persisted first so the client can retry on failure

  // ---- SSE phase ----
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // don't let proxies buffer the tokens
  });
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  const send = (event, data) => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };
  // Heartbeat so idle stretches (research stage) don't trip proxy timeouts.
  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) res.write(': ping\n\n');
  }, 15000);

  const abortCtrl = new AbortController();
  let clientGone = false;
  req.on('close', () => {
    clientGone = true;
    abortCtrl.abort();
  });

  const started = Date.now();
  try {
    send('stage', { stage: 'research' });
    const [redditResults, webResearch] = await Promise.all([
      searchReddit(content),
      runWebResearch({ question: content, history }),
    ]);
    if (clientGone) return;

    send('stage', { stage: 'synthesizing' });
    let streamed = '';
    let answer;
    try {
      answer = await synthesizeAnswerStream(
        {
          question: content,
          history,
          redditResults,
          webFindings: webResearch.findings,
          onToken: (delta) => {
            streamed += delta;
            send('token', { text: delta });
          },
        },
        { signal: abortCtrl.signal }
      );
    } catch (err) {
      // Upstream died mid-stream. If nothing arrived, the client falls back
      // to the legacy endpoint; the saved user message makes that a retry.
      send('error', { message: err.message || 'AI assistant failed. Please try again.' });
      return;
    }
    if (clientGone) return;

    send('stage', { stage: 'citations' });
    const redditThreads = redditResults
      .slice(0, 3)
      .map((r) => ({ title: r.title, url: r.url }));
    const seen = new Set();
    const sources = [];
    for (const s of [...(webResearch.sources || []), ...redditThreads]) {
      if (!s?.url || seen.has(s.url)) continue;
      seen.add(s.url);
      sources.push(s);
    }

    const screened = await filterSources({ question: content, sources });
    if (clientGone) return;

    const assistantMessage = {
      role: 'assistant',
      content: answer.content,
      sources: screened.sources,
    };
    chat.messages.push(assistantMessage);
    if (chat.title === 'New chat') {
      chat.title = content.slice(0, 48);
    }
    await chat.save();

    const tokens =
      (webResearch.usage?.total_tokens || 0) + (answer.usage?.total_tokens || 0);
    console.log(
      `[chat:stream] chat=${chat._id} streamed=${streamed.length}chars ` +
        `citations=dropped:${screened.dropped}/${sources.length} ` +
        `total=${Date.now() - started}ms tokens=${tokens}`
    );

    send('done', { userMessage, assistantMessage });
  } catch (err) {
    send('error', { message: err.message || 'Stream failed. Please try again.' });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
};
