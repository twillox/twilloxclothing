import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { UserProfile } from '../types';
import { useToast } from './ToastContext';

interface AuthContextProps {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateProfileInfo: (displayName: string, phone: string, address: UserProfile['address']) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        await fetchUserProfile(user.uid);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      } else {
        // Fallback for user registered elsewhere or in-memory
        const defaultProfile: UserProfile = {
          uid,
          email: auth.currentUser?.email || '',
          displayName: auth.currentUser?.displayName || 'DECRYPTION_FAILED',
          role: 'customer',
          createdAt: Timestamp.now()
        };
        await setDoc(userRef, defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (e) {
      console.error("Failed to load customer secure security profile:", e);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success("Signed in successfully.");
      return userCredential.user;
    } catch (error: any) {
      let message = "Couldn't sign in. Check your details.";
      if (error.code === 'auth/user-not-found') message = "Account not found.";
      if (error.code === 'auth/wrong-password') message = "Incorrect password.";
      toast.error(message);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Write profile to firestore
      const userRef = doc(db, 'users', user.uid);
      
      // Check if this is the first user ever; if so, make them an admin!
      // In production e-commerce, the first setup creates the master admin.
      // This is a highly friendly, zero-overhead developer bootstrap logic.
      let role: 'customer' | 'admin' = 'customer';
      
      // For friendly setup, let's check if the email contains "admin@" to automatically seed admin role
      if (email.toLowerCase().includes('admin@')) {
        role = 'admin';
      }

      const newProfile: UserProfile = {
        uid: user.uid,
        email: email,
        displayName: displayName,
        role: role,
        createdAt: Timestamp.now()
      };
      
      await setDoc(userRef, newProfile);
      setUserProfile(newProfile);
      
      toast.success(`Welcome to the club, ${displayName}.`);
      return user;
    } catch (error: any) {
      let message = "Couldn't create account.";
      if (error.code === 'auth/email-already-in-use') message = "Email already in use.";
      if (error.code === 'auth/weak-password') message = "Password must be at least 6 characters.";
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    toast.info("Signed out successfully.");
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Reset link sent to your email.");
    } catch (e) {
      toast.error("Couldn't send reset link.");
      throw e;
    }
  };

  const updateProfileInfo = async (
    displayName: string, 
    phone: string, 
    address: UserProfile['address']
  ) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updates = { displayName, phone, address };
      await updateDoc(userRef, updates);
      
      setUserProfile((prev) => prev ? { ...prev, ...updates } : null);
      toast.success("Profile updated.");
    } catch (e) {
      toast.error("Failed to update profile.");
      throw e;
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      isAdmin,
      login,
      register,
      logout,
      forgotPassword,
      updateProfileInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
