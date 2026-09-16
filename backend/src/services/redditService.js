// Best-effort Reddit search — feeds "battle-tested" community fixes to the AI.
// NEVER throws: on any failure (network, timeout, Reddit down) it returns []
// so the chat pipeline keeps working without it.

const USER_AGENT = 'DistroPediaAssistant/1.0 (Linux Distro Hub; AI assistant)';
const TOTAL_BUDGET_MS = 8000; // hard cap for the whole search

const fetchJson = async (url, timeoutMs) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`Reddit responded ${res.status}`);
  return res.json();
};

const clip = (text, max) => (text || '').replace(/\s+/g, ' ').trim().slice(0, max);

// Fetch top comments for a single post; returns [] on failure.
const fetchTopComments = async (postId, timeoutMs) => {
  try {
    const data = await fetchJson(
      `https://www.reddit.com/comments/${postId}.json?limit=5&sort=top`,
      timeoutMs
    );
    const listing = Array.isArray(data) ? data[1] : null;
    const children = listing?.data?.children || [];
    return children
      .map((c) => c?.data?.body)
      .filter(Boolean)
      .slice(0, 3)
      .map((body) => clip(body, 300));
  } catch {
    return [];
  }
};

// GET https://www.reddit.com/search.json?q=<query+linux>&sort=relevance&t=year&limit=8
// Picks up to `limit` text/link posts, enriches up to 3 with top comments.
export async function searchReddit(query, { limit = 4 } = {}) {
  const run = async () => {
    const q = encodeURIComponent(`${query} linux`);
    const data = await fetchJson(
      `https://www.reddit.com/search.json?q=${q}&sort=relevance&t=year&limit=8`,
      6000
    );

    const posts = (data?.data?.children || [])
      .map((c) => c?.data)
      .filter((p) => p && !p.stickied);

    const picked = posts.slice(0, limit);

    // Enrich the first 3 with top comments (sequential — stays inside budget).
    const results = [];
    for (const [i, post] of picked.entries()) {
      const topComments = i < 3 ? await fetchTopComments(post.id, 2500) : [];
      results.push({
        title: clip(post.title, 200),
        subreddit: post.subreddit || '',
        url: `https://www.reddit.com${post.permalink || ''}`,
        snippet: clip(post.selftext, 400),
        topComments,
      });
    }
    return results;
  };

  try {
    return await Promise.race([
      run(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Reddit search timed out')), TOTAL_BUDGET_MS)
      ),
    ]);
  } catch {
    return []; // best-effort source — never break the chat
  }
}
