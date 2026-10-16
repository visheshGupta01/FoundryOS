import React, { useState } from 'react';
import { login, signup } from '../../services/auth.service';
import { BrainLogo } from '../common/BrainLogo';
import { Icons } from '../common/Icons';
import './Auth.css';

interface LoginPageProps {
  onLoginSuccess?: (token: string) => void;
  onBackToLanding?: () => void;
  initialMode?: 'signin' | 'signup';
}

type AuthMode = 'signin' | 'signup';

const GoogleIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      fill="#ffffff"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#cccccc"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#888888"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#ffffff"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const isSignup = mode === 'signup';

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setForgotSent(false);
  };

  const handleGoogleQuickSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      const demoToken = 'foundry-founder-google-session';
      localStorage.setItem('foundry_token', demoToken);
      localStorage.setItem('foundry_user_name', 'Founder User');
      localStorage.setItem('foundry_user_email', 'founder@foundryos.local');
      setIsLoading(false);
      onLoginSuccess?.(demoToken);
    }, 400);
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }
    setError('');
    setForgotSent(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setForgotSent(false);

    if (isSignup && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = isSignup
      ? await signup({ name: name.trim(), email: email.trim(), password })
      : await login({ email: email.trim(), password });
    setIsLoading(false);

    if (!result.success || !result.token) {
      setError(result.error || (isSignup ? 'Unable to create account.' : 'Invalid email or password.'));
      return;
    }

    localStorage.setItem('foundry_token', result.token);
    if (isSignup && name.trim()) {
      localStorage.setItem('foundry_user_name', name.trim());
    }
    localStorage.setItem('foundry_user_email', email.trim());
    onLoginSuccess?.(result.token);
  };

  return (
    <div className="auth-page-root">
      <div className="auth-ambient-grid" />
      <div className="auth-ambient-radial" />

      <div className="auth-split-wrapper">
        {/* Left Column: Form Panel */}
        <div className="auth-form-column">
          <button
            type="button"
            className="auth-back-link"
            onClick={onBackToLanding || (() => window.location.hash = '')}
          >
            <Icons.ChevronLeft size={16} />
            <span>Back to the website</span>
          </button>

          <div className="auth-form-header">
            <h1 className="auth-title">
              {isSignup ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="auth-subtitle">
              {isSignup
                ? 'Enter your credentials to launch your autonomous workspace!'
                : 'Enter your email and password to sign in!'}
            </p>
          </div>

          {/* Social Sign-In */}
          <button
            type="button"
            className="auth-social-btn"
            onClick={handleGoogleQuickSignIn}
            disabled={isLoading}
          >
            <GoogleIcon size={18} />
            <span>Sign in with Google</span>
          </button>

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or with email</span>
            <span className="auth-divider-line" />
          </div>

          {/* Core Credentials Form */}
          <form onSubmit={handleSubmit} className="auth-main-form" noValidate>
            {isSignup && (
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  type="text"
                  className="auth-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="auth-input-group">
              <label className="auth-label" htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-input-group">
              <label className="auth-label" htmlFor="auth-password">Your Password</label>
              <div className="auth-password-field">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                </button>
              </div>
            </div>

            {isSignup && (
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="auth-confirm-password">Confirm Password</label>
                <div className="auth-password-field">
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="auth-alert-box error" role="alert">
                <Icons.AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {forgotSent && (
              <div className="auth-alert-box info" role="status">
                <Icons.Check size={15} />
                <span>Password reset link sent to your email.</span>
              </div>
            )}

            <button type="submit" className="auth-submit-button" disabled={isLoading}>
              {isLoading ? (
                <span className="auth-spinner-wrap">
                  <span className="auth-spinner" />
                  <span>{isSignup ? 'Creating workspace...' : 'Signing in...'}</span>
                </span>
              ) : (
                <span>{isSignup ? 'Create Account' : 'Sign in'}</span>
              )}
            </button>
          </form>

          {/* Helper links */}
          <div className="auth-helper-links">
            {!isSignup && (
              <button
                type="button"
                className="auth-link-button"
                onClick={handleForgotPassword}
              >
                Forgot your password?
              </button>
            )}

            <div className="auth-switch-mode">
              <span>{isSignup ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
              <button
                type="button"
                className="auth-link-highlight"
                onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
              >
                {isSignup ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </div>

          <p className="auth-legal-disclaimer">
            By creating an account or continuing by logging in, you agree to our{' '}
            <span className="auth-legal-underline">Terms of Service</span> and{' '}
            <span className="auth-legal-underline">Privacy Policy</span>.
          </p>

          <div className="auth-footer-nav">
            <span className="auth-footer-link">Terms &amp; Conditions</span>
            <span className="auth-footer-link">Privacy Policy</span>
            <span className="auth-footer-link">Refund Policy</span>
          </div>
        </div>

        {/* Right Column: Hero Dashboard Showcase Panel */}
        <div className="auth-hero-column">
          <div className="auth-hero-badge">
            <BrainLogo size={20} />
            <span>FoundryOS 2.0</span>
          </div>

          <h2 className="auth-hero-headline">
            Launch your startup project<br />
            <span className="auth-hero-highlight">10X faster in a few days</span>
          </h2>

          {/* Floating 3D Dashboard Mockup Card */}
          <div className="auth-dashboard-mockup">
            <div className="mockup-floating-badge">
              <Icons.TrendingUp size={16} />
            </div>

            <div className="mockup-window-bar">
              <div className="mockup-window-controls">
                <span className="control-dot" />
                <span className="control-dot" />
                <span className="control-dot" />
              </div>
              <div className="mockup-window-title">
                <BrainLogo size={14} />
                <span>FoundryOS Boilerplate</span>
              </div>
              <div className="mockup-status-dot" />
            </div>

            <div className="mockup-body">
              <div className="mockup-inner-header">
                <span className="mockup-header-title">Main Dashboard</span>
              </div>

              {/* Top 4 Metrics Strip */}
              <div className="mockup-metrics-grid">
                <div className="mockup-metric-card">
                  <span className="m-label">Total Revenue</span>
                  <strong className="m-val">$46,042</strong>
                </div>
                <div className="mockup-metric-card">
                  <span className="m-label">Total Credits</span>
                  <strong className="m-val">149,755</strong>
                </div>
                <div className="mockup-metric-card">
                  <span className="m-label">Plan Credits</span>
                  <strong className="m-val">108,000</strong>
                </div>
                <div className="mockup-metric-card">
                  <span className="m-label">Current Plan</span>
                  <strong className="m-val">Expert+</strong>
                </div>
              </div>

              {/* Glowing Waveform Chart */}
              <div className="mockup-chart-container">
                <div className="chart-legend">
                  <span>Credits usage over time</span>
                  <strong>149,755 Tokens</strong>
                </div>
                <svg className="mockup-chart-svg" viewBox="0 0 400 110" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,80 Q50,75 100,55 T200,60 T300,25 T400,30 L400,110 L0,110 Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M0,80 Q50,75 100,55 T200,60 T300,25 T400,30"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="300" cy="25" r="4" fill="#ffffff" />
                  <circle cx="300" cy="25" r="8" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
                </svg>
              </div>

              {/* Mini Table Rows */}
              <div className="mockup-table">
                <div className="mockup-table-row">
                  <span className="row-col-avatar" />
                  <span className="row-col-name">sarah.founder@agency.io</span>
                  <span className="row-col-role">Campaign Lead</span>
                  <span className="row-col-status pill-active">Active</span>
                </div>
                <div className="mockup-table-row">
                  <span className="row-col-avatar" />
                  <span className="row-col-name">david.growth@saas.com</span>
                  <span className="row-col-role">SEO Specialist</span>
                  <span className="row-col-status pill-active">Active</span>
                </div>
              </div>
            </div>

            {/* Bottom Floating CTA Button */}
            <div className="mockup-bottom-cta">
              <Icons.Zap size={15} />
              <span>100% Private Local Inference</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
