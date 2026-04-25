import React, { createContext, useContext, useMemo, useState } from 'react';
import { api, setToken } from '../api/client';
import type { Session } from '../api/types';

type AuthContextValue = {
  session: Session | null;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  logout(): void;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    // Persisting the session lets the user refresh the page without logging in again.
    const raw = localStorage.getItem('mobi_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    setToken(parsed.token);
    return parsed;
  });
  function applySession(next: Session) {
    setToken(next.token);
    setSession(next);
    localStorage.setItem('mobi_session', JSON.stringify(next));
  }
  const value = useMemo(() => ({
    session,
    async login(email: string, password: string) { applySession(await api.login(email, password)); },
    async register(name: string, email: string, password: string) { applySession(await api.register(name, email, password)); },
    logout() { setToken(''); setSession(null); localStorage.removeItem('mobi_session'); }
  }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('AuthProvider missing'); return ctx; }