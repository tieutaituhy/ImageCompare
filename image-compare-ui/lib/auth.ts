// Authentication utilities and types

export interface User {
    id: number;
    username: string;
    isAvatar: boolean;
    avatarUrl: string;
}

export interface AuthResponse {
    id: number;
    username: string;
    isAvatar: boolean;
    avatarUrl: string;
    token: string;
}

export interface AuthData {
    user: User;
    token: string;
}

const AUTH_STORAGE_KEY = 'auth_data';

/**
 * Save authentication data to localStorage
 */
export function saveAuthData(authResponse: AuthResponse): void {
    if (typeof window === 'undefined')
        return;

    const authData: AuthData = {
        user: {
            id: authResponse.id,
            username: authResponse.username,
            isAvatar: authResponse.isAvatar,
            avatarUrl: authResponse.avatarUrl,
        },
        token: authResponse.token,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

/**
 * Update avatar info in localStorage after upload
 */
export function updateAvatarInfo(avatarUrl: string): void {
    if (typeof window === 'undefined') return;

    const authData = getAuthData();
    if (!authData) return;

    authData.user.isAvatar = true;
    authData.user.avatarUrl = avatarUrl;

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

/**
 * Get authentication data from localStorage
 */
export function getAuthData(): AuthData | null {
    if (typeof window === 'undefined') return null;

    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;

    try {
        return JSON.parse(data) as AuthData;
    } catch {
        return null;
    }
}

/**
 * Clear authentication data (logout)
 */
export function clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return getAuthData() !== null;
}

/**
 * Get authentication token
 */
export function getToken(): string | null {
    const authData = getAuthData();
    return authData?.token ?? null;
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
    const authData = getAuthData();
    return authData?.user ?? null;
}
