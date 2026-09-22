// MODERATION-SCREEN agent — first-pass triage for new posts/comments.
// Batched Nouls (spam / harassment / off-topic) run in ONE Jev request;
// scores at/above FLAG_THRESHOLD create an AI report in the SAME queue
// admins already triage (source: 'ai'). Queue-only by policy: nothing is
// auto-hidden or deleted on a bare probability. Best-effort and
// fire-and-forget — screening must never fail or slow a post/comment.

import Report from '../models/Report.js';
import { systemOne } from './jevClient.js';

// Start permissive: queue candidates, tune from the approval rate later.
export const FLAG_THRESHOLD = 0.7;

const QUESTIONS = {
  is_spam: {
    type: 'noul',
    instructions: 'Is the content in `title`/`body` spam, advertising, or low-effort junk?',
    criteria: {
      true: 'Ads, link farming, gibberish, or content-free filler',
      false: 'A genuine question, discussion, or contribution',
    },
  },
  is_abusive: {
    type: 'noul',
    instructions: 'Does the content in `title`/`body` attack, insult, or harass a person or group?',
    criteria: {
      true: 'Insults, slurs, threats, or targeted hostility',
      false: 'Disagreement or criticism without personal attacks',
    },
  },
  is_offtopic: {
    type: 'noul',
    instructions:
      'Is the content in `title`/`body` off-topic for a Linux distro community (not about Linux, distros, open source, or adjacent tech)?',
    criteria: {
      true: 'Clearly unrelated subject matter',
      false: 'Linux-related or plausibly adjacent',
    },
  },
};

const REASON_FOR = { is_spam: 'spam', is_abusive: 'harassment', is_offtopic: 'off-topic' };

export function screenContent({ targetType, targetId, title = '', body = '' } = {}) {
  if (!process.env.TYPESAFE_API_KEY || !process.env.TYPESAFE_API_KEY.trim()) return;
  if (!targetType || !targetId) return;
  const text = `${title}\n${body}`.trim();
  if (text.length < 10) return;

  systemOne({
    state: { title: String(title).slice(0, 300), body: String(body).slice(0, 2000) },
    questions: QUESTIONS,
  })
    .then(async (data) => {
      const hits = Object.entries(REASON_FOR)
        .map(([qid, reason]) => ({ reason, p: Number(data?.answers?.[qid]?.noul) || 0 }))
        .filter((h) => h.p >= FLAG_THRESHOLD)
        .sort((a, b) => b.p - a.p);
      if (hits.length === 0) return;
      await Report.create({
        reporter: null,
        source: 'ai',
        targetType,
        targetId,
        reason: hits[0].reason,
        detail: `AI screen: ${hits.map((h) => `${h.reason} ${h.p.toFixed(2)}`).join(' · ')}`.slice(0, 500),
      });
    })
    .catch(() => {
      /* screening is best-effort */
    });
}
