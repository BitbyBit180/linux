import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  RotateCcw,
  GitCompareArrows,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useDistros } from '../hooks/useDistros.js';
import { QUIZ_QUESTIONS, scoreQuiz } from '../utils/distroQuiz.js';
import { getAiRecommendation } from '../services/quizApi.js';
import { THEME, LINE, LINE_SOFT, MONO } from '../theme/designTokens.js';

/**
 * "Find Your Distro" — a short wizard with AI-personalized results.
 * Rule-based scoring gives an instant top-3; Groq then re-ranks and
 * explains the pick. If the AI is unreachable, the classic match stands.
 */
export default function QuizPage({ onNavigate }) {
  const { distros } = useDistros();
  const distroMap = useMemo(
    () => Object.fromEntries(distros.map((d) => [d.id, d])),
    [distros]
  );

  const [step, setStep] = useState(0); // 0..questions.length (== results)
  const [answers, setAnswers] = useState({});

  const total = QUIZ_QUESTIONS.length;
  const done = step >= total;
  const ranked = useMemo(
    () => (done ? scoreQuiz(answers).slice(0, 3) : []),
    [done, answers]
  );

  // AI verdict: re-ranks + explains once the quiz is complete.
  // 'idle' | 'loading' | 'ready' | 'fallback' (fallback = classic match).
  const [aiState, setAiState] = useState({ status: 'idle', verdict: null });

  useEffect(() => {
    if (!done) return;
    let cancelled = false;
    setAiState({ status: 'loading', verdict: null });

    const readable = QUIZ_QUESTIONS.map((q) => ({
      question: q.question,
      answer: q.options[answers[q.id]]?.label || 'Skipped',
    }));
    const shortlist = scoreQuiz(answers)
      .slice(0, 5)
      .map((r) => ({ distroId: r.distroId, points: r.points, reasons: r.reasons }));

    getAiRecommendation({ answers: readable, shortlist })
      .then((json) => {
        if (cancelled) return;
        if (json?.ai && json?.winner) {
          setAiState({ status: 'ready', verdict: json });
        } else {
          setAiState({ status: 'fallback', verdict: null });
        }
      })
      .catch(() => {
        if (!cancelled) setAiState({ status: 'fallback', verdict: null });
      });

    return () => {
      cancelled = true;
    };
  }, [done]);

  // Display order: AI verdict when ready (guarded against unknown ids),
  // otherwise the instant rule-based ranking.
  const aiVerdict =
    aiState.status === 'ready' && aiState.verdict && distroMap[aiState.verdict.winner]
      ? aiState.verdict
      : null;
  const displayRanked = useMemo(() => {
    if (!done) return [];
    if (aiVerdict) {
      const order = [aiVerdict.winner, ...(aiVerdict.runnersUp || [])].filter(Boolean);
      const base = new Map(scoreQuiz(answers).map((r) => [r.distroId, r]));
      return order.map((id, i) => {
        const hit = base.get(id);
        if (hit) return hit;
        return { distroId: id, points: 0, percent: i === 0 ? 100 : Math.max(40, 85 - i * 10), reasons: [] };
      });
    }
    return ranked;
  }, [done, aiVerdict, answers, ranked]);
  const topDistro = displayRanked[0] ? distroMap[displayRanked[0].distroId] : null;

  const choose = (optIndex) => {
    setAnswers((prev) => ({ ...prev, [QUIZ_QUESTIONS[step].id]: optIndex }));
    // Small pause so the selection is visible before advancing
    setTimeout(() => setStep((s) => Math.min(s + 1, total)), 220);
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
    setAiState({ status: 'idle', verdict: null });
  };

  return (
    <div
      style={{
        backgroundColor: THEME.bg,
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
      }}
      className="flex flex-col text-[#F0F4F8]"
    >
      {/* Shared hero background texture */}
      <div className="hero-bg fixed inset-0 z-0" aria-hidden="true">
        <div className="grain-fine" />
        <div className="grain-fiber" />
      </div>

      <Navbar currentRoute="/quiz" onNavigate={onNavigate} />

      <main
        className="relative z-10 flex-1 mx-auto w-full flex flex-col"
        style={{ maxWidth: 760, padding: '110px 20px 64px' }}
      >
        {/* Header */}
        <div className="text-center" style={{ marginBottom: done ? 24 : 30 }}>
          <div
            className="flex items-center justify-center mx-auto"
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(224, 90, 56, 0.15)',
              border: '1px solid rgba(224, 90, 56, 0.4)',
              marginBottom: 14,
            }}
          >
            <Compass size={26} color={THEME.accent} />
          </div>
          <h1
            style={{
              fontFamily: MONO,
              fontSize: '1.5rem',
              fontWeight: 800,
              color: THEME.textMain,
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            Find Your Distro
          </h1>
          <p
            style={{
              fontFamily: MONO,
              fontSize: '0.78rem',
              color: THEME.textMuted,
              margin: '6px 0 0',
            }}
          >
            {done
              ? aiState.status === 'loading'
                ? 'AI is analyzing your answers for a personal pick…'
                : aiVerdict
                  ? 'AI-personalized recommendation, just for you.'
                  : 'Based on your answers, here are your best matches.'
              : `Answer ${total} quick questions and we'll match you with the right Linux distro.`}
          </p>
        </div>

        {done ? (
          /* ------------------------------ results ------------------------------ */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* AI explanation */}
            {aiVerdict?.explanation ? (
              <div
                style={{
                  borderRadius: 16,
                  padding: '16px 18px',
                  marginBottom: 16,
                  border: `1px solid ${THEME.accent}55`,
                  background: 'rgba(224, 90, 56, 0.07)',
                }}
              >
                <div
                  className="flex items-center"
                  style={{
                    gap: 7,
                    fontFamily: MONO,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: THEME.accent,
                    marginBottom: 8,
                  }}
                >
                  <Sparkles size={13} />
                  AI explains your match
                </div>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: '0.78rem',
                    color: THEME.textMain,
                    margin: 0,
                    lineHeight: 1.7,
                  }}
                >
                  {aiVerdict.explanation}
                </p>
                {aiVerdict.tip ? (
                  <p
                    style={{
                      fontFamily: MONO,
                      fontSize: '0.7rem',
                      color: THEME.textMuted,
                      margin: '10px 0 0',
                      lineHeight: 1.6,
                    }}
                  >
                    <span style={{ color: THEME.accent, fontWeight: 700 }}>First step: </span>
                    {aiVerdict.tip}
                  </p>
                ) : null}
              </div>
            ) : aiState.status === 'loading' ? (
              <div
                className="animate-pulse"
                style={{
                  borderRadius: 16,
                  padding: '16px 18px',
                  marginBottom: 16,
                  border: `1px solid ${LINE}`,
                  background: 'rgba(255,255,255,0.03)',
                  fontFamily: MONO,
                  fontSize: '0.72rem',
                  color: THEME.textMuted,
                }}
              >
                Consulting AI for a personalized explanation…
              </div>
            ) : null}

            {/* Winner */}
            {topDistro && (
              <div
                className="flex items-center"
                style={{
                  ...{
                    background: 'rgba(28, 34, 41, 0.55)',
                    backdropFilter: 'blur(28px) saturate(170%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(170%)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                  },
                  borderRadius: 20,
                  padding: 20,
                  gap: 16,
                  marginBottom: 16,
                  borderColor: `${THEME.accent}66`,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 9999,
                    background: `${topDistro.accent}22`,
                    border: `1px solid ${topDistro.accent}66`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  <Sparkles
                    size={16}
                    style={{
                      color: topDistro.accent,
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: THEME.bg,
                      borderRadius: 9999,
                      padding: 2,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: topDistro.accent,
                    }}
                  >
                    {displayRanked[0].percent}%
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: THEME.textMuted,
                    }}
                  >
                    Best match
                  </div>
                  <h2
                    style={{
                      fontFamily: MONO,
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: THEME.textMain,
                      margin: '2px 0 4px',
                    }}
                  >
                    {topDistro.name}
                  </h2>
                  <p
                    style={{
                      fontFamily: MONO,
                      fontSize: '0.72rem',
                      color: THEME.silver,
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {topDistro.tagline}
                  </p>
                  {/* Reasons */}
                  <div className="flex flex-wrap" style={{ gap: 6, marginTop: 8 }}>
                    {displayRanked[0].reasons.slice(0, 3).map((r) => (
                      <span
                        key={r}
                        style={{
                          fontFamily: MONO,
                          fontSize: '0.62rem',
                          color: THEME.textMuted,
                          background: 'rgba(255,255,255,0.05)',
                          border: `1px solid ${LINE}`,
                          borderRadius: 9999,
                          padding: '2px 9px',
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap" style={{ gap: 10, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => onNavigate?.(`/distro/${topDistro.id}`)}
                      className="inline-flex items-center transition-all"
                      style={{
                        gap: 6,
                        fontFamily: MONO,
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: '#fff',
                        background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderRadius: 9999,
                        padding: '8px 18px',
                        cursor: 'pointer',
                        boxShadow: `0 2px 16px ${THEME.accent}55`,
                      }}
                    >
                      View {topDistro.name} details →
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate?.('/flavours')}
                      className="inline-flex items-center transition-colors"
                      style={{
                        gap: 6,
                        fontFamily: MONO,
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: THEME.textMuted,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Browse all distros
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Runners-up */}
            {displayRanked.slice(1).map((r, i) => {
              const d = distroMap[r.distroId];
              if (!d) return null;
              return (
                <div
                  key={r.distroId}
                  className="flex items-center"
                  style={{
                    borderRadius: 14,
                    padding: '12px 16px',
                    gap: 14,
                    marginBottom: 10,
                    border: `1px solid ${LINE}`,
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: THEME.textMuted,
                      minWidth: 16,
                    }}
                  >
                    {i + 2}
                  </span>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 9999,
                      background: `${d.accent}22`,
                      border: `1px solid ${d.accent}55`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: MONO,
                      fontWeight: 800,
                      color: d.accent,
                      fontSize: '0.82rem',
                    }}
                  >
                    {r.percent}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: THEME.textMain,
                      }}
                    >
                      {d.name}
                    </div>
                    <div
                      className="flex flex-wrap"
                      style={{ gap: 5, marginTop: 3 }}
                    >
                      {r.reasons.slice(0, 2).map((reason) => (
                        <span
                          key={reason}
                          style={{
                            fontFamily: MONO,
                            fontSize: '0.6rem',
                            color: THEME.textMuted,
                          }}
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(`/distro/${d.id}`)}
                    className="transition-colors shrink-0"
                    style={{
                      fontFamily: MONO,
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      color: THEME.accent,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Details →
                  </button>
                </div>
              );
            })}

            {/* Actions */}
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: 10, marginTop: 22 }}
            >
              <button
                type="button"
                onClick={() =>
                  onNavigate?.(`/compare?ids=${displayRanked.map((r) => r.distroId).join(',')}`)
                }
                className="inline-flex items-center transition-all"
                style={{
                  gap: 7,
                  fontFamily: MONO,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#fff',
                  background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: 9999,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  boxShadow: `0 2px 16px ${THEME.accent}55`,
                }}
              >
                <GitCompareArrows size={15} />
                Compare top {displayRanked.length}
              </button>
              {topDistro && (
                <button
                  type="button"
                  onClick={() => onNavigate?.(`/community?channel=${topDistro.id}`)}
                  className="inline-flex items-center transition-colors"
                  style={{
                    gap: 7,
                    fontFamily: MONO,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: THEME.textMain,
                    background: 'rgba(255,255,255,0.06)',
                    border: `1px solid ${LINE_SOFT}`,
                    borderRadius: 9999,
                    padding: '10px 20px',
                    cursor: 'pointer',
                  }}
                >
                  <MessagesSquare size={15} />
                  Join d/{topDistro.id === 'general' ? 'General' : topDistro.id}
                </button>
              )}
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center transition-colors"
                style={{
                  gap: 7,
                  fontFamily: MONO,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: THEME.textMuted,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} />
                Retake quiz
              </button>
            </div>
            {aiState.status === 'fallback' ? (
              <p
                className="text-center"
                style={{
                  fontFamily: MONO,
                  fontSize: '0.66rem',
                  color: THEME.textMuted,
                  margin: '14px 0 0',
                }}
              >
                Showing the classic match — AI explanation unavailable right now.
              </p>
            ) : null}
          </motion.div>
        ) : (
          /* ------------------------------ wizard ------------------------------ */
          <>
            {/* Progress */}
            <div style={{ marginBottom: 18 }}>
              <div
                className="flex items-center justify-between"
                style={{
                  fontFamily: MONO,
                  fontSize: '0.66rem',
                  color: THEME.textMuted,
                  marginBottom: 6,
                }}
              >
                <span>
                  Question {step + 1} of {total}
                </span>
                <span>{Math.round((step / total) * 100)}%</span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 9999,
                  background: 'rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(step / total) * 100}%`,
                    background: `linear-gradient(90deg, ${THEME.accent}, #b83d25)`,
                    borderRadius: 9999,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>

            {/* Question */}
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22 }}
            >
              <h2
                style={{
                  fontFamily: MONO,
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: THEME.textMain,
                  margin: '0 0 14px',
                }}
              >
                {QUIZ_QUESTIONS[step].question}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {QUIZ_QUESTIONS[step].options.map((opt, i) => {
                  const chosen = answers[QUIZ_QUESTIONS[step].id] === i;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => choose(i)}
                      className="flex items-center transition-all"
                      style={{
                        gap: 12,
                        textAlign: 'left',
                        background: chosen
                          ? 'rgba(224, 90, 56, 0.12)'
                          : 'rgba(28, 34, 41, 0.55)',
                        border: `1px solid ${chosen ? `${THEME.accent}88` : LINE}`,
                        borderRadius: 12,
                        padding: '13px 16px',
                        cursor: 'pointer',
                        fontFamily: MONO,
                        fontSize: '0.8rem',
                        color: chosen ? THEME.textMain : 'rgba(240,244,248,0.8)',
                      }}
                      onMouseEnter={(e) => {
                        if (!chosen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        if (!chosen) e.currentTarget.style.borderColor = LINE;
                      }}
                    >
                      <span
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9999,
                          border: `2px solid ${chosen ? THEME.accent : 'rgba(255,255,255,0.25)'}`,
                          background: chosen ? THEME.accent : 'transparent',
                        }}
                      >
                        {chosen && <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff' }} />}
                      </span>
                      {opt.label}
                      <ArrowRight
                        size={13}
                        className="ml-auto shrink-0"
                        style={{ color: chosen ? THEME.accent : 'rgba(255,255,255,0.15)' }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Back */}
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="inline-flex items-center transition-colors"
                  style={{
                    gap: 6,
                    marginTop: 18,
                    fontFamily: MONO,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: THEME.textMuted,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <ArrowLeft size={13} />
                  Previous question
                </button>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
