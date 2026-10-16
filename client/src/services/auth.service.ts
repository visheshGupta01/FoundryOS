import type { LoginRequest, LoginResponse, SignupRequest } from '../types/auth';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = (await response.json()) as LoginResponse;
        return response.ok ? data : { success: false, error: data.error || 'Invalid login details.' };
    } catch {
        return { success: false, error: 'Unable to connect to the server.' };
    }
}

export async function signup(credentials: SignupRequest): Promise<LoginResponse> {
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = (await response.json()) as LoginResponse;
        return response.ok ? data : { success: false, error: data.error || 'Unable to create account.' };
    } catch {
        return { success: false, error: 'Unable to connect to the server.' };
    }
}

export function logout(): void {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('foundry_token');
        localStorage.removeItem('foundry_token');
        localStorage.removeItem('foundry_user_name');
        localStorage.removeItem('foundry_user_email');
        window.dispatchEvent(new Event('foundry_auth_changed'));

        if (token && token !== 'foundry-founder-session') {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }).catch(() => {});
        }
    }
}

export function isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('foundry_token');
        return Boolean(token && token.trim().length > 0);
    }
    return false;
}

