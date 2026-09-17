/**
 * "Which distro fits me?" — questions and scoring.
 *
 * Each option awards points to specific distro ids (the ids match the
 * seeded `distros` collection). Options also carry a short `reason` —
 * any option that scored a distro contributes its reason to the result,
 * so the recommendation can explain itself.
 */

export const QUIZ_QUESTIONS = [
  {
    id: 'experience',
    question: 'How much Linux experience do you have?',
    options: [
      {
        label: 'I’m completely new',
        reason: 'Beginner-friendly with a gentle learning curve',
        scores: { ubuntu: 3, mint: 3, zorin: 3, popos: 2, manjaro: 1 },
      },
      {
        label: 'I’ve dabbled a bit',
        reason: 'Comfortable middle ground for casual users',
        scores: { fedora: 2, mint: 2, zorin: 1, manjaro: 2, popos: 2 },
      },
      {
        label: 'I use it as a daily driver',
        reason: 'Suits experienced daily-driver users',
        scores: { fedora: 3, arch: 2, opensuse: 2, manjaro: 2, debian: 1 },
      },
      {
        label: 'I’m a pro / sysadmin',
        reason: 'Built for people who like full control',
        scores: { arch: 3, gentoo: 3, debian: 2, nixos: 2, void: 2, alpine: 1 },
      },
    ],
  },
  {
    id: 'use',
    question: 'What will you mainly use it for?',
    options: [
      {
        label: 'Everyday desktop (browsing, media, docs)',
        reason: 'A polished everyday desktop',
        scores: { mint: 3, zorin: 3, ubuntu: 2, popos: 2 },
      },
      {
        label: 'Programming & development',
        reason: 'A favourite among developers',
        scores: { fedora: 3, popos: 3, ubuntu: 2, arch: 2, manjaro: 1 },
      },
      {
        label: 'Gaming',
        reason: 'Strong gaming support out of the box',
        scores: { popos: 3, manjaro: 2, fedora: 2, zorin: 1, arch: 1 },
      },
      {
        label: 'Servers, containers & cloud',
        reason: 'A server and container workhorse',
        scores: { alpine: 3, debian: 3, ubuntu: 2, nixos: 2, void: 1 },
      },
      {
        label: 'Security & penetration testing',
        reason: 'The industry standard for security work',
        scores: { kali: 25 },
      },
      {
        label: 'Reviving old or low-spec hardware',
        reason: 'Light enough to revive old machines',
        scores: { alpine: 3, void: 3, debian: 2, arch: 1 },
      },
    ],
  },
  {
    id: 'hardware',
    question: 'How beefy is your machine?',
    options: [
      {
        label: 'Modern — plenty of RAM and a fast SSD',
        reason: 'Makes the most of modern hardware',
        scores: { fedora: 2, popos: 2, zorin: 1, ubuntu: 1 },
      },
      {
        label: 'Mid-range — a few years old',
        reason: 'Runs comfortably on mid-range machines',
        scores: { ubuntu: 2, mint: 2, manjaro: 2, fedora: 1 },
      },
      {
        label: 'Old or low-spec (small RAM/disk)',
        reason: 'Extremely lightweight — ideal for old hardware',
        scores: { alpine: 3, void: 3, arch: 2, debian: 2, gentoo: 1 },
      },
    ],
  },
  {
    id: 'updates',
    question: 'How do you like your updates?',
    options: [
      {
        label: 'Rock solid — rarely change anything',
        reason: 'Legendary stability above all else',
        scores: { debian: 3, mint: 2, ubuntu: 2, opensuse: 2 },
      },
      {
        label: 'Fresh, but still well tested',
        reason: 'Fresh software on a predictable cadence',
        scores: { fedora: 3, popos: 2, zorin: 1, manjaro: 1 },
      },
      {
        label: 'The moment it ships, please',
        reason: 'Rolling release — always the latest packages',
        scores: { arch: 3, opensuse: 2, manjaro: 1, nixos: 1 },
      },
    ],
  },
  {
    id: 'desktop',
    question: 'What should the desktop feel like?',
    options: [
      {
        label: 'Familiar — like Windows or macOS',
        reason: 'Layouts that feel familiar from day one',
        scores: { zorin: 3, mint: 3, popos: 1 },
      },
      {
        label: 'A clean default is fine',
        reason: 'A clean, well-integrated default desktop',
        scores: { ubuntu: 2, fedora: 2, debian: 1 },
      },
      {
        label: 'I’ll build my own setup',
        reason: 'A blank canvas for custom setups',
        scores: { arch: 3, gentoo: 3, void: 2, nixos: 1 },
      },
    ],
  },
  {
    id: 'effort',
    question: 'How much effort do you want to put in?',
    options: [
      {
        label: 'It should just work',
        reason: 'Works out of the box with minimal setup',
        scores: { ubuntu: 3, mint: 3, zorin: 3, popos: 2 },
      },
      {
        label: 'Some tweaking is fine',
        reason: 'A little tweaking, a lot of reward',
        scores: { fedora: 2, manjaro: 2, opensuse: 2, debian: 1 },
      },
      {
        label: 'I enjoy building things from scratch',
        reason: 'Build your system exactly how you want it',
        scores: { gentoo: 4, arch: 2, void: 2, nixos: 2, alpine: 1 },
      },
    ],
  },
  {
    id: 'terminal',
    question: 'How comfortable are you with the terminal?',
    options: [
      {
        label: 'I avoid it — give me buttons for everything',
        reason: 'Rarely needs the terminal for daily use',
        scores: { mint: 3, zorin: 3, ubuntu: 2, popos: 2 },
      },
      {
        label: 'I can handle basic commands',
        reason: 'Friendly for users learning the terminal',
        scores: { fedora: 2, manjaro: 2, opensuse: 2, debian: 1, popos: 1 },
      },
      {
        label: 'I live in the terminal',
        reason: 'Made for terminal-first power users',
        scores: { arch: 3, gentoo: 3, void: 2, nixos: 2, alpine: 2 },
      },
    ],
  },
  {
    id: 'software',
    question: 'How do you feel about proprietary drivers and codecs?',
    options: [
      {
        label: 'Just include everything (drivers, codecs, Steam)',
        reason: 'Proprietary drivers and media codecs included',
        scores: { ubuntu: 3, mint: 3, popos: 3, zorin: 2, manjaro: 2 },
      },
      {
        label: 'Prefer open-source, pragmatic when needed',
        reason: 'Open-source first with pragmatic extras',
        scores: { fedora: 3, opensuse: 2, debian: 1, arch: 1 },
      },
      {
        label: 'Strictly free software only',
        reason: 'Uncompromising free-software philosophy',
        scores: { debian: 3, fedora: 1, arch: 1 },
      },
    ],
  },
  {
    id: 'support',
    question: 'What kind of help do you want when you get stuck?',
    options: [
      {
        label: 'Huge community + tutorials for everything',
        reason: 'Massive community and tutorial base',
        scores: { ubuntu: 3, arch: 3, mint: 2, manjaro: 1 },
      },
      {
        label: 'Professional / enterprise backing',
        reason: 'Backed by a professional organization',
        scores: { opensuse: 3, ubuntu: 2, fedora: 2 },
      },
      {
        label: 'I’ll figure it out myself (docs + DIY)',
        reason: 'Excellent docs for self-sufficient users',
        scores: { gentoo: 3, nixos: 2, void: 2, alpine: 2, arch: 1 },
      },
    ],
  },
  {
    id: 'priority',
    question: 'What matters most to you?',
    options: [
      {
        label: 'Speed & lightness above all',
        reason: 'Extremely fast and lightweight',
        scores: { alpine: 3, void: 3, arch: 2, debian: 1 },
      },
      {
        label: 'A beautiful, polished look',
        reason: 'Beautiful and polished out of the box',
        scores: { zorin: 3, popos: 2, mint: 2, fedora: 2 },
      },
      {
        label: 'Total control & reproducibility',
        reason: 'Total control over every part of the system',
        scores: { nixos: 3, gentoo: 3, arch: 2, void: 1 },
      },
      {
        label: 'Privacy & security hardening',
        reason: 'Hardened with security in mind',
        scores: { debian: 3, kali: 3, fedora: 2, opensuse: 1 },
      },
    ],
  },
];

/**
 * Score a completed quiz.
 * @param {Record<string, number>} answers — questionId -> chosen option index
 * @returns ranked [{ distroId, points, percent, reasons: string[] }] (best first)
 */
export function scoreQuiz(answers) {
  const tally = new Map(); // distroId -> { points, reasons:Set }

  for (const q of QUIZ_QUESTIONS) {
    const optIndex = answers[q.id];
    if (optIndex === undefined) continue;
    const option = q.options[optIndex];
    if (!option) continue;
    for (const [distroId, pts] of Object.entries(option.scores)) {
      const entry = tally.get(distroId) || { points: 0, reasons: new Set() };
      entry.points += pts;
      entry.reasons.add(option.reason);
      tally.set(distroId, entry);
    }
  }

  const ranked = [...tally.entries()]
    .map(([distroId, { points, reasons }]) => ({
      distroId,
      points,
      reasons: [...reasons],
    }))
    .sort((a, b) => b.points - a.points);

  const top = ranked[0]?.points || 1;
  return ranked.map((r) => ({ ...r, percent: Math.round((r.points / top) * 100) }));
}
