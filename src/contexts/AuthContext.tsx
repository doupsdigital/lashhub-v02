import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Usuario } from '../types';
import { setCurrentUsuarioNome } from '../utils/log';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Usuario | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil do usuário:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Erro de rede ao carregar perfil do usuário:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user?.email) {
      const userProfile = await fetchProfile(currentSession.user.email);
      setProfile(userProfile);
      if (userProfile?.nome) {
        setCurrentUsuarioNome(userProfile.nome);
      }
    }
  };

  useEffect(() => {
    // 1. Obter sessão atual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        const userProfile = await fetchProfile(session.user.email);
        setProfile(userProfile);
        if (userProfile?.nome) {
          setCurrentUsuarioNome(userProfile.nome);
        }
      } else {
        setProfile(null);
        setCurrentUsuarioNome('Usuário do Sistema');
      }
      setLoading(false);
    });

    // 2. Ouvir mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        setLoading(true);
        const userProfile = await fetchProfile(session.user.email);
        setProfile(userProfile);
        if (userProfile?.nome) {
          setCurrentUsuarioNome(userProfile.nome);
        }
        setLoading(false);
      } else {
        setProfile(null);
        setCurrentUsuarioNome('Usuário do Sistema');
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setCurrentUsuarioNome('Usuário do Sistema');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = (profile?.email || user?.email) === 'rosae@clinic.com';

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
