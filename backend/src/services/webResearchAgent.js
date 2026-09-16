// WEB RESEARCH sub-agent — researches the user's Linux problem on the live
// web via Gemini + google_search grounding (docs, wikis, StackExchange, Reddit).
// Best-effort: NEVER throws — on any failure it returns empty findings so the
// chat pipeline keeps working without it.

import { generateContent, extractSources, toContents } from './geminiClient.js';

const SYSTEM_INSTRUCTION = `You are the WEB RESEARCH sub-agent of DistroPedia Assistant. Your job is ONLY to research the user's Linux problem on the live web (official docs, wikis, StackExchange, Reddit threads). Do not greet or converse. Return concise structured findings: (a) the most likely cause(s), (b) 2-4 viable fixes as short markdown bullets each with commands in fenced code blocks, (c) a '### Candidate sources' markdown link list. Be dense and factual.`;

export async function runWebResearch({ question, history = [] } = {}) {
  try {
    const data = await generateContent(
      {
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        tools: [{ google_search: {} }],
        contents: [...toContents(history), { role: 'user', parts: [{ text: question }] }],
      },
      { timeoutMs: 20000 } // self-capped so the chat never hangs on research
    );
    const candidate = data?.candidates?.[0];
    const findings = (candidate?.content?.parts || [])
      .map((p) => p.text || '')
      .join('')
      .trim();
    return { findings, sources: extractSources(candidate) };
  } catch {
    // Research is best-effort — must never break the chat.
    return { findings: '', sources: [] };
  }
}
