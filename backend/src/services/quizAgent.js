// QUIZ agent — turns "Find Your Distro" quiz answers into a personalized
// recommendation with a human-readable explanation. Single Groq call,
// synthesis only (keeps it fast and cheap).
//
// Contract: the controller passes the user's readable Q&A, the rule-based
// shortlist (hint), and the distro catalogue. We return the parsed JSON:
// { winner, runnersUp[2], explanation, strengths{}, tip }.

import { chatCompletion } from './groqClient.js';

const SYSTEM_INSTRUCTION = `You are DistroPedia's distro-matching expert. A user answered a "Find Your Distro" quiz. Recommend exactly ONE winner and TWO runners-up chosen ONLY from the allowed catalogue ids.

Weigh the whole person, not just keywords: a beginner who wants gaming and proprietary drivers should get Pop!_OS or Mint, not Arch — even if they said "latest updates". A security professional gets Kali. A tinkerer who lives in the terminal gets Arch, Gentoo, NixOS or Void. Someone reviving old hardware gets Alpine or Void. Prefer the rule-based shortlist when it fits, but overrule it when the user's answers clearly point elsewhere (that is your value over the point system).

Return STRICT JSON only — no markdown fences, no prose outside the JSON:
{
  "winner": "<catalogue id>",
  "runnersUp": ["<catalogue id>", "<catalogue id>"],
  "explanation": "2-3 warm, personal sentences explaining WHY the winner fits THIS user. Reference their actual answers (experience, use-case, hardware, attitude to effort). No generic marketing fluff.",
  "strengths": { "<winner id>": "one line: its killer trait for this user", "<runner id>": "one line each" },
  "tip": "one concrete first step after installing the winner (under 20 words)"
}`;

function parseRecommendation(text) {
  const clean = String(text || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI returned an unreadable recommendation. Please try again.');
  }
  return JSON.parse(clean.slice(start, end + 1));
}

export async function recommendDistro({ answers = [], shortlist = [], catalogue = [] } = {}) {
  const qaLines = answers.map((a) => `- ${a.question} → ${a.answer}`).join('\n');
  const shortLines = shortlist
    .map((s) => `- ${s.distroId}${s.points !== undefined ? ` (${s.points} pts)` : ''}${s.reasons?.length ? `: ${s.reasons.join('; ')}` : ''}`)
    .join('\n');
  const catLines = catalogue
    .map(
      (d) =>
        `- ${d.id} (${d.name}): ${d.tagline || ''} | category: ${d.category || ''} | desktop: ${d.desktop || ''} | release: ${d.releaseModel || ''} | min RAM: ${d.minRam || ''}`
    )
    .join('\n');

  const prompt = [
    'USER QUIZ ANSWERS:',
    qaLines || 'none',
    '',
    'RULE-BASED SHORTLIST (hint — you may overrule it with justification in the explanation):',
    shortLines || 'none',
    '',
    'ALLOWED CATALOGUE (winner + runnersUp must come from these ids):',
    catLines,
  ].join('\n');

  const text = await chatCompletion(
    {
      system: SYSTEM_INSTRUCTION,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 1024,
      jsonMode: true,
    },
    { timeoutMs: 25000 }
  );

  return parseRecommendation(text);
}
