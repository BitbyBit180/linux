/**
 * "Which distro fits me?" — questions only.
 *
 * The recommendation itself is fully AI: the answers go to the backend,
 * where Jev (TypeSafe System One) picks the winner from the whole distro
 * catalogue. No points, no scoring table anywhere in the codebase —
 * do NOT add one here (or server-side).
 */

export const QUIZ_QUESTIONS = [
  {
    id: 'experience',
    question: 'How much Linux experience do you have?',
    options: [
      { label: 'I’m completely new' },
      { label: 'I’ve dabbled a bit' },
      { label: 'I use it as a daily driver' },
      { label: 'I’m a pro / sysadmin' },
    ],
  },
  {
    id: 'use',
    question: 'What will you mainly use it for?',
    options: [
      { label: 'Everyday desktop (browsing, media, docs)' },
      { label: 'Programming & development' },
      { label: 'Gaming' },
      { label: 'Servers, containers & cloud' },
      { label: 'Security & penetration testing' },
      { label: 'Reviving old or low-spec hardware' },
    ],
  },
  {
    id: 'hardware',
    question: 'How beefy is your machine?',
    options: [
      { label: 'Modern — plenty of RAM and a fast SSD' },
      { label: 'Mid-range — a few years old' },
      { label: 'Old or low-spec (small RAM/disk)' },
    ],
  },
  {
    id: 'updates',
    question: 'How do you like your updates?',
    options: [
      { label: 'Rock solid — rarely change anything' },
      { label: 'Fresh, but still well tested' },
      { label: 'The moment it ships, please' },
    ],
  },
  {
    id: 'desktop',
    question: 'What should the desktop feel like?',
    options: [
      { label: 'Familiar — like Windows or macOS' },
      { label: 'A clean default is fine' },
      { label: 'I’ll build my own setup' },
    ],
  },
  {
    id: 'effort',
    question: 'How much effort do you want to put in?',
    options: [
      { label: 'It should just work' },
      { label: 'Some tweaking is fine' },
      { label: 'I enjoy building things from scratch' },
    ],
  },
  {
    id: 'terminal',
    question: 'How comfortable are you with the terminal?',
    options: [
      { label: 'I avoid it — give me buttons for everything' },
      { label: 'I can handle basic commands' },
      { label: 'I live in the terminal' },
    ],
  },
  {
    id: 'software',
    question: 'How do you feel about proprietary drivers and codecs?',
    options: [
      { label: 'Just include everything (drivers, codecs, Steam)' },
      { label: 'Prefer open-source, pragmatic when needed' },
      { label: 'Strictly free software only' },
    ],
  },
  {
    id: 'support',
    question: 'What kind of help do you want when you get stuck?',
    options: [
      { label: 'Huge community + tutorials for everything' },
      { label: 'Professional / enterprise backing' },
      { label: 'I’ll figure it out myself (docs + DIY)' },
    ],
  },
  {
    id: 'priority',
    question: 'What matters most to you?',
    options: [
      { label: 'Speed & lightness above all' },
      { label: 'A beautiful, polished look' },
      { label: 'Total control & reproducibility' },
      { label: 'Privacy & security hardening' },
    ],
  },
];
