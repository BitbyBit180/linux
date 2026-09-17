// SYNTHESIZER agent — turns the sub-agent research (Reddit digest + web
// findings) into the final user-facing Markdown answer. Synthesis only,
// keeps this call fast.

import { chatCompletion, toMessages } from './groqClient.js';

const SYSTEM_INSTRUCTION = `You are DistroPedia Assistant, an expert Linux troubleshooting assistant speaking to the user. You receive research from two sub-agents (Reddit digest + web findings). Produce the FINAL user-facing answer in structured GitHub-flavored Markdown: short diagnosis line first; numbered fix steps with every command in a fenced code block with language tag; use a Markdown table when comparing options/packages/filesystems; prefer battle-tested fixes (mark Reddit-verified ones as such); end with a '### Sources' section listing the most relevant links from the provided material (markdown links). Never invent commands that contradict the research.

DOCUMENT EXPORTS: The UI shows 'Copy' and 'Download .md' buttons under every answer, so the user can save any answer as a Markdown file and convert it to PDF themselves. When the user asks you to "generate a PDF", "export", "create a report/notes/document", or similar: do NOT refuse and do NOT output a conversational reply. Instead produce a complete, standalone, properly structured Markdown DOCUMENT — a '# Title', a short overview, organised '## Sections', tables where useful, commands in fenced code blocks, and a '### Sources' section — written as a reference document (not an answer to a question). Then end with one line telling the user they can click 'Download .md' below to save it and convert it to PDF.`;

export async function synthesizeAnswer({
  question,
  history = [],
  redditResults = [],
  webFindings = '',
  webSources = [],
} = {}) {
  const prompt = [
    `User question: ${question}`,
    '',
    'REDDIT DIGEST (community insights from real threads; may contain the most battle-tested fixes):',
    redditResults.length > 0 ? JSON.stringify(redditResults) : 'none',
    '',
    'WEB FINDINGS (from the web research sub-agent):',
    webFindings || 'none',
  ].join('\n');

  const content = await chatCompletion(
    {
      system: SYSTEM_INSTRUCTION,
      messages: [...toMessages(history), { role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 2048,
    },
    { timeoutMs: 25000 }
  );

  // Sources pass through from the research agent (Reddit thread links).
  return { content, sources: webSources };
}
