"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;

  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: {
    email?: string;
    password?: string;
    data?: Record<string, any>;
  }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle auth events
      if (event === "SIGNED_IN") {
        // Redirect to dashboard or intended page
        const redirectTo = new URLSearchParams(window.location.search).get(
          "redirectTo",
        );
        router.push(redirectTo || "/dashboard");
      } else if (event === "SIGNED_OUT") {
        // Redirect to login
        router.push("/auth/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: {
    email?: string;
    password?: string;
    data?: Record<string, any>;
  }) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser(updates);
      return { error };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,

    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  return { user, loading };
}

// Hook to check permissions
export function usePermissions() {
  const { user } = useAuth();

  const isOwner = (resourceUserId: string): boolean => {
    return user?.id === resourceUserId;
  };

  const canEditPoll = (pollCreatorId: string): boolean => {
    return isOwner(pollCreatorId);
  };

  const canDeletePoll = (pollCreatorId: string): boolean => {
    return isOwner(pollCreatorId);
  };

  const canVote = (): boolean => {
    return !!user;
  };

  const canCreatePoll = (): boolean => {
    return !!user;
  };

  return {
    isOwner,
    canEditPoll,
    canDeletePoll,
    canVote,
    canCreatePoll,
  };
}
