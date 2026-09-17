// WEB RESEARCH sub-agent — recalls known fixes for the user's Linux problem
// from model knowledge (official docs, wikis, StackExchange patterns).
// Best-effort: NEVER throws — on any failure it returns empty findings so the
// chat pipeline keeps working without it. (Groq has no search-grounding
// tool, so live web sources come from the Reddit digest instead.)

import { chatCompletion, toMessages } from './groqClient.js';

const SYSTEM_INSTRUCTION = `You are the WEB RESEARCH sub-agent of DistroPedia Assistant. Your job is ONLY to recall known solutions for the user's Linux problem (official docs, wikis, StackExchange patterns). Do not greet or converse. Return concise structured findings: (a) the most likely cause(s), (b) 2-4 viable fixes as short markdown bullets each with commands in fenced code blocks. Be dense and factual.`;

export async function runWebResearch({ question, history = [] } = {}) {
  try {
    const findings = await chatCompletion(
      {
        system: SYSTEM_INSTRUCTION,
        messages: [...toMessages(history), { role: 'user', content: question }],
        temperature: 0.3,
        maxTokens: 1024,
      },
      { timeoutMs: 20000 } // self-capped so the chat never hangs on research
    );
    return { findings, sources: [] };
  } catch {
    // Research is best-effort — must never break the chat.
    return { findings: '', sources: [] };
  }
}
