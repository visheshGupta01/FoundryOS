import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Icons } from '../common/Icons';
import './SpotlightTour.css';

export interface TourStep {
  selector: string;
  category: string;
  title: string;
  description: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="sidebar"]',
    category: 'COMMAND CENTER',
    title: 'Autonomous Navigation Bar',
    description: 'This is your primary command center. Easily navigate between collaborative agent workspaces, founder governance, document vaults, and system settings.',
    preferredPlacement: 'right'
  },
  {
    selector: '[data-tour="nav-chat"]',
    category: 'WORKSPACE CANVAS',
    title: 'Agent Execution Canvas',
    description: 'Your central collaboration floor where your autonomous team researches competitors, drafts positioning matrices, and formulates GTM funnels.',
    preferredPlacement: 'right'
  },
  {
    selector: '[data-tour="nav-approvals"]',
    category: 'GOVERNANCE',
    title: 'Human-In-The-Loop Steering Gate',
    description: 'You maintain absolute founder authority. High-stakes strategic deliverables pause at deterministic gates for your review, redirect, or sign-off.',
    preferredPlacement: 'right'
  },
  {
    selector: '[data-tour="nav-employees"]',
    category: 'AI WORKFORCE',
    title: 'Specialized Agent Roster',
    description: 'Inspect your 6 dedicated marketing agents: Market Research Analyst, Chief Strategist, Growth Specialist, Creative Director, SEO/ASO Lead, and Marketing Director.',
    preferredPlacement: 'right'
  },
  {
    selector: '[data-tour="nav-archive"]',
    category: 'KNOWLEDGE VAULT',
    title: 'Document Archive & PDF Export',
    description: 'Every generated research teardown, battlecard, and pitch deck is stored here with vector indexing and one-click PDF deliverable exports.',
    preferredPlacement: 'right'
  },
  {
    selector: '[data-tour="nav-integrations"]',
    category: 'MCP TOOLS',
    title: 'Model Context Protocol (MCP) Hub',
    description: 'Connect Slack notifications, Google Drive sync, DuckDuckGo live web intelligence, and external APIs with zero-secret isolated sandboxes.',
    preferredPlacement: 'right'
  },
  {
    selector: '[data-tour="brain-widget"]',
    category: 'INSTITUTIONAL MEMORY',
    title: '7-Layer Company Brain',
    description: 'Your company institutional brain. Stores your positioning anchors, target ICP, competitor vectors, and brand constraints so agents never need repetitive prompting.',
    preferredPlacement: 'right'
  },
  {
    selector: '[data-tour="header"]',
    category: 'SESSION CONTROL',
    title: 'Session Management & Controls',
    description: 'Start a fresh autonomous session at any time with New Session, or safely manage your founder identity and authentication credentials.',
    preferredPlacement: 'bottom'
  },
  {
    selector: '[data-tour="chat-input-dock"]',
    category: 'EXECUTION INPUT',
    title: 'Multi-Document Context & Prompt Input',
    description: 'Direct your autonomous agents here. Click the paperclip icon to drop up to 5 research documents (pitch decks, interview transcripts) for deep multi-turn synthesis.',
    preferredPlacement: 'top'
  },
  {
    selector: '[data-tour="quick-launch"]',
    category: 'ACCELERATORS',
    title: '1-Click Founder Accelerators',
    description: 'Jumpstart instant strategic workflows: 360° Multi-Agent Launch Teardown, Enterprise Positioning Matrix, or Competitive Moat Audits.',
    preferredPlacement: 'top'
  }
];

interface SpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { setActiveView, activeView } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number }>({ top: 100, left: 100 });
  const cardRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (isOpen && activeView !== 'chat') {
      setActiveView('chat');
    }
  }, [isOpen, activeView, setActiveView]);

  const updateCoordinates = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (!el) {
      setTargetRect({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 150,
        width: 300,
        height: 200
      });
      return;
    }

    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } catch {
      // ignore
    }

    const rect = el.getBoundingClientRect();
    const pad = 8;
    const computedRect: TargetRect = {
      top: Math.max(0, rect.top - pad),
      left: Math.max(0, rect.left - pad),
      width: rect.width + pad * 2,
      height: rect.height + pad * 2
    };
    setTargetRect(computedRect);

    const cardWidth = 380;
    const cardHeight = 240;
    const gap = 16;
    let nextTop = computedRect.top;
    let nextLeft = computedRect.left;

    if (step.preferredPlacement === 'right') {
      nextLeft = computedRect.left + computedRect.width + gap;
      nextTop = Math.min(
        Math.max(16, computedRect.top + computedRect.height / 2 - cardHeight / 2),
        window.innerHeight - cardHeight - 20
      );
    } else if (step.preferredPlacement === 'top') {
      nextTop = Math.max(16, computedRect.top - cardHeight - gap);
      nextLeft = Math.min(
        Math.max(16, computedRect.left + computedRect.width / 2 - cardWidth / 2),
        window.innerWidth - cardWidth - 20
      );
    } else if (step.preferredPlacement === 'bottom') {
      nextTop = Math.min(window.innerHeight - cardHeight - 20, computedRect.top + computedRect.height + gap);
      nextLeft = Math.min(
        Math.max(16, computedRect.left + computedRect.width / 2 - cardWidth / 2),
        window.innerWidth - cardWidth - 20
      );
    } else {
      nextLeft = Math.max(16, computedRect.left - cardWidth - gap);
      nextTop = Math.min(
        Math.max(16, computedRect.top + computedRect.height / 2 - cardHeight / 2),
        window.innerHeight - cardHeight - 20
      );
    }

    if (nextLeft + cardWidth > window.innerWidth - 16) {
      nextLeft = window.innerWidth - cardWidth - 16;
    }
    if (nextLeft < 16) nextLeft = 16;

    setCardPos({ top: nextTop, left: nextLeft });
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    updateCoordinates();
    window.addEventListener('resize', updateCoordinates);
    window.addEventListener('scroll', updateCoordinates, true);
    return () => {
      window.removeEventListener('resize', updateCoordinates);
      window.removeEventListener('scroll', updateCoordinates, true);
    };
  }, [isOpen, updateCoordinates]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen || !step) return null;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleFinish = () => {
    onComplete?.();
    onClose();
  };

  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <div className="spotlight-tour-overlay" role="dialog" aria-modal="true" aria-label="Interactive Workspace Tour">
      {/* SVG Mask Cutout: Blurs everything except spotlight area */}
      <svg className="spotlight-svg-mask">
        <defs>
          <mask id="spotlight-mask-cutout">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect className="spotlight-backdrop-rect" x="0" y="0" width="100%" height="100%" mask="url(#spotlight-mask-cutout)" />
      </svg>

      {/* Blurred Layer with Cutout */}
      <div className="spotlight-blur-backdrop" />

      {/* Active Moving Glow Frame */}
      {targetRect && (
        <div
          className="spotlight-frame"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height
          }}
        />
      )}

      {/* Floating Popover Card */}
      <div
        ref={cardRef}
        className="spotlight-card"
        style={{
          top: `${cardPos.top}px`,
          left: `${cardPos.left}px`
        }}
      >
        <div className="card-top-row">
          <div className="card-badge-wrap">
            <span className="card-step-badge">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
            <span className="card-category-pill">{step.category}</span>
          </div>

          <button
            type="button"
            className="card-skip-btn"
            onClick={handleSkip}
            title="Skip Interactive Tour"
          >
            Skip Tour ✕
          </button>
        </div>

        <h3 className="card-title">{step.title}</h3>
        <p className="card-body">{step.description}</p>

        <div className="card-footer">
          <div className="card-dots">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`card-dot ${idx === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(idx)}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="card-btn-back"
              disabled={currentStep === 0}
              onClick={handleBack}
            >
              Back
            </button>
            <button
              type="button"
              className="card-btn-next"
              onClick={handleNext}
            >
              <span>{isLast ? 'Finish & Launch ✨' : 'Next Step'}</span>
              {!isLast && <Icons.ChevronRight size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
