import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import type { BrainData } from '../../types';

interface OnboardingQuestion {
  id: string;
  brainField: keyof BrainData;
  label: string;
  placeholder: string;
  hint: string;
  required: boolean;
  multiline?: boolean;
  icon: React.ReactNode;
}

const QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'q1',
    brainField: 'name',
    label: "What's your company or project name?",
    placeholder: '',
    hint: 'Anchors every deliverable, campaign, and strategy the agent team generates.',
    required: true,
    icon: <Icons.Brain size={18} style={{ color: '#a78bfa' }} />
  },
  {
    id: 'q2',
    brainField: 'oneLiner',
    label: 'What does your product do in one sentence?',
    placeholder: '',
    hint: 'Your core positioning anchor used across landing page copy and pitches.',
    required: true,
    multiline: true,
    icon: <Icons.Target size={18} style={{ color: '#38bdf8' }} />
  },
  {
    id: 'q3',
    brainField: 'audience',
    label: 'Who is your ideal customer profile (ICP)?',
    placeholder: '',
    hint: 'Ensures every campaign targets the right persona and buyer pain points.',
    required: true,
    multiline: true,
    icon: <Icons.Employees size={18} style={{ color: '#34d399' }} />
  },
  {
    id: 'q4',
    brainField: 'problem',
    label: 'What core pain point does your product solve?',
    placeholder: '',
    hint: 'The primary friction your product eliminates — drives high-converting angles.',
    required: true,
    multiline: true,
    icon: <Icons.Shield size={18} style={{ color: '#f59e0b' }} />
  },
  {
    id: 'q5',
    brainField: 'competitors',
    label: 'Who are your main competitors or alternatives?',
    placeholder: '',
    hint: 'Used for automated competitor teardowns, battlecards, and objection scripts.',
    required: true,
    icon: <Icons.Reports size={18} style={{ color: '#ef4444' }} />
  },
  {
    id: 'q6',
    brainField: 'website',
    label: "What's your website or landing URL?",
    placeholder: '',
    hint: 'Enables real-time domain inspection and authentic brand reference.',
    required: false,
    icon: <Icons.Sparkles size={18} style={{ color: '#818cf8' }} />
  },
  {
    id: 'q7',
    brainField: 'tone',
    label: 'How should your brand voice sound?',
    placeholder: '',
    hint: 'Sets the stylistic personality for copy generated across channels.',
    required: false,
    icon: <Icons.Sparkles size={18} style={{ color: '#c084fc' }} />
  },
  {
    id: 'q8',
    brainField: 'avoidTone',
    label: 'What phrases or tones should the AI avoid?',
    placeholder: '',
    hint: 'Strict negative constraints filtered from all copy generation.',
    required: false,
    icon: <Icons.Shield size={18} style={{ color: '#fb7185' }} />
  },
  {
    id: 'q9',
    brainField: 'pricing',
    label: 'What is your pricing or business model?',
    placeholder: '',
    hint: 'Helps specialists benchmark CAC/LTV and formulate monetization funnels.',
    required: false,
    icon: <Icons.Reports size={18} style={{ color: '#2dd4bf' }} />
  },
  {
    id: 'q10',
    brainField: 'goal',
    label: 'What is your primary 12-month growth milestone?',
    placeholder: '',
    hint: 'The north-star metric guiding autonomous marketing roadmaps.',
    required: false,
    multiline: true,
    icon: <Icons.Target size={18} style={{ color: '#fbbf24' }} />
  }
];

interface TourSlide {
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  bullets: string[];
  graphic: React.ReactNode;
}

const TOUR_SLIDES: TourSlide[] = [
  {
    badge: 'AUTONOMOUS MARKETING TEAM',
    badgeColor: '#38bdf8',
    title: '4 Coordinated AI Specialists',
    description: 'FoundryOS does not give you a generic chatbot. You get a coordinated executive marketing department working in synergy.',
    bullets: [
      'Maya Lin (Market Research) — Macro trend analysis & ICP TAM expansion',
      'Julian Vance (Competitor Intel) — Battlecards, pricing teardowns & weak spots',
      'Sarah Chen (Chief Marketing Strategist) — Core positioning & GTM strategy',
      'Marcus Brody (Funnel Architect) — High-converting landing copy & ad creative'
    ],
    graphic: (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
        <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#38bdf8' }}>Maya Lin</div>
          <div style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>Market Research Analyst</div>
        </div>
        <div style={{ padding: '10px', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f87171' }}>Julian Vance</div>
          <div style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>Competitor Intelligence</div>
        </div>
        <div style={{ padding: '10px', background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.25)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#a78bfa' }}>Sarah Chen</div>
          <div style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>Chief Marketing Strategist</div>
        </div>
        <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#34d399' }}>Marcus Brody</div>
          <div style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>Funnel & Growth Architect</div>
        </div>
      </div>
    )
  },
  {
    badge: 'VECTOR MEMORY RAG',
    badgeColor: '#a78bfa',
    title: 'Institutional Company Brain',
    description: 'The positioning answers you provided are pre-computed into vector embeddings. Every specialist recalls your context automatically.',
    bullets: [
      'Zero repetitive prompting — agents know your target audience and core problem',
      'PostgreSQL pgvector memory store with nomic-embed-text embeddings',
      'Persistent institutional memory accessible in Settings at any time',
      'Dynamic multi-document injection for contextual accuracy'
    ],
    graphic: (
      <div style={{ padding: '16px', background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.25)', borderRadius: '10px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#a78bfa' }}>Brain Knowledge Graph</span>
          <span style={{ fontSize: '0.7rem', color: '#34d399', fontFamily: 'monospace' }}>● Live Sync</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #a78bfa 0%, #38bdf8 100%)' }} />
        </div>
        <div style={{ fontSize: '0.7rem', color: '#a1a1aa', lineHeight: 1.4 }}>
          Embeddings calculated • Verified against ICP & competitors • Injected into prompts
        </div>
      </div>
    )
  },
  {
    badge: 'HUMAN-IN-THE-LOOP',
    badgeColor: '#fbbf24',
    title: 'Founder Strategic Steering',
    description: 'You maintain absolute executive authority. High-stakes strategic deliverables pause for founder verification before committing.',
    bullets: [
      'Steering gates: Select recommended strategic options or enter custom direction',
      'Approve, redirect, or reject autonomous plans with feedback',
      'Full audit trail and governance log preserved in Approvals',
      'No unintended campaign execution without your confirmation'
    ],
    graphic: (
      <div style={{ padding: '14px', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: '10px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <Icons.Shield size={14} style={{ color: '#fbbf24' }} />
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fbbf24' }}>Human-In-The-Loop Steering Gate</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#ffffff', fontWeight: 600, marginBottom: '6px' }}>Select GTM Strategy:</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.66rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>PLG Self-Serve ✓</span>
          <span style={{ fontSize: '0.66rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#a1a1aa' }}>Enterprise ABM</span>
        </div>
      </div>
    )
  },
  {
    badge: 'CONNECTED ECOSYSTEM',
    badgeColor: '#34d399',
    title: 'Zero-Secret MCP Tooling & Archive',
    description: 'Connect your workspace to Slack, Google Drive, live DuckDuckGo web search, and instant PDF report generation.',
    bullets: [
      'Model Context Protocol (MCP) servers run directly alongside agents',
      'Real-time competitor search and live URL reading via WebSearch plugin',
      'One-click PDF deliverable export formatted for stakeholders',
      'Zero credential leaks — private tokens stored in local isolated vault'
    ],
    graphic: (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
        <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ffffff' }}>Slack MCP</div>
          <div style={{ fontSize: '0.64rem', color: '#34d399' }}>Live Alerts</div>
        </div>
        <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ffffff' }}>Google Drive</div>
          <div style={{ fontSize: '0.64rem', color: '#38bdf8' }}>Cloud Sync</div>
        </div>
        <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ffffff' }}>PDF Vault</div>
          <div style={{ fontSize: '0.64rem', color: '#a78bfa' }}>Deliverables</div>
        </div>
      </div>
    )
  },
  {
    badge: 'EXECUTION READY',
    badgeColor: '#818cf8',
    title: 'Intelligent Quotas & Fast-Path',
    description: 'Balanced hybrid intelligence: 100% daily compute capacity with lightweight fast-path optimization for instant responses.',
    bullets: [
      'Fast-path routing skips heavy LLM steps for quick answers and assistance',
      'Transparent token metrics and cache hit ratio on every turn',
      'Full account, billing, model quota, and brain management in Settings',
      'Allowance resets automatically daily at midnight UTC'
    ],
    graphic: (
      <div style={{ padding: '16px', background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.25)', borderRadius: '10px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#818cf8' }}>Daily Execution Quota</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>100% Capacity</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>
          Full Allocation • Local Ollama + Cloud Hybrid • Ready for Launch
        </div>
      </div>
    )
  }
];

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    setBrainData,
    saveBrainData,
    setActiveView,
    brainData
  } = useApp();

  const [phase, setPhase] = useState<'questions' | 'tour'>('questions');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [shakeField, setShakeField] = useState(false);
  const [tourSlideIndex, setTourSlideIndex] = useState(0);
  const [isSavingBrain, setIsSavingBrain] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOnboardingOpen && brainData) {
      const initial: Record<string, string> = {};
      QUESTIONS.forEach(question => {
        const val = brainData[question.brainField];
        if (val) initial[question.id] = String(val);
      });
      setAnswers(prev => ({ ...initial, ...prev }));
    }
  }, [isOnboardingOpen, brainData]);

  useEffect(() => {
    if (phase === 'questions' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentQ, phase]);

  const currentQuestion = QUESTIONS[currentQ];
  const isMandatoryPhase = currentQ < 5;
  const isAtQuestionFive = currentQ === 4;
  const isOptionalPhase = currentQ >= 5;

  const saveBrainAndProceed = async (targetPhase: 'tour' | 'optional') => {
    setIsSavingBrain(true);
    const newBrain: BrainData = { ...brainData };
    QUESTIONS.forEach(question => {
      const val = answers[question.id]?.trim();
      if (val) {
        (newBrain as unknown as Record<string, unknown>)[question.brainField] = val;
      }
    });

    setBrainData(newBrain);
    try {
      await saveBrainData(newBrain);
    } catch {
      // save fallback
    }
    setIsSavingBrain(false);

    if (targetPhase === 'tour') {
      setPhase('tour');
      setTourSlideIndex(0);
    } else {
      setCurrentQ(5);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion.required && !answers[currentQuestion.id]?.trim()) {
      setShakeField(true);
      setTimeout(() => setShakeField(false), 500);
      return;
    }

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      saveBrainAndProceed('tour');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  };

  const finishTourAndEnter = () => {
    try {
      localStorage.setItem('foundryos_onboarded_v1', 'true');
    } catch {
      // storage fallback
    }
    setIsOnboardingOpen(false);
    setActiveView('chat');
  };

  const handleNextSlide = () => {
    if (tourSlideIndex < TOUR_SLIDES.length - 1) {
      setTourSlideIndex(prev => prev + 1);
    } else {
      finishTourAndEnter();
    }
  };

  const handlePrevSlide = () => {
    if (tourSlideIndex > 0) setTourSlideIndex(prev => prev - 1);
  };

  const handleSkipAll = () => {
    try {
      localStorage.setItem('foundryos_onboarded_v1', 'true');
    } catch {
      // storage fallback
    }
    setIsOnboardingOpen(false);
  };

  useEffect(() => {
    if (!isOnboardingOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkipAll();
        return;
      }
      if (phase === 'questions') {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleNextQuestion();
        }
      }
      if (phase === 'tour') {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          e.preventDefault();
          handleNextSlide();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevSlide();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOnboardingOpen, phase, currentQ, tourSlideIndex, answers]);

  if (!isOnboardingOpen) return null;

  if (phase === 'questions') {
    const answeredCount = QUESTIONS.slice(0, 5).filter(q => answers[q.id]?.trim()).length;
    const progressPercent = ((currentQ + 1) / QUESTIONS.length) * 100;

    return (
      <div style={styles.backdrop}>
        <div style={styles.dialog} onClick={e => e.stopPropagation()}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
          </div>

          <div style={styles.topRow}>
            <div style={styles.topLeft}>
              <div style={styles.logoBadge}>F</div>
              <div>
                <span style={styles.logoTitle}>FoundryOS Strategic Setup</span>
                <span style={styles.stepIndicator}>
                  {isMandatoryPhase ? 'Core Positioning (5 Required Questions)' : 'Extended Context (Optional 5 Questions)'}
                </span>
              </div>
            </div>

            <div style={styles.topRight}>
              <span style={styles.countBadge}>
                {currentQ + 1} / {QUESTIONS.length}
              </span>
              <button
                type="button"
                onClick={handleSkipAll}
                style={styles.skipBtn}
                title="Skip setup and open workspace"
              >
                Skip ✕
              </button>
            </div>
          </div>

          <div style={styles.phaseAlert}>
            {isMandatoryPhase ? (
              <div style={styles.alertMandatory}>
                <Icons.Target size={14} style={{ color: '#38bdf8' }} />
                <span>Question {currentQ + 1} of 5 required • {answeredCount}/5 core questions answered</span>
              </div>
            ) : (
              <div style={styles.alertOptional}>
                <Icons.Sparkles size={14} style={{ color: '#a78bfa' }} />
                <span>Optional Question {currentQ - 4} of 5 • You can save to Brain anytime below</span>
              </div>
            )}
          </div>

          <div key={currentQuestion.id} style={styles.questionCard}>
            <div style={styles.questionHeader}>
              <div style={styles.questionIconWrap}>{currentQuestion.icon}</div>
              <div>
                <h2 style={styles.questionLabel}>{currentQuestion.label}</h2>
                <p style={styles.questionHint}>{currentQuestion.hint}</p>
              </div>
            </div>

            <div style={styles.inputWrap}>
              {currentQuestion.multiline ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={answers[currentQuestion.id] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                  placeholder={currentQuestion.placeholder}
                  rows={3}
                  style={{
                    ...styles.textarea,
                    ...(shakeField ? styles.inputShake : {})
                  }}
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                  placeholder={currentQuestion.placeholder}
                  style={{
                    ...styles.input,
                    ...(shakeField ? styles.inputShake : {})
                  }}
                />
              )}
            </div>
          </div>

          <div style={styles.footerRow}>
            <div style={styles.footerLeft}>
              {currentQ > 0 && (
                <button type="button" onClick={handlePrevQuestion} style={styles.backBtn}>
                  ← Back
                </button>
              )}

              {isOptionalPhase && (
                <button
                  type="button"
                  onClick={() => saveBrainAndProceed('tour')}
                  disabled={isSavingBrain}
                  style={styles.saveBrainDirectBtn}
                >
                  <Icons.Check size={14} style={{ color: '#34d399' }} />
                  <span>{isSavingBrain ? 'Saving Brain...' : 'Save Brain & Start Tour →'}</span>
                </button>
              )}
            </div>

            <div style={styles.footerRight}>
              {isAtQuestionFive ? (
                <div style={styles.q5ActionGroup}>
                  <button
                    type="button"
                    onClick={() => saveBrainAndProceed('tour')}
                    disabled={isSavingBrain || (currentQuestion.required && !answers[currentQuestion.id]?.trim())}
                    style={styles.saveBrainPrimaryBtn}
                  >
                    <Icons.Check size={14} />
                    <span>{isSavingBrain ? 'Saving Brain...' : 'Save Brain & Launch Tour →'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentQuestion.required && !answers[currentQuestion.id]?.trim()) {
                        setShakeField(true);
                        setTimeout(() => setShakeField(false), 500);
                        return;
                      }
                      setCurrentQ(5);
                    }}
                    style={styles.optionalNextBtn}
                  >
                    Answer 5 Optional Details →
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  style={styles.nextBtn}
                >
                  <span>{currentQ === QUESTIONS.length - 1 ? 'Save & Start Tour' : 'Next Question →'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const slide = TOUR_SLIDES[tourSlideIndex];

  return (
    <div style={styles.backdrop}>
      <div style={styles.tourDialog} onClick={e => e.stopPropagation()}>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${((tourSlideIndex + 1) / TOUR_SLIDES.length) * 100}%`
            }}
          />
        </div>

        <div style={styles.tourHeader}>
          <div style={styles.tourHeaderBadgeWrap}>
            <span style={{ ...styles.tourBadge, color: slide.badgeColor, borderColor: `${slide.badgeColor}40`, background: `${slide.badgeColor}15` }}>
              {slide.badge}
            </span>
            <span style={styles.tourSlideCount}>Slide {tourSlideIndex + 1} of {TOUR_SLIDES.length}</span>
          </div>
          <button
            type="button"
            onClick={finishTourAndEnter}
            style={styles.tourCloseBtn}
            title="Close tour and enter workspace"
          >
            Skip Tour ✕
          </button>
        </div>

        <div style={styles.tourBody}>
          <div style={styles.tourInfoSide}>
            <h2 style={styles.tourSlideTitle}>{slide.title}</h2>
            <p style={styles.tourSlideDesc}>{slide.description}</p>
            <div style={styles.bulletList}>
              {slide.bullets.map((b, i) => (
                <div key={i} style={styles.bulletItem}>
                  <Icons.Check size={14} style={{ color: slide.badgeColor, flexShrink: 0, marginTop: '2px' }} />
                  <span style={styles.bulletText}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.tourGraphicSide}>
            {slide.graphic}
          </div>
        </div>

        <div style={styles.tourFooter}>
          <div style={styles.slideDots}>
            {TOUR_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTourSlideIndex(i)}
                style={{
                  ...styles.slideDot,
                  width: i === tourSlideIndex ? '20px' : '6px',
                  background: i === tourSlideIndex ? '#ffffff' : 'rgba(255,255,255,0.2)'
                }}
              />
            ))}
          </div>

          <div style={styles.tourNavBtns}>
            {tourSlideIndex > 0 && (
              <button type="button" onClick={handlePrevSlide} style={styles.backBtn}>
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNextSlide}
              style={styles.tourPrimaryBtn}
            >
              <span>{tourSlideIndex === TOUR_SLIDES.length - 1 ? '🚀 Launch FoundryOS Workspace' : 'Next Slide →'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.88)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 99999,
    animation: 'fadeSlideUp 0.25s ease-out'
  },
  dialog: {
    width: '100%',
    maxWidth: '680px',
    background: 'rgba(18, 18, 24, 0.96)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  tourDialog: {
    width: '100%',
    maxWidth: '740px',
    background: 'rgba(18, 18, 24, 0.96)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'rgba(255, 255, 255, 0.06)'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)',
    transition: 'width 0.3s ease'
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
    color: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontFamily: 'var(--font-display)',
    fontSize: '1rem'
  },
  logoTitle: {
    fontSize: '0.88rem',
    fontWeight: 700,
    color: '#ffffff',
    display: 'block'
  },
  stepIndicator: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)'
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  countBadge: {
    fontSize: '0.76rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
    padding: '3px 8px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)'
  },
  skipBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '0.76rem',
    cursor: 'pointer',
    padding: '4px 8px'
  },
  phaseAlert: {
    marginBottom: '18px'
  },
  alertMandatory: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(56, 189, 248, 0.08)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    borderRadius: '8px',
    fontSize: '0.78rem',
    color: '#38bdf8',
    fontWeight: 500
  },
  alertOptional: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'rgba(167, 139, 250, 0.08)',
    border: '1px solid rgba(167, 139, 250, 0.25)',
    borderRadius: '8px',
    fontSize: '0.78rem',
    color: '#a78bfa',
    fontWeight: 500
  },
  questionCard: {
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  questionHeader: {
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  questionIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  questionLabel: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 4px 0',
    fontFamily: 'var(--font-display)'
  },
  questionHint: {
    fontSize: '0.8rem',
    color: 'var(--text-tertiary)',
    margin: 0,
    lineHeight: 1.45
  },
  inputWrap: {
    width: '100%'
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.92rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '0.92rem',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  inputShake: {
    animation: 'shake 0.4s ease-in-out',
    borderColor: '#ef4444'
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  backBtn: {
    padding: '8px 14px',
    background: 'transparent',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  nextBtn: {
    padding: '9px 18px',
    background: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: '6px',
    color: 'var(--bg-primary)',
    fontSize: '0.84rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  q5ActionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  saveBrainPrimaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 18px',
    background: '#10b981',
    border: '1px solid #10b981',
    borderRadius: '6px',
    color: '#000000',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  optionalNextBtn: {
    padding: '9px 14px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  saveBrainDirectBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '6px',
    color: '#34d399',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  tourHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  tourHeaderBadgeWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  tourBadge: {
    fontSize: '0.66rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '4px',
    border: '1px solid'
  },
  tourSlideCount: {
    fontSize: '0.76rem',
    color: 'var(--text-tertiary)'
  },
  tourCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: '0.76rem',
    cursor: 'pointer'
  },
  tourBody: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px',
    alignItems: 'center',
    minHeight: '260px',
    marginBottom: '24px'
  },
  tourInfoSide: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  tourSlideTitle: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: '#ffffff',
    margin: 0,
    fontFamily: 'var(--font-display)',
    letterSpacing: '-0.02em'
  },
  tourSlideDesc: {
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    margin: 0
  },
  bulletList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '6px'
  },
  bulletItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px'
  },
  bulletText: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.45
  },
  tourGraphicSide: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    minHeight: '180px'
  },
  tourFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    flexWrap: 'wrap',
    gap: '12px'
  },
  slideDots: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  slideDot: {
    height: '6px',
    borderRadius: '3px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.25s ease'
  },
  tourNavBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  tourPrimaryBtn: {
    padding: '9px 18px',
    background: 'var(--accent-primary)',
    border: '1px solid var(--accent-primary)',
    borderRadius: '6px',
    color: 'var(--bg-primary)',
    fontSize: '0.84rem',
    fontWeight: 700,
    cursor: 'pointer'
  }
};
