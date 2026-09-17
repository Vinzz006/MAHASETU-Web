import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, UserPersona } from '../api/client';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export type AppRole = 'CITIZEN' | 'DEPARTMENT_A' | 'DEPARTMENT_B' | 'DEPARTMENT_C' | 'AUDITOR' | 'ADMIN' | 'OFFICER' | 'SYSTEM_ADMIN';

interface AuthContextType {
  currentUser: UserPersona | null;
  personas: UserPersona[];
  loading: boolean;
  isPendingApproval: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithFirebase: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; mobile: string; email: string; password?: string }) => Promise<any>;
  logout: () => void;
  switchPersona: (role: AppRole) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserPersona | null>(null);
  const [personas, setPersonas] = useState<UserPersona[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const profile = await api.getProfile();
      setCurrentUser(prev => prev ? {
        ...prev,
        id: profile.id,
        name: profile.name,
        role: profile.role as AppRole,
        department_id: profile.department_id,
        registration_status: profile.registration_status,
      } : {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        mobile: profile.mobile,
        role: profile.role as AppRole,
        department_id: profile.department_id,
        registration_status: profile.registration_status,
        token: localStorage.getItem('mahasetu_token') || ''
      });
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  useEffect(() => {
    async function loadUserSession() {
      const savedToken = localStorage.getItem('mahasetu_token');

      if (savedToken) {
        try {
          const profile = await api.getProfile();
          setCurrentUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            mobile: profile.mobile,
            role: profile.role as AppRole,
            department_id: profile.department_id,
            registration_status: profile.registration_status,
            token: savedToken
          });

          // Only fetch personas if user has Administrator privileges
          if (profile.role === 'ADMIN' || profile.role === 'SYSTEM_ADMIN') {
            try {
              const fetchedPersonas = await api.getPersonas();
              setPersonas(fetchedPersonas);
            } catch {
              setPersonas([]);
            }
          } else {
            setPersonas([]);
          }
        } catch (err) {
          console.warn('Saved token invalid or expired. Session cleared.');
          localStorage.removeItem('mahasetu_token');
          localStorage.removeItem('mahasetu_role');
          setCurrentUser(null);
          setPersonas([]);
        }
      } else {
        setCurrentUser(null);
        setPersonas([]);
      }
      setLoading(false);
    }
    loadUserSession();
  }, []);

  const switchPersona = (role: AppRole) => {
    const target = personas.find(p => p.role === role);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('mahasetu_token', target.token);
      localStorage.setItem('mahasetu_role', target.role);
    }
  };

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password);
    const matched = personas.find(p => p.id === res.user_id) || {
      id: res.user_id,
      name: res.name,
      role: res.role as AppRole,
      email: `${res.name.toLowerCase().replace(' ', '')}@mahasetu.gov.in`,
      mobile: username,
      department_id: res.department_id,
      registration_status: res.registration_status || 'APPROVED',
      token: res.access_token
    };
    setCurrentUser(matched);
    localStorage.setItem('mahasetu_token', res.access_token);
    localStorage.setItem('mahasetu_role', res.role);

    if (res.role === 'ADMIN' || res.role === 'SYSTEM_ADMIN') {
      try {
        const fetchedPersonas = await api.getPersonas();
        setPersonas(fetchedPersonas);
      } catch {
        setPersonas([]);
      }
    } else {
      setPersonas([]);
    }
  };

  const loginWithFirebase = async (email: string, password: string) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCred.user.getIdToken();
      localStorage.setItem('mahasetu_token', idToken);

      const profile = await api.getProfile();
      const userObj: UserPersona = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        mobile: profile.mobile,
        role: profile.role as AppRole,
        department_id: profile.department_id,
        registration_status: profile.registration_status,
        token: idToken
      };
      setCurrentUser(userObj);
      localStorage.setItem('mahasetu_role', profile.role);
    } catch (fbErr: any) {
      // If Firebase fails or is in demo mode without real creds, fallback to normal login
      console.warn('Firebase login attempt:', fbErr.message);
      await login(email, password);
    }
  };

  const register = async (payload: { name: string; mobile: string; email: string; password?: string }) => {
    let firebaseToken: string | undefined = undefined;
    try {
      if (payload.password) {
        const userCred = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
        firebaseToken = await userCred.user.getIdToken();
      }
    } catch (fbErr) {
      console.warn('Firebase client signup note (continuing to backend):', fbErr);
    }

    const regResult = await api.register({
      name: payload.name,
      mobile: payload.mobile,
      email: payload.email,
      password: payload.password,
      firebase_token: firebaseToken,
      role: 'CITIZEN'
    });

    // Automatically login as the registered user so they see the pending screen
    try {
      await login(payload.mobile, payload.password || 'mahasetu123');
    } catch (e) {
      // Set local representation in case login endpoint restricts
      setCurrentUser({
        id: regResult.id,
        name: regResult.name,
        email: regResult.email,
        mobile: regResult.mobile,
        role: 'CITIZEN',
        registration_status: 'PENDING',
        token: ''
      });
    }

    return regResult;
  };

  const logout = () => {
    signOut(auth).catch(() => {});
    localStorage.removeItem('mahasetu_token');
    localStorage.removeItem('mahasetu_role');
    setCurrentUser(null);
  };

  const isPendingApproval = currentUser?.registration_status === 'PENDING';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        personas,
        loading,
        isPendingApproval,
        login,
        loginWithFirebase,
        register,
        logout,
        switchPersona,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
