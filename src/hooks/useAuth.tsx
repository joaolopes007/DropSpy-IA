import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { logActivity } from './useActivityLogs';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (e: string, p: string) => Promise<void>;
  signUp: (e: string, p: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    }
  }, []);

  const syncSubscription = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/auth/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.success === false) {
        // If expired, refresh local profile to reflect is_blocked and subscription_active state
        await refreshProfile();
      }
    } catch (err) {
      console.error("Subscription sync failed:", err);
    }
  }, [refreshProfile]);

  useEffect(() => {
    // Safety timeout to prevent infinite loading if Firebase hangs
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            setProfile(profileData);
            // Auto sync subscription on session start
            await syncSubscription(u.uid);
          } else {
            // If user exists in Auth but not in Firestore, we should handle it (e.g. redirected from Google)
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setProfile(null);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [syncSubscription]);

  const handleNewUser = async (u: User, name?: string) => {
    const docRef = doc(db, 'users', u.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const profileData = {
        name: name || u.displayName || "",
        email: u.email!,
        avatar_url: u.photoURL || "",
        provider: u.providerData[0]?.providerId || "password",
        subscription_active: false,
        subscription_status: "expired",
        subscription_expires_at: null,
        createdAt: serverTimestamp(),
        is_blocked: false
      };
      await setDoc(docRef, profileData);
      setProfile(profileData as unknown as UserProfile);

      await logActivity(u.uid, {
        action: "Conta Criada",
        description: `Bem-vindo ao DropSpy AI! Sua conta foi criada com sucesso via ${profileData.provider}.`,
        type: "auth"
      });
    } else {
      setProfile(docSnap.data() as UserProfile);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await handleNewUser(result.user);
    await syncSubscription(result.user.uid);
    
    await logActivity(result.user.uid, {
      action: "Login com Google",
      description: "Acesso realizado com uma conta Google.",
      type: "auth"
    });
  };

  const signIn = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const u = cred.user;
    const docRef = doc(db, 'users', u.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setProfile(docSnap.data() as UserProfile);
    }
    await syncSubscription(u.uid);

    await logActivity(u.uid, {
      action: "Login Realizado",
      description: "Acesso realizado com e-mail e senha.",
      type: "auth"
    });
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await handleNewUser(cred.user, name);
    await syncSubscription(cred.user.uid);
  };

  const logout = async () => {
    if (user) {
      await logActivity(user.uid, {
        action: "Logout",
        description: "Sua sessão foi encerrada.",
        type: "auth"
      });
    }
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, data);
    setProfile(prev => prev ? { ...prev, ...data } : null);

    await logActivity(user.uid, {
      action: "Perfil Atualizado",
      description: "Suas informações cadastrais foram alteradas.",
      type: "system",
      metadata: { fields: Object.keys(data) }
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      signUp, 
      signInWithGoogle,
      logout, 
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
