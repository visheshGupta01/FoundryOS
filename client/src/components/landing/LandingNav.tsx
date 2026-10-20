import React, { useState, useEffect } from 'react';
import { BrainLogo } from '../common/BrainLogo';
import { Icons } from '../common/Icons';

interface LandingNavProps {
  onLaunch: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({
  onLaunch,
  theme,
  toggleTheme
}) => {
  const [activeTab, setActiveTab] = useState<string>('hero');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
      setIsScrolled(scrollPos > 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string, tabName: string) => {
    setActiveTab(tabName);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="landing-capsule-nav-wrapper">
      <nav className={`landing-capsule-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div
          className="capsule-brand"
          onClick={() => {
            setActiveTab('hero');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const container = document.querySelector('.landing-container');
            if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <BrainLogo size={22} />
          <span className="capsule-brand-title">FoundryOS</span>

        </div>

        <div className="capsule-links">
          <button
            className={`capsule-link ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => scrollToSection('product-section', 'product')}
          >
            Product
          </button>
          <button
            className={`capsule-link ${activeTab === 'how-it-works' ? 'active' : ''}`}
            onClick={() => scrollToSection('simulator-section', 'how-it-works')}
          >
            How It Works
          </button>
          <button
            className={`capsule-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => scrollToSection('about-section', 'about')}
          >
            About
          </button>
          <button
            className={`capsule-link ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => scrollToSection('pricing-section', 'pricing')}
          >
            Pricing
          </button>
        </div>

        <div className="capsule-actions">
          <button
            className="capsule-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Icons.Sun size={15} /> : <Icons.Moon size={15} />}
          </button>

          <button className="capsule-btn-launch" onClick={onLaunch}>
            <span>Launch App</span>
            <Icons.ChevronRight size={13} />
          </button>
        </div>
      </nav>
    </header>
  );
};
