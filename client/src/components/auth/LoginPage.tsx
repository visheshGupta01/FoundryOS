import React, { useState } from 'react';
import { login, signup } from '../../services/auth.service';
import './Auth.css';

interface LoginPageProps {
    onLoginSuccess?: (token: string) => void;
}

type AuthMode = 'signin' | 'signup';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isSignup = mode === 'signup';

    const switchMode = (nextMode: AuthMode) => {
        setMode(nextMode);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        if (isSignup && !name.trim()) {
            setError('Please enter your name.');
            return;
        }

        if (!email.trim() || !password) {
            setError('Please enter your email and password.');
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
            setError(result.error || (isSignup ? 'Unable to create account.' : 'Unable to sign in.'));
            return;
        }

        localStorage.setItem('foundry_token', result.token);
        onLoginSuccess?.(result.token);
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">Foundry<span>OS</span></div>
                <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
                <p className="auth-subtitle">
                    {isSignup ? 'Create an account to start using your workspace.' : 'Sign in to continue to your workspace.'}
                </p>

                <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
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
                    {isSignup && (
                        <>
                            <label htmlFor="name">Full name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Your name"
                                autoComplete="name"
                            />
                        </>
                    )}

                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                    />

                    {isSignup && (
                        <>
                            <label htmlFor="confirm-password">Confirm password</label>
                            <input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Re-enter your password"
                                autoComplete="new-password"
                            />
                        </>
                    )}

                    {error && <p className="auth-error">{error}</p>}

                    <button type="submit" className="auth-submit" disabled={isLoading}>
                        {isLoading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create account' : 'Sign in')}
                    </button>
                </form>
            </div>
        </div>
    );
};

