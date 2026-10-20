import React, { useState, useEffect } from 'react';
import { BrainLogo } from '../common/BrainLogo';
import { Icons } from '../common/Icons';
import './LandingFooter.css';

interface LandingFooterProps {
  onLaunch: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onLaunch }) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0] + ' UTC' + (now.getTimezoneOffset() > 0 ? '-' : '+') + Math.abs(Math.floor(now.getTimezoneOffset() / 60)));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const container = document.querySelector('.landing-container');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="cool-footer">
      <div className="footer-ambient-radial" />

      <div className="cool-footer-inner">
        {/* 4-Column Directory Grid */}
        <div className="footer-columns-grid">
          <div className="footer-col-brand">
            <div className="footer-brand-header">
              <BrainLogo size={24} />
              <span className="footer-brand-title">FoundryOS</span>
              <span className="footer-brand-pill">AI-POWERED</span>
            </div>
            <p className="footer-brand-bio">
              The autonomous AI Marketing Operating System. Orchestrating specialized marketing agents with persistent memory and executive governance.
            </p>
            <div className="footer-badges-wrap">
              <span className="footer-sub-badge">Air-Gapped Ready</span>
              <span className="footer-sub-badge">Model Context Protocol</span>
              <span className="footer-sub-badge">SQLite Vectors</span>
            </div>
          </div>

          <div>
            <div className="footer-col-title">Autonomous Agents</div>
            <ul className="footer-col-list">
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('team-section')}>
                  <span>Market Research Analyst</span>
                  <span className="footer-tag-hot">Signals</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('team-section')}>
                  <span>Chief Marketing Strategist</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('team-section')}>
                  <span>Growth Marketing Specialist</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('team-section')}>
                  <span>Creative Content Director</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('team-section')}>
                  <span>SEO &amp; ASO Specialist</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('team-section')}>
                  <span>Full Marketing Director</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Platform Architecture</div>
            <ul className="footer-col-list">
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('brain-section')}>
                  <span>7-Layer Company Brain</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('simulator-section')}>
                  <span>Human-In-The-Loop Gate</span>
                  <span className="footer-tag-hot">Safety</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('product-section')}>
                  <span>TrueForge Multi-Turn Harness</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('product-section')}>
                  <span>Managed Vector Store</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('pricing-section')}>
                  <span>Enterprise Deployment</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Ecosystem &amp; Open Source</div>
            <ul className="footer-col-list">
              <li>
                <button className="footer-col-item" onClick={onLaunch}>
                  <span>Launch Workspace</span>
                </button>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('pricing-section')}>
                  <span>Founder Economics</span>
                </button>
              </li>
              <li>
                <a
                  className="footer-col-item"
                  href="https://github.com/visheshGupta01/FoundryOS"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>GitHub Repository</span>
                  <Icons.ExternalLink size={12} />
                </a>
              </li>
              <li>
                <button className="footer-col-item" onClick={() => scrollToSection('about-section')}>
                  <span>Mission &amp; Privacy Architecture</span>
                </button>
              </li>
              <li>
                <span className="footer-col-item" style={{ opacity: 0.65, cursor: 'default' }}>
                  <span>Terms of Service • Privacy Policy</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 4. Giant Watermark Silhouette */}
        <div className="footer-watermark-wrap" aria-hidden="true">
          <div className="footer-watermark-text">FOUNDRYOS</div>
        </div>

        {/* 5. Bottom Copyright Bar */}
        <div className="footer-bottom-bar">
          <div className="bottom-bar-left">
            <span>&copy; {new Date().getFullYear()} FoundryOS. Built for privacy-first autonomous intelligence.</span>
            {currentTime && <span className="bottom-clock">{currentTime}</span>}
          </div>

          <div className="bottom-bar-links">
            <button
              onClick={() => scrollToSection('product-section')}
              className="bottom-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Product
            </button>
            <button
              onClick={() => scrollToSection('about-section')}
              className="bottom-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Privacy &amp; Security
            </button>
            <button
              onClick={scrollToTop}
              className="bottom-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Back to top &uarr;
            </button>
            <button
              onClick={onLaunch}
              className="bottom-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              Launch App &rarr;
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
