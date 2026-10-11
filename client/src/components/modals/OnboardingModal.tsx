import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import type { BrainData } from '../../types';

/* ──────────────────────────────────────────────────────────────
   QUESTION DEFINITIONS – 10 total, first 5 are mandatory.
   Each question maps to a BrainData field so the Company Brain
   gets pre-populated the moment the founder finishes onboarding.
   ────────────────────────────────────────────────────────────── */

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
    label: "What's your company name?",
    placeholder: 'e.g. Acme AI',
    hint: 'This anchors every piece of content the AI generates for you.',
    required: true,
    icon: <Icons.Brain size={16} style={{ color: '#a78bfa' }} />
  },
  {
    id: 'q2',
    brainField: 'oneLiner',
    label: 'Describe what you do in one sentence.',
    placeholder: 'e.g. We help SaaS founders automate their marketing with AI agents.',
    hint: 'Your elevator pitch – the AI uses this as the core positioning anchor.',
    required: true,
    multiline: true,
    icon: <Icons.Target size={16} style={{ color: '#38bdf8' }} />
  },
  {
    id: 'q3',
    brainField: 'audience',
    label: 'Who is your ideal customer?',
    placeholder: 'e.g. Early-stage B2B SaaS founders with $0–$1M ARR',
    hint: 'Defines your ICP so every campaign targets the right buyer persona.',
    required: true,
    multiline: true,
    icon: <Icons.Employees size={16} style={{ color: '#34d399' }} />
  },
  {
    id: 'q4',
    brainField: 'problem',
    label: "What core problem do you solve?",
    placeholder: "e.g. Founders waste 60% of their time on repetitive growth experiments.",
    hint: 'The pain point your product eliminates – this drives all messaging.',
    required: true,
    multiline: true,
    icon: <Icons.Shield size={16} style={{ color: '#f59e0b' }} />
  },
  {
    id: 'q5',
    brainField: 'competitors',
    label: 'Who are your main competitors?',
    placeholder: 'e.g. HubSpot, Jasper, traditional agencies',
    hint: 'Used for competitive battlecards and differentiation strategies.',
    required: true,
    icon: <Icons.Reports size={16} style={{ color: '#ef4444' }} />
  },
  {
    id: 'q6',
    brainField: 'website',
    label: "What's your website URL?",
    placeholder: 'e.g. https://acme.ai',
    hint: 'Helps the AI reference your real brand when generating content.',
    required: false,
    icon: <Icons.Sparkles size={16} style={{ color: '#818cf8' }} />
  },
  {
    id: 'q7',
    brainField: 'tone',
    label: 'Describe your brand voice.',
    placeholder: 'e.g. Confident, witty, data-backed, human',
    hint: 'Ensures every piece of copy sounds authentically you.',
    required: false,
    icon: <Icons.Sparkles size={16} style={{ color: '#c084fc' }} />
  },
  {
    id: 'q8',
    brainField: 'avoidTone',
    label: 'Any words or tones to avoid?',
    placeholder: "e.g. Corporate fluff, buzzwords, aggressive sales jargon",
    hint: 'Blacklisted patterns the AI will never use in your content.',
    required: false,
    icon: <Icons.Shield size={16} style={{ color: '#fb7185' }} />
  },
  {
    id: 'q9',
    brainField: 'pricing',
    label: 'What does your pricing look like?',
    placeholder: 'e.g. $49/mo Starter, $149/mo Growth, Custom Enterprise',
    hint: 'Used for competitive analysis and objection-handling strategies.',
    required: false,
    icon: <Icons.Reports size={16} style={{ color: '#2dd4bf' }} />
  },
  {
    id: 'q10',
    brainField: 'goal',
    label: 'What is your primary growth goal?',
    placeholder: 'e.g. Reach $1M ARR in 12 months through organic inbound',
    hint: 'The north-star metric that guides all strategic recommendations.',
    required: false,
    multiline: true,
    icon: <Icons.Target size={16} style={{ color: '#fbbf24' }} />
  }
];

/* ──────────────────────────────────────────────────────────────
   TOUR STEPS – game-style spotlight walkthrough.
   Each step targets a DOM element by CSS selector and shows
   an explanatory tooltip while blurring everything else.
   ────────────────────────────────────────────────────────────── */

interface TourStep {
  selector: string;
  title: string;
  body: string;
  position: 'right' | 'bottom' | 'left' | 'top';
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="sidebar"]',
    title: 'Navigation Hub',
    body: 'Your command center. Switch between AI chat, Company Brain, approvals, integrations, and more. Every section is one click away.',
    position: 'right'
  },
  {
    selector: '[data-tour="header"]',
    title: 'Mission Control Bar',
    body: 'See your active agent, credit balance, and quick actions. Toggle dark/light mode and re-launch this tour anytime.',
    position: 'bottom'
  },
  {
    selector: '[data-tour="chat-area"]',
    title: 'AI Workspace',
    body: 'This is where the magic happens. Chat with specialized AI executives who understand your startup context. Attach files, review artifacts, and approve high-stakes actions.',
    position: 'left'
  },
  {
    selector: '[data-tour="brain-btn"]',
    title: 'Company Brain',
    body: "Your startup's institutional memory. The answers you just provided live here. Edit anytime – every AI response draws from this context automatically.",
    position: 'right'
  },
  {
    selector: '[data-tour="employees-btn"]',
    title: 'AI Employees',
    body: 'Meet your autonomous marketing department: Market Research, Competitive Intel, Brand Strategy, and Funnel Architecture specialists working in synergy.',
    position: 'right'
  }
];

/* ──────────────────────────────────────────────────────────────
   ONBOARDING MODAL COMPONENT
   ────────────────────────────────────────────────────────────── */

type Phase = 'questions' | 'tour';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    setBrainData,
    saveBrainData,
    setActiveView,
    brainData
  } = useApp();

  const [phase, setPhase] = useState<Phase>('questions');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [shakeField, setShakeField] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const mandatoryCount = QUESTIONS.filter(q => q.required).length;
  const answeredMandatory = QUESTIONS.filter(q => q.required && answers[q.id]?.trim()).length;

  /* ── Pre-fill existing brainData when opening ── */
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

  /* ── Focus input when question changes ── */
  useEffect(() => {
    if (phase === 'questions' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [currentQ, phase]);

  /* ── Keyboard navigation ── */
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
          handleNextTourStep();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevTourStep();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOnboardingOpen, phase, currentQ, tourStep, answers]);

  /* ── Tour spotlight positioning ── */
  const positionSpotlight = useCallback(() => {
    const step = TOUR_STEPS[tourStep];
    if (!step) return;

    const el = document.querySelector(step.selector);
    if (!el) {
      setSpotlightRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setSpotlightRect(rect);

    const pad = 16;
    const tooltipW = 340;
    const tooltipH = 180;
    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'right':
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + pad;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - pad;
        break;
      case 'bottom':
        top = rect.bottom + pad;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case 'top':
        top = rect.top - tooltipH - pad;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
    }

    top = Math.max(16, Math.min(top, window.innerHeight - tooltipH - 16));
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));

    setTooltipStyle({ top, left, width: tooltipW });
  }, [tourStep]);

  useEffect(() => {
    if (phase !== 'tour') return;
    positionSpotlight();
    const onResize = () => positionSpotlight();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [phase, tourStep, positionSpotlight]);

  if (!isOnboardingOpen) return null;

  /* ── Handlers ── */
  const q = QUESTIONS[currentQ];

  const handleAnswerChange = (val: string) => {
    setAnswers(prev => ({ ...prev, [q.id]: val }));
  };

  const handleNextQuestion = () => {
    if (q.required && !answers[q.id]?.trim()) {
      setShakeField(true);
      setTimeout(() => setShakeField(false), 500);
      return;
    }
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      finishQuestions();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1);
  };

  const finishQuestions = async () => {
    const newBrain: BrainData = { ...brainData };
    QUESTIONS.forEach(question => {
      const val = answers[question.id]?.trim();
      if (val) {
        (newBrain as any)[question.brainField] = val;
      }
    });
    setBrainData(newBrain);
    try {
      await saveBrainData(newBrain);
    } catch {}
    setPhase('tour');
    setTourStep(0);
  };

  const handleNextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevTourStep = () => {
    if (tourStep > 0) setTourStep(prev => prev - 1);
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('foundryos_onboarded_v1', 'true');
    } catch {}
    setIsOnboardingOpen(false);
    setActiveView('chat');
  };

  const handleSkipAll = () => {
    try {
      localStorage.setItem('foundryos_onboarded_v1', 'true');
    } catch {}
    setIsOnboardingOpen(false);
  };

  /* ── Progress computation ── */
  const questionProgress = ((currentQ + 1) / QUESTIONS.length) * 100;
  const isLastQ = currentQ === QUESTIONS.length - 1;

  /* ────────────────────────────────────────────────────────────
     PHASE 1: QUESTIONNAIRE
     ──────────────────────────────────────────────────────────── */
  if (phase === 'questions') {
    return (
      <div style={s.backdrop}>
        <div style={s.dialog} onClick={e => e.stopPropagation()}>
          {/* Shimmer progress bar */}
          <div style={s.progressTrack}>
            <div
              style={{
                ...s.progressFill,
                width: `${questionProgress}%`
              }}
            />
          </div>

          {/* Top bar */}
          <div style={s.topBar}>
            <div style={s.topLeft}>
              <span style={s.logoMark}>F</span>
              <span style={s.logoText}>FoundryOS Setup</span>
            </div>
            <div style={s.topRight}>
              <button
                type="button"
                onClick={() => {
                  setPhase('tour');
                  setTourStep(0);
                }}
                style={s.tourLinkBtn}
                title="Skip questions and take the feature tour"
              >
                Tour Walkthrough →
              </button>
              <span style={s.stepLabel}>
                <span style={s.stepCurrent}>{currentQ + 1}</span>
                <span style={s.stepDiv}>/</span>
                <span style={s.stepTotal}>{QUESTIONS.length}</span>
              </span>
              <button type="button" onClick={handleSkipAll} style={s.skipBtn}>
                Skip
              </button>
            </div>
          </div>

          {/* Mandatory badge */}
          <div style={s.mandatoryBar}>
            <div style={s.mandatoryPill}>
              <div
                style={{
                  ...s.mandatoryFillInner,
                  width: `${(answeredMandatory / mandatoryCount) * 100}%`
                }}
              />
              <span style={s.mandatoryText}>
                {answeredMandatory}/{mandatoryCount} required fields
              </span>
            </div>
            {q.required && (
              <span style={s.requiredTag}>Required</span>
            )}
            {!q.required && (
              <span style={s.optionalTag}>Optional</span>
            )}
          </div>

          {/* Question card */}
          <div
            key={q.id}
            style={{
              ...s.questionCard,
              animation: 'questionFadeIn 0.35s ease-out'
            }}
          >
            <div style={s.questionIconRow}>
              {q.icon}
              <span style={s.questionNumber}>Q{currentQ + 1}</span>
            </div>

            <h2 style={s.questionLabel}>{q.label}</h2>
            <p style={s.questionHint}>{q.hint}</p>

            {q.multiline ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={answers[q.id] || ''}
                onChange={e => handleAnswerChange(e.target.value)}
                placeholder={q.placeholder}
                rows={3}
                style={{
                  ...s.input,
                  ...s.textarea,
                  ...(shakeField ? s.inputShake : {})
                }}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={answers[q.id] || ''}
                onChange={e => handleAnswerChange(e.target.value)}
                placeholder={q.placeholder}
                style={{
                  ...s.input,
                  ...(shakeField ? s.inputShake : {})
                }}
              />
            )}
          </div>

          {/* Footer */}
          <div style={s.footer}>
            <div style={s.dotsRow}>
              {QUESTIONS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (q.required && !answers[q.id]?.trim() && idx > currentQ) return;
                    setCurrentQ(idx);
                  }}
                  style={{
                    ...s.dot,
                    backgroundColor: idx < currentQ ? '#ffffff'
                      : idx === currentQ ? '#ffffff'
                      : answers[QUESTIONS[idx].id]?.trim() ? 'rgba(255,255,255,0.5)'
                      : 'rgba(255,255,255,0.12)',
                    width: idx === currentQ ? '20px' : '6px'
                  }}
                />
              ))}
            </div>

            <div style={s.navBtns}>
              {currentQ > 0 && (
                <button type="button" onClick={handlePrevQuestion} style={s.prevBtn}>
                  ← Back
                </button>
              )}
              <button type="button" onClick={handleNextQuestion} style={s.nextBtn}>
                {isLastQ ? '✨ Start Tour' : 'Continue →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────
     PHASE 2: GAME-STYLE SPOTLIGHT TOUR
     Renders via portal over the entire app. A cutout SVG mask
     highlights the targeted element while everything else is
     blurred and dimmed.
     ──────────────────────────────────────────────────────────── */
  const step = TOUR_STEPS[tourStep];
  const hasRect = spotlightRect !== null;
  const rx = spotlightRect;

  return createPortal(
    <>
      {/* Full-screen overlay with cutout */}
      <div
        style={s.tourOverlay}
        onClick={handleNextTourStep}
      >
        {/* Dark layer – CSS clip-path creates the spotlight cutout */}
        <svg
          style={s.tourSvg}
          viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {hasRect && rx && (
                <rect
                  x={rx.left - 8}
                  y={rx.top - 8}
                  width={rx.width + 16}
                  height={rx.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0" y="0"
            width="100%" height="100%"
            fill="rgba(0,0,0,0.78)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Pulsing border around the highlighted element */}
        {hasRect && rx && (
          <div
            style={{
              position: 'fixed',
              top: rx.top - 8,
              left: rx.left - 8,
              width: rx.width + 16,
              height: rx.height + 16,
              borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.35)',
              pointerEvents: 'none',
              animation: 'spotlightPulse 2s ease-in-out infinite',
              zIndex: 10002
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        key={tourStep}
        style={{
          ...s.tourTooltip,
          ...tooltipStyle,
          animation: 'tooltipEnter 0.3s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Step counter */}
        <div style={s.tourTooltipHeader}>
          <span style={s.tourStepBadge}>
            {tourStep + 1} / {TOUR_STEPS.length}
          </span>
          <button type="button" onClick={handleSkipAll} style={s.tourSkipBtn}>
            Skip Tour ✕
          </button>
        </div>

        <h3 style={s.tourTitle}>{step.title}</h3>
        <p style={s.tourBody}>{step.body}</p>

        <div style={s.tourNavRow}>
          {tourStep > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrevTourStep(); }}
              style={s.tourPrevBtn}
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleNextTourStep(); }}
            style={s.tourNextBtn}
          >
            {tourStep === TOUR_STEPS.length - 1 ? '🚀 Enter Workspace' : 'Next →'}
          </button>
        </div>

        {/* Progress dots */}
        <div style={s.tourDotsRow}>
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === tourStep ? '18px' : '6px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: idx <= tourStep ? '#ffffff' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.25s ease'
              }}
            />
          ))}
        </div>
      </div>
    </>,
    document.body
  );
};

/* ──────────────────────────────────────────────────────────────
   STYLES
   ────────────────────────────────────────────────────────────── */

const s: Record<string, React.CSSProperties> = {
  /* ── Questionnaire Phase ── */
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '24px'
  },
  dialog: {
    backgroundColor: '#0c0d10',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '18px',
    width: '100%',
    maxWidth: '580px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 32px 64px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)',
    overflow: 'hidden',
    position: 'relative'
  },
  progressTrack: {
    width: '100%',
    height: '3px',
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
    transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1)'
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px 0'
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoMark: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#09090b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 800
  },
  logoText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    letterSpacing: '-0.01em'
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  tourLinkBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '6px',
    color: '#a1a1aa',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '3px 8px',
    transition: 'all 0.15s ease'
  },
  stepLabel: {
    fontFamily: 'monospace',
    fontSize: '13px',
    display: 'flex',
    gap: '3px'
  },
  stepCurrent: { color: '#ffffff', fontWeight: 700 },
  stepDiv: { color: 'rgba(255,255,255,0.3)' },
  stepTotal: { color: 'rgba(255,255,255,0.45)' },
  skipBtn: {
    background: 'none',
    border: 'none',
    color: '#71717a',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'color 0.15s'
  },
  mandatoryBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px 0'
  },
  mandatoryPill: {
    position: 'relative',
    height: '22px',
    borderRadius: '11px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '10px',
    paddingRight: '10px',
    minWidth: '160px'
  },
  mandatoryFillInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderRadius: '11px',
    transition: 'width 0.3s ease'
  },
  mandatoryText: {
    position: 'relative',
    fontSize: '11px',
    fontWeight: 600,
    color: '#a1a1aa',
    zIndex: 1
  },
  requiredTag: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#f87171',
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    padding: '2px 8px',
    borderRadius: '6px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const
  },
  optionalTag: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#71717a',
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '2px 8px',
    borderRadius: '6px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const
  },
  questionCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '260px'
  },
  questionIconRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  questionNumber: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'monospace'
  },
  questionLabel: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
    margin: 0
  },
  questionHint: {
    fontSize: '13px',
    color: '#71717a',
    lineHeight: 1.5,
    margin: 0
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#ffffff',
    fontSize: '15px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    marginTop: '4px'
  },
  textarea: {
    resize: 'vertical' as const,
    minHeight: '80px',
    lineHeight: 1.5
  },
  inputShake: {
    borderColor: '#f87171',
    animation: 'shake 0.4s ease'
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderTop: '1px solid rgba(255,255,255,0.06)'
  },
  dotsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  dot: {
    height: '6px',
    borderRadius: '3px',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'all 0.25s ease'
  },
  navBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  prevBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  nextBtn: {
    padding: '8px 22px',
    borderRadius: '8px',
    border: '1px solid #ffffff',
    backgroundColor: '#ffffff',
    color: '#09090b',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(255,255,255,0.12)'
  },

  /* ── Tour Phase ── */
  tourOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10001,
    cursor: 'pointer'
  },
  tourSvg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%'
  },
  tourTooltip: {
    position: 'fixed',
    zIndex: 10003,
    backgroundColor: '#0f1015',
    border: '1px solid rgba(255,255,255,0.16)',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  tourTooltipHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tourStepBadge: {
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  tourSkipBtn: {
    background: 'none',
    border: 'none',
    color: '#71717a',
    fontSize: '11px',
    cursor: 'pointer',
    padding: '2px 6px'
  },
  tourTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.01em'
  },
  tourBody: {
    fontSize: '13px',
    color: '#a1a1aa',
    lineHeight: 1.55,
    margin: 0
  },
  tourNavRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px'
  },
  tourPrevBtn: {
    padding: '6px 12px',
    borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  tourNextBtn: {
    padding: '6px 16px',
    borderRadius: '7px',
    border: '1px solid #ffffff',
    backgroundColor: '#ffffff',
    color: '#09090b',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(255,255,255,0.1)'
  },
  tourDotsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '2px'
  }
};
