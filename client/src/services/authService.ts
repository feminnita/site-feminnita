import { API_URL, apiGet, apiPost } from './api';
import type { Customer } from '../types/auth/auth';

export function fetchMe(): Promise<Customer | null> {
    return apiGet<Customer>("/api/store/auth/me");
}

export async function login(email: string, password: string): Promise<Customer> {
    return (await apiPost<Customer>("/api/store/auth/login", { email, password })) as Customer;
}

export async function register(name: string, email: string, password: string): Promise<Customer> {
    return (await apiPost<Customer>("/api/store/auth/register", { name, email, password })) as Customer;
}

export async function logout(): Promise<void> {
    await apiPost("/api/store/auth/logout").catch(() => { });
}

export async function forgotPassword(email: string): Promise<void> {
    await apiPost("/api/store/auth/forgot-password", { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
    await apiPost("/api/store/auth/reset-password", { token, password });
}

export const GOOGLE_LOGIN_URL = `${API_URL}/api/store/auth/google`;

