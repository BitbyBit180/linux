// QUIZ agent — turns "Find Your Distro" quiz answers into a single ranked
// verdict. The recommendation is FULLY AI: Jev (TypeSafe System One) makes
// ONE Choice judgment over the whole catalogue — winner — and code derives
// everything else from its probability distribution:
//
// - runners-up = 2nd/3rd most probable options (no second model call)
// - explanation/strengths/tip = composed in code from the catalogue facts
//   and the user's own answers (Jev returns typed judgments, not prose)
//
// There is no scoring table anywhere. Contract: the controller passes the
// user's readable Q&A and the distro catalogue. We return:
// { winner, runnersUp[2], probabilities, confidence, explanation, strengths, tip }.

import { systemOne } from './jevClient.js';

// Below this top-probability the pick is barely above uniform noise across
// the 14 options — let the controller report "unsure" instead of guessing.
export const MIN_TOP_PROBABILITY = 0.15;

// One concrete, factual first step per distro (shown as "First step: …").
const FIRST_STEP_TIPS = {
  ubuntu: 'Flash the Ubuntu ISO with Balena Etcher, boot it, and follow the guided installer.',
  mint: 'Boot the Mint ISO and tick “install multimedia codecs” during setup.',
  zorin: 'Boot the Zorin ISO and pick your desktop layout on first boot.',
  popos: 'Flash the Pop!_OS ISO (NVIDIA build for NVIDIA GPUs) and encrypt the disk at install.',
  manjaro: 'Boot the Manjaro ISO with non-free drivers selected for NVIDIA hardware.',
  fedora: 'Write the Fedora Workstation ISO with Fedora Media Writer, then enable RPM Fusion.',
  arch: 'Boot the Arch ISO, connect with iwctl on Wi-Fi, then run the archinstall script.',
  opensuse: 'Boot the openSUSE Tumbleweed ISO and keep snapper snapshots enabled during partitioning.',
  debian: 'Boot the Debian netinst ISO with non-free firmware included for Wi-Fi support.',
  gentoo: 'Boot the Gentoo minimal ISO, follow the handbook, and set aside a full afternoon.',
  nixos: 'Boot the NixOS graphical ISO and declare your system in /etc/nixos/configuration.nix.',
  void: 'Boot the Void ISO (glibc flavour for Steam and proprietary apps) and run void-installer.',
  alpine: 'Boot the Alpine ISO, log in as root, and run the setup-alpine script.',
  kali: 'Flash the Kali installer ISO and choose guided encrypted LVM partitioning.',
};

function answerFor(answers, questionId) {
  return answers.find((a) => a.questionId === questionId)?.answer || null;
}

// 2–3 grounded sentences: who the user is (their own words) + what the
// winner is (its catalogue tagline). No invented facts — everything comes
// from the quiz answers and the catalogue.
function buildExplanation({ winnerName, answers, winnerTagline }) {
  const experience = answerFor(answers, 'experience');
  const use = answerFor(answers, 'use');
  const effort = answerFor(answers, 'effort');
  const profile = [experience, use, effort].filter(Boolean).join(' · ');
  const head = profile
    ? `Based on your answers (${profile}), ${winnerName} is your best match.`
    : `${winnerName} is your best match.`;
  const tail = winnerTagline ? ` ${winnerTagline}` : '';
  return `${head}${tail}`.slice(0, 800);
}

export async function recommendDistro({ answers = [], catalogue = [] } = {}) {
  const byId = new Map(catalogue.map((d) => [String(d.id).toLowerCase(), d]));

  // The Choice options ARE the catalogue: id → one-line rubric for Jev.
  const criteria = {};
  for (const d of catalogue) {
    criteria[d.id] =
      `${d.name} — ${d.tagline || ''} | category: ${d.category || ''} | ` +
      `desktop: ${d.desktop || ''} | release: ${d.releaseModel || ''} | min RAM: ${d.minRam || ''}`;
  }

  const data = await systemOne({
    state: {
      answers: answers.map((a) => ({ question: a.question, answer: a.answer })),
    },
    questions: {
      best_distro: {
        type: 'choice',
        instructions: {
          question: 'Which catalogue distro is the single best match for the user described in `answers`?',
          rubric:
            'Weigh the whole person, not just keywords: a beginner who wants gaming and proprietary drivers should get Pop!_OS or Mint, never Arch — even if they said “latest updates”. A security professional gets Kali. A tinkerer who lives in the terminal gets Arch, Gentoo, NixOS or Void. Someone reviving old hardware gets Alpine or Void.',
        },
        criteria,
      },
    },
  });

  const verdict = data?.answers?.best_distro;
  if (!verdict || verdict.type !== 'choice' || !verdict.choice) {
    throw new Error('AI returned an unreadable recommendation. Please try again.');
  }

  const winner = String(verdict.choice).toLowerCase();
  const probabilities = verdict.probabilities || {};
  const topProb = Number(probabilities[verdict.choice] ?? probabilities[winner] ?? 0);

  // Rank every catalogue option by probability: winner first, then the next two.
  const ranked = Object.entries(probabilities)
    .map(([id, p]) => ({ id: String(id).toLowerCase(), p: Number(p) || 0 }))
    .filter((r) => byId.has(r.id))
    .sort((a, b) => b.p - a.p);
  if (!byId.has(winner)) {
    throw new Error('AI returned an unknown distro. Please try again.');
  }
  if (!ranked.some((r) => r.id === winner)) {
    ranked.unshift({ id: winner, p: topProb });
  }
  const runnersUp = ranked
    .filter((r) => r.id !== winner)
    .slice(0, 2)
    .map((r) => r.id);

  // Strengths are catalogue facts (taglines) — no hand-written scoring.
  const strengths = { [winner]: byId.get(winner).tagline || '' };
  for (const id of runnersUp) {
    strengths[id] = byId.get(id)?.tagline || '';
  }

  const winnerName = byId.get(winner).name;
  return {
    winner,
    runnersUp,
    probabilities,
    confidence: typeof verdict.confidence === 'number' ? verdict.confidence : null,
    topProbability: topProb,
    explanation: buildExplanation({
      winnerName,
      answers,
      winnerTagline: byId.get(winner).tagline || '',
    }),
    strengths,
    tip: FIRST_STEP_TIPS[winner] || null,
    model: data?.model || null,
  };
}
