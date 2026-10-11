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
    localStorage.removeItem('foundry_token');
}

export function isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('foundry_token'));
}

