import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LandingNav } from './LandingNav';
import { HeroCanvas } from './HeroCanvas';
import { AgentSimulator } from './AgentSimulator';
import { BrainLayersVisualizer } from './BrainLayersVisualizer';
import { AppleBentoGrid } from './AppleBentoGrid';
import { ProductSection } from './ProductSection';
import { AboutSection } from './AboutSection';
import { PricingSection } from './PricingSection';
import { LandingFooter } from './LandingFooter';
import { Icons } from '../common/Icons';
import './LandingPage.css';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onLaunchWorkspace: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchWorkspace,
  theme,
  toggleTheme
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const scroller = containerRef.current;
    if (!scroller) return;

    ScrollTrigger.defaults({ scroller });

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scroller,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          if (progressBarRef.current) {
            progressBarRef.current.style.width = `${self.progress * 100}%`;
          }
        }
      });

      // === HERO: Cinematic Staggered Entrance ===
      const heroTl = gsap.timeline({ delay: 0.2 });
      heroTl
        .from('.hero-pill', {
          opacity: 0, y: -30, scale: 0.9, filter: 'blur(10px)',
          duration: 0.7, ease: 'power3.out'
        })
        .from('.hero-headline', {
          opacity: 0, y: 60, scale: 0.97, filter: 'blur(8px)',
          duration: 1, ease: 'power4.out'
        }, '-=0.35')
        .from('.hero-subtitle', {
          opacity: 0, y: 30, filter: 'blur(6px)',
          duration: 0.8, ease: 'power3.out'
        }, '-=0.55')
        .from('.hero-cta-group', {
          opacity: 0, y: 25, duration: 0.7, ease: 'power3.out'
        }, '-=0.45')
        .from('.hero-cli-box', {
          opacity: 0, x: -20, duration: 0.5, ease: 'power2.out'
        }, '-=0.3')
        .from('.hero-metric-card', {
          opacity: 0, y: 50, rotateY: -8, scale: 0.92, filter: 'blur(4px)',
          duration: 0.8, stagger: 0.12, ease: 'power3.out'
        }, '-=0.3');

      // === HERO: Parallax depth on scroll ===
      gsap.to('.hero-canvas-wrapper', {
        yPercent: 30, opacity: 0.3,
        scrollTrigger: {
          trigger: '.landing-hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8
        }
      });

      gsap.to('.hero-content', {
        y: -60, opacity: 0,
        scrollTrigger: {
          trigger: '.landing-hero',
          start: '60% top',
          end: 'bottom top',
          scrub: 0.6
        }
      });

      // === SECTION HEADERS: Clip-path wipe reveal ===
      const tags = gsap.utils.toArray<HTMLElement>('.section-tag');
      tags.forEach((tag) => {
        gsap.fromTo(tag,
          { opacity: 0, scale: 0.8, y: 15 },
          {
            opacity: 1, scale: 1, y: 0,
            duration: 0.6, ease: 'back.out(2)',
            scrollTrigger: { trigger: tag, start: 'top 88%', toggleActions: 'play none none none' }
          }
        );
      });

      const titles = gsap.utils.toArray<HTMLElement>('.section-title');
      titles.forEach((title) => {
        gsap.fromTo(title,
          { opacity: 0, y: 45, clipPath: 'inset(0 0 100% 0)' },
          {
            opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)',
            duration: 1, ease: 'power4.out',
            scrollTrigger: { trigger: title, start: 'top 85%', toggleActions: 'play none none none' }
          }
        );
      });

      const descs = gsap.utils.toArray<HTMLElement>('.section-desc');
      descs.forEach((desc) => {
        gsap.fromTo(desc,
          { opacity: 0, y: 25 },
          {
            opacity: 1, y: 0,
            duration: 0.7, ease: 'power3.out',
            scrollTrigger: { trigger: desc, start: 'top 88%', toggleActions: 'play none none none' }
          }
        );
      });

      // === BENTO GRID: Apple-style 3D entrance ===
      const bentoCards = gsap.utils.toArray<HTMLElement>('.bento-card');
      bentoCards.forEach((card, idx) => {
        gsap.fromTo(card,
          { opacity: 0, y: 50, scale: 0.94, filter: 'blur(8px)' },
          {
            opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
            duration: 0.9, delay: (idx % 2) * 0.12, ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // === PRODUCT CARDS: Staggered reveal ===
      const productCards = gsap.utils.toArray<HTMLElement>('.product-card');
      productCards.forEach((card, idx) => {
        gsap.fromTo(card,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.7, delay: (idx % 3) * 0.08, ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // === PRICING CARDS: Perspective entrance ===
      const pricingCards = gsap.utils.toArray<HTMLElement>('.pricing-card');
      pricingCards.forEach((card, idx) => {
        gsap.fromTo(card,
          { opacity: 0, y: 45, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.8, delay: idx * 0.1, ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // === SIMULATOR: 3D perspective tilt + glow emergence ===
      gsap.fromTo('.sim-tilt-target',
        { rotateX: 22, scale: 0.88, opacity: 0.4, filter: 'blur(6px)' },
        {
          rotateX: 0, scale: 1, opacity: 1, filter: 'blur(0px)',
          scrollTrigger: {
            trigger: '#simulator-section',
            start: 'top 90%',
            end: 'top 25%',
            scrub: 1.5
          }
        }
      );

      // === BRAIN LAYERS: Stagger from left with rotation ===
      const brainItems = gsap.utils.toArray<HTMLElement>('#brain-section .brain-layer-item');
      brainItems.forEach((item, i) => {
        gsap.fromTo(item,
          { opacity: 0, x: -80, rotateY: -12 },
          {
            opacity: 1, x: 0, rotateY: 0,
            duration: 0.7, delay: i * 0.08, ease: 'power3.out',
            scrollTrigger: {
              trigger: '#brain-section',
              start: 'top 75%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      gsap.fromTo('#brain-section .brain-layer-preview',
        { opacity: 0, x: 60, scale: 0.95 },
        {
          opacity: 1, x: 0, scale: 1,
          duration: 0.9, ease: 'power3.out',
          scrollTrigger: {
            trigger: '#brain-section',
            start: 'top 70%',
            toggleActions: 'play none none none'
          }
        }
      );

      // === SPECIALIST CARDS: Fan-out from center with rotation ===
      const agentCards = gsap.utils.toArray<HTMLElement>('#specialists-section .agent-card');
      agentCards.forEach((card, i) => {
        const col = i % 3;
        const xOffset = col === 0 ? -40 : col === 2 ? 40 : 0;
        const rotateVal = col === 0 ? -4 : col === 2 ? 4 : 0;

        gsap.fromTo(card,
          { opacity: 0, y: 60, x: xOffset, rotate: rotateVal, scale: 0.92 },
          {
            opacity: 1, y: 0, x: 0, rotate: 0, scale: 1,
            duration: 0.8, delay: i * 0.07, ease: 'power3.out',
            scrollTrigger: {
              trigger: '#specialists-section',
              start: 'top 78%',
              toggleActions: 'play none none none'
            }
          }
        );
      });

      // === ROI CALCULATOR: Scale + blur scrub ===
      gsap.fromTo('#roi-section .roi-card',
        { opacity: 0, scale: 0.9, y: 50, filter: 'blur(8px)' },
        {
          opacity: 1, scale: 1, y: 0, filter: 'blur(0px)',
          scrollTrigger: {
            trigger: '#roi-section',
            start: 'top 85%',
            end: 'top 40%',
            scrub: 1.2
          }
        }
      );

      // === CTA BANNER: Smooth entrance ===
      gsap.fromTo('.landing-cta-banner',
        { opacity: 0, y: 35 },
        {
          opacity: 1, y: 0,
          duration: 0.8, ease: 'power3.out',
          scrollTrigger: {
            trigger: '.landing-cta-section',
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );

      gsap.fromTo('.cta-banner-glow',
        { scale: 0.5, opacity: 0 },
        {
          scale: 1, opacity: 1,
          scrollTrigger: {
            trigger: '.landing-cta-banner',
            start: 'top 80%',
            end: 'center center',
            scrub: 1
          }
        }
      );

      // === FOOTER: Slide up ===
      gsap.fromTo('.landing-footer',
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0,
          duration: 0.7, ease: 'power3.out',
          scrollTrigger: {
            trigger: '.landing-footer',
            start: 'top 95%',
            toggleActions: 'play none none none'
          }
        }
      );

      // === METRIC CARDS: Counter-spin on scroll ===
      const metricCards = gsap.utils.toArray<HTMLElement>('.hero-metric-card');
      metricCards.forEach((card) => {
        gsap.to(card, {
          y: -15,
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5
          }
        });
      });

      ScrollTrigger.refresh();
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, []);



  return (
    <div className="landing-container" data-theme={theme} ref={containerRef}>
      {/* Laser Scroll Progress Bar */}
      <div className="landing-progress-bar" ref={progressBarRef} />

      {/* Background Ambience */}
      <div className="landing-bg-glow" />
      <div className="landing-bg-grid" />

      {/* Navigation */}
      <LandingNav
        onLaunch={onLaunchWorkspace}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-canvas-wrapper">
          <HeroCanvas />
        </div>

        <div className="hero-content">
          <div className="hero-pill">
            <span className="hero-pulse-dot" />
            <span>FOUNDRYOS • AI-POWERED MARKETING OPERATING SYSTEM</span>
          </div>

          <h1 className="hero-headline">
            The Autonomous Marketing OS for <span className="hero-headline-highlight">High-Growth Founders.</span>
          </h1>

          <p className="hero-subtitle">
            Coordinate specialized AI agents, persistent 7-layer company memory, and real-time MCP tool execution — without repetitive prompt re-entry or context loss.
          </p>

          <div className="hero-cta-group">
            <button className="hero-cta-primary" onClick={onLaunchWorkspace}>
              <span>Get Started Free</span>
              <Icons.ChevronRight size={16} />
            </button>

            <button
              className="hero-cta-secondary"
              onClick={() => {
                const el = document.getElementById('simulator');
                if (el && containerRef.current) {
                  containerRef.current.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
                }
              }}
            >
              <Icons.Sparkles size={16} />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Hero Metrics */}
          <div className="hero-metrics">
            <div className="hero-metric-card">
              <div className="hero-metric-value">Enterprise-Grade Privacy</div>
              <div className="hero-metric-label">SOC 2 compliant infrastructure with zero third-party data sharing.</div>
            </div>

            <div className="hero-metric-card">
              <div className="hero-metric-value">7-Layer Memory</div>
              <div className="hero-metric-label">Persistent Company Brain that never forgets brand context.</div>
            </div>

            <div className="hero-metric-card">
              <div className="hero-metric-value">7 MCP Servers</div>
              <div className="hero-metric-label">Live market intelligence, SEO audit, and doc synthesis tools.</div>
            </div>

            <div className="hero-metric-card">
              <div className="hero-metric-value">0 Prompt Fluff</div>
              <div className="hero-metric-label">Strict schema enforcement and founder-aligned outputs.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <ProductSection />

      {/* Apple-Style Bento Grid Architecture Matrix */}
      <AppleBentoGrid />

      {/* Section: How It Works / Interactive Live Simulator */}
      <section className="landing-section" id="simulator-section">
        <div className="section-header" id="simulator">
          <span className="section-tag">How It Works</span>
          <h2 className="section-title">Experience Autonomous Multi-Agent Coordination</h2>
          <p className="section-desc">
            See how FoundryOS decomposes an objective, queries 7 layers of company memory, runs MCP tools, and delivers verified deliverables in real time.
          </p>
        </div>

        <div className="sim-perspective-wrap">
          <div className="sim-tilt-target">
            <div className="sim-display-bezel">
              <div className="display-lights">
                <div className="display-light-dot" />
                <div className="display-light-dot" />
                <div className="display-light-dot" />
              </div>
              <div className="display-camera-notch" />
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#737373' }}>
                FOUNDRY_STUDIO_DISPLAY_4K
              </div>
            </div>
            <AgentSimulator />
          </div>
        </div>
      </section>

      {/* 7-Layer Company Brain Visualizer */}
      <section className="landing-section" id="brain-section">
        <div className="section-header" id="brain-layers">
          <span className="section-tag">Persistent Architecture</span>
          <h2 className="section-title">The 7-Layer Company Brain</h2>
          <p className="section-desc">
            Generic AI chats start from scratch every session. FoundryOS layers your institutional memory, competitor matrix, and brand rules directly into every prompt token budget.
          </p>
        </div>

        <BrainLayersVisualizer />
      </section>

      {/* About Section */}
      <AboutSection />

      {/* Pricing Section */}
      <PricingSection
        onLaunch={onLaunchWorkspace}
      />

      {/* Modern High-End Cyberpunk/Luxury Footer */}
      <LandingFooter onLaunch={onLaunchWorkspace} />
    </div>
  );
};
