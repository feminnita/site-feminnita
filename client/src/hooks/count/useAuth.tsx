"use client";

import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../../services/authService";
import type { Customer } from "../../types/auth/auth";

type AuthValue = {
    customer: Customer | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<Customer>;
    register: (name: string, email: string, password: string, cnpj?: string, acceptResaleTerm?: boolean) => Promise<Customer>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authService
            .fetchMe()
            .then(setCustomer)
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const logged = await authService.login(email, password);
        setCustomer(logged);
        return logged;
    };

    const register = async (name: string, email: string, password: string, cnpj?: string, acceptResaleTerm?: boolean) => {
        await authService.register(name, email, password, cnpj, acceptResaleTerm);
        return login(email, password);
    };

    const logout = async () => {
        await authService.logout();
        setCustomer(null);
    };

    const refresh = async () => {
        setCustomer(await authService.fetchMe());
    };

    return (
        <AuthContext.Provider
            value={{ customer, loading, login, register, logout, refresh }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
    return ctx;
}
