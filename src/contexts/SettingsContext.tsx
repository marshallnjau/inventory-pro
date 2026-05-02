import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: string;
  companyId: string | null;
  hasConfigured: boolean;
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  plan: string;
  currency: string;
  timezone: string;
  createdAt: string;
}

interface SettingsContextType {
  profile: UserProfile | null;
  company: Company | null;
  loading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
  createCompany: (name: string) => Promise<string>;
  settings: UserProfile | null; // For backward compatibility
  currency: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setCompany(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribeUser = onSnapshot(userRef, async (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        setProfile(userData);

        if (userData.companyId) {
          const companyRef = doc(db, 'companies', userData.companyId);
          const companySnap = await getDoc(companyRef);
          if (companySnap.exists()) {
            setCompany({ id: companySnap.id, ...companySnap.data() } as Company);
          }
        } else {
          setCompany(null);
        }
      } else {
        // Initial profile creation
        const initialProfile: UserProfile = {
          userId: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          role: 'Owner',
          companyId: null,
          hasConfigured: false
        };
        await setDoc(userRef, initialProfile);
        setProfile(initialProfile);
        setCompany(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setLoading(false);
    });

    return () => unsubscribeUser();
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...profile, ...updates, userId: user.uid }, { merge: true });
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!profile?.companyId) return;
    const companyRef = doc(db, 'companies', profile.companyId);
    await setDoc(companyRef, { ...company, ...updates }, { merge: true });
  };

  const createCompany = async (name: string) => {
    if (!user) throw new Error("User not authenticated");
    
    const companyId = `comp_${Date.now()}`;
    const newCompany: Omit<Company, 'id'> = {
      name,
      ownerId: user.uid,
      plan: 'free',
      currency: '$',
      timezone: 'Nairobi',
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'companies', companyId), newCompany);
    
    // Create membership
    await setDoc(doc(db, 'companies', companyId, 'members', user.uid), {
      role: 'owner',
      joinedAt: new Date().toISOString()
    });

    // Update user profile
    await updateProfile({ companyId, hasConfigured: true });
    
    return companyId;
  };

  // For backward compatibility while migration is happening
  const settings = profile ? {
    ...profile,
    firstName: profile.name.split(' ')[0] || '',
    lastName: profile.name.split(' ').slice(1).join(' ') || '',
    phone: '',
    currency: company?.currency || '$',
    timezone: company?.timezone || 'Nairobi'
  } as any : null;

  const currency = company?.currency || '$';

  return (
    <SettingsContext.Provider value={{ 
      profile, 
      company, 
      loading, 
      updateProfile, 
      updateCompany, 
      createCompany, 
      settings,
      currency 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
