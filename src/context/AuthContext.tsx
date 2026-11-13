/**
 * RESQ AI - Hybrid Authentication & Operator Session Context
 * Supports PostgreSQL Credential Authentication (JWT in React memory)
 * and Google Single Sign-On via Firebase Auth synchronized to PostgreSQL RBAC.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { ManagedUser, UserRole } from '../types';

export interface DemoAccountInfo {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  title: string;
  badge: string;
  description: string;
}

interface AuthContextType {
  firebaseUser: User | null;
  currentUser: ManagedUser | null;
  authToken: string | null;
  demoAccounts: DemoAccountInfo[];
  isAuthLoading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithCredentials: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
  updateProfileName: (displayName: string) => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<ManagedUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountInfo[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  // Load safe demo accounts list for login card quick-select
  useEffect(() => {
    let active = true;
    fetch('/api/auth/demo-accounts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.accounts) {
          setDemoAccounts(data.accounts);
        }
      })
      .catch(() => {
        // Ignore silent discovery failure
      });
    return () => {
      active = false;
    };
  }, []);

  const syncFirebaseSessionWithBackend = useCallback(async (fbUser: User) => {
    try {
      const idToken = await fbUser.getIdToken();
      const res = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to verify SSO session');
      }
      const data = await res.json();
      setAuthToken(idToken);
      setCurrentUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to synchronize Google session.';
      setAuthError(message);
      setAuthToken(null);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncFirebaseSessionWithBackend(fbUser);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [syncFirebaseSessionWithBackend]);

  const signInWithCredentials = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      // Ensure any prior Firebase session doesn't conflict
      if (auth.currentUser) {
        await signOut(auth).catch(() => {});
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthError(data.error || 'Invalid email or password.');
        return false;
      }

      setAuthToken(data.token);
      setCurrentUser(data.user);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error during authentication.';
      setAuthError(message);
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await syncFirebaseSessionWithBackend(cred.user);
      return true;
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in popup was closed before completing authentication.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Browser blocked the authentication popup. Please allow popups and try again.');
      } else if (code === 'auth/network-request-failed') {
        setAuthError('Network error while contacting Google authentication services.');
      } else {
        const message = err instanceof Error ? err.message : 'Google Sign-In failed.';
        setAuthError(message);
      }
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }, [syncFirebaseSessionWithBackend]);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    setAuthToken(null);
    setCurrentUser(null);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign out cleanly.';
      setAuthError(message);
    }
  }, []);

  const updateProfileName = useCallback(
    async (displayName: string): Promise<boolean> => {
      if (!authToken) return false;
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update display name');
      }
      setCurrentUser(data.user);
      return true;
    },
    [authToken]
  );

  const refreshSession = useCallback(async () => {
    if (!authToken) return;
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
    }
  }, [authToken]);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentUser,
        authToken,
        demoAccounts,
        isAuthLoading,
        isSigningIn,
        authError,
        clearAuthError,
        signInWithCredentials,
        signInWithGoogle,
        signOutUser,
        updateProfileName,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
