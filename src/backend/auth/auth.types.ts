export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
}

export interface LoginResponse {
    success: boolean;
    token?: string;
    user?: AuthUser;
    error?: string;
}

