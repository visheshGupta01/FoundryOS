import React, { useState } from 'react';
import { login, signup } from '../../services/auth.service';
import './Auth.css';

export interface LoginPageProps {
  onLoginSuccess?: (token: string) => void;
  onBackToLanding?: () => void;
  initialMode?: 'signin' | 'signup';
}

type AuthMode = 'signin' | 'signup';

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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode]);

  const isSignup = mode === 'signup';

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
    try {
      window.location.hash = nextMode === 'signup' ? '#signup' : '#signin';
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (isSignup) {
      if (!cleanName || cleanName.length < 2) {
        setError('Please enter your full name (minimum 2 characters).');
        return;
      }
      if (!cleanEmail) {
        setError('Please enter your email.');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else {
      if (!cleanEmail || !password) {
        setError('Please enter your email and password.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = isSignup
        ? await signup({ name: cleanName, email: cleanEmail, password })
        : await login({ email: cleanEmail, password });

      if (!result.success || !result.token) {
        setError(result.error || (isSignup ? 'Unable to create account.' : 'Unable to sign in.'));
        setIsLoading(false);
        return;
      }

      localStorage.setItem('foundry_token', result.token);
      if (result.user?.name) {
        localStorage.setItem('foundry_user_name', result.user.name);
      } else if (cleanName) {
        localStorage.setItem('foundry_user_name', cleanName);
      }
      if (result.user?.email) {
        localStorage.setItem('foundry_user_email', result.user.email);
      } else {
        localStorage.setItem('foundry_user_email', cleanEmail);
      }

      if (isSignup) {
        localStorage.removeItem('foundryos_onboarded_v1');
        localStorage.removeItem(`foundryos_onboarded_${cleanEmail}`);
        localStorage.setItem('foundryos_needs_onboarding', 'true');
      }

      window.dispatchEvent(new Event('foundry_auth_changed'));
      onLoginSuccess?.(result.token);
    } catch {
      setError('An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-grid" />
      <div className={`auth-card ${isSignup ? 'is-signup-mode' : 'is-signin-mode'}`}>
        <div className="auth-brand">Foundry<span>OS</span></div>
        <div className="auth-header-anim" key={mode}>
          <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="auth-subtitle">
            {isSignup ? 'Create an account to start using your workspace.' : 'Sign in to continue to your workspace.'}
          </p>
        </div>

        <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
          <div className={`auth-mode-glider ${isSignup ? 'is-signup' : 'is-signin'}`} />
          <button
            type="button"
            className={!isSignup ? 'active' : ''}
            onClick={() => switchMode('signin')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={isSignup ? 'active' : ''}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div
            className={`auth-field-expandable ${isSignup ? 'is-expanded' : 'is-collapsed'}`}
            aria-hidden={!isSignup}
          >
            <div className="auth-field-expandable-inner">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                tabIndex={isSignup ? 0 : -1}
              />
            </div>
          </div>

          <div className="auth-field-static">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="auth-field-static">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </div>

          <div
            className={`auth-field-expandable ${isSignup ? 'is-expanded' : 'is-collapsed'}`}
            aria-hidden={!isSignup}
          >
            <div className="auth-field-expandable-inner">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                tabIndex={isSignup ? 0 : -1}
              />
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            <span key={isSignup ? 'signup-btn' : 'signin-btn'} className="auth-btn-label">
              {isLoading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create account' : 'Sign in')}
            </span>
          </button>
        </form>

        {onBackToLanding && (
          <div className="auth-back-link">
            <button type="button" onClick={onBackToLanding}>
              ← Back to Overview
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
