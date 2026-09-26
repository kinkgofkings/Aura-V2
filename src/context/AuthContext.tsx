import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserStatus } from '../types';
import { auth, db, googleProvider, facebookProvider, githubProvider, signInAnonymously } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseAuthProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { notificationService } from '../services/notifications';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

interface AuthContextType {
  user: UserProfile | null;
  allUsers: UserProfile[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  
  // Auth Methods
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
  registerWithEmail: (email: string, username: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => Promise<{ success: boolean; error?: string }>;
  loginAsAdminTex: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Social
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithFacebook: () => Promise<{ success: boolean; error?: string }>;
  signInWithGithub: () => Promise<{ success: boolean; error?: string }>;
  
  // Verification & Reset
  sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  // Phone Auth
  setupRecaptcha: (containerId: string) => void;
  sendPhoneCode: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  
  // Profile
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setUserStatus: (status: UserStatus, statusMessage?: string) => Promise<void>;
  getUserById: (id: string) => UserProfile | undefined;
  followUser: (targetUserId: string) => Promise<boolean>;
  
  isOnline: boolean;
  isServerConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('aura_cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isServerConnected, setIsServerConnected] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const setUserAndCache = (newUser: UserProfile | null) => {
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem('aura_cached_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('aura_cached_user');
      }
    } catch {}
  };

  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;

    // Handle redirect result for mobile web auth
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const providerId = result.user.providerData[0]?.providerId;
        const authProvider = providerId === 'google.com' ? 'google' : providerId === 'facebook.com' ? 'facebook' : providerId === 'github.com' ? 'github' : 'email';
        await syncFirebaseUserToDb(result.user, { authProvider });
      }
    }).catch((err) => {
      console.error('Redirect auth error:', err);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Listen to all users only when authenticated
          const q = query(collection(db, 'users'));
          unsubscribeUsers = onSnapshot(q, (snapshot) => {
            const usersList: UserProfile[] = [];
            snapshot.forEach((doc) => {
              usersList.push({ id: doc.id, ...doc.data() } as UserProfile);
            });
            setAllUsers(usersList);
          }, (err) => {
            console.warn('Users snapshot listener warning:', err);
          });

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const profileData = userDoc.data() as Omit<UserProfile, 'id'>;
            const fullProfile: UserProfile = { 
              id: firebaseUser.uid, 
              ...profileData,
              isVerified: firebaseUser.emailVerified || !!firebaseUser.phoneNumber || profileData.authProvider !== 'email'
            };
            setUserAndCache(fullProfile);
          } else {
            // If no doc exists (e.g. newly signed up via social), create one
            const newProfile: UserProfile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || '',
              handle: (firebaseUser.email?.split('@')[0] || firebaseUser.uid).toLowerCase(),
              avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.uid}`,
              bio: 'Just joined the sanctuary.',
              status: 'online',
              followersCount: 0,
              followingCount: 0,
              isVerified: firebaseUser.emailVerified || !!firebaseUser.phoneNumber,
              joinedAt: new Date().toISOString(),
              authProvider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email'
            };
            await setDoc(userDocRef, newProfile);
            setUserAndCache(newProfile);
          }
        } catch (dbErr) {
          console.error('Error fetching/setting user profile in Firestore:', dbErr);
          // Fallback to local profile constructed directly from firebaseUser
          const fallbackProfile: UserProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Believer',
            email: firebaseUser.email || '',
            handle: (firebaseUser.email?.split('@')[0] || firebaseUser.uid).toLowerCase(),
            avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.uid}`,
            bio: 'Just joined the sanctuary.',
            status: 'online',
            followersCount: 0,
            followingCount: 0,
            isVerified: true,
            joinedAt: new Date().toISOString(),
            authProvider: (firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email')
          };
          setUserAndCache(fallbackProfile);
        }
      } else {
        // If not signed into Firebase, preserve local guest or demo sessions
        try {
          const cached = localStorage.getItem('aura_cached_user');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && (parsed.authProvider === 'guest' || parsed.authProvider === 'demo' || parsed.id?.startsWith('tex_'))) {
              setUser(parsed);
              return;
            }
          }
        } catch {}
        setUserAndCache(null);
      }
    });

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      unsubscribeAuth();
    };
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);

  const syncFirebaseUserToDb = async (firebaseUser: FirebaseUser, additionalData?: any) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const newProfile: UserProfile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || additionalData?.name || 'New User',
        email: firebaseUser.email || additionalData?.email || '',
        handle: additionalData?.handle || (firebaseUser.email?.split('@')[0] || firebaseUser.uid).toLowerCase(),
        avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.uid}`,
        bio: 'Just joined the sanctuary.',
        status: 'online',
        followersCount: 0,
        followingCount: 0,
        isVerified: firebaseUser.emailVerified || !!firebaseUser.phoneNumber || additionalData?.authProvider !== 'email',
        joinedAt: new Date().toISOString(),
        authProvider: additionalData?.authProvider || 'email'
      };
      await setDoc(userDocRef, newProfile);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, requiresVerification: !result.user.emailVerified };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const registerWithEmail = async (email: string, username: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateFirebaseAuthProfile(result.user, { displayName: name });
      await syncFirebaseUserToDb(result.user, { name, handle: username, authProvider: 'email' });
      try {
        await sendEmailVerification(result.user);
      } catch (e) {
        console.warn('Verification email send warning:', e);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const loginAsGuest = async () => {
    try {
      if (auth) {
        try {
          const res = await signInAnonymously(auth);
          if (res.user) {
            const guestProfile: UserProfile = {
              id: res.user.uid,
              name: 'Believer Guest',
              email: 'guest@aura.sanctuary',
              handle: 'believer_' + res.user.uid.slice(0, 5).toLowerCase(),
              avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${res.user.uid}`,
              bio: 'Walking in the Light with Aura.',
              status: 'online',
              followersCount: 0,
              followingCount: 0,
              isVerified: true,
              joinedAt: new Date().toISOString(),
              authProvider: 'guest'
            };
            setUserAndCache(guestProfile);
            return { success: true };
          }
        } catch (anonErr) {
          console.warn('Firebase anonymous signin disabled, using local guest fallback:', anonErr);
        }
      }
    } catch (e) {
      console.warn('Guest login error fallback:', e);
    }
    
    // Guaranteed instant guest session fallback
    const localGuest: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      name: 'Believer Guest',
      email: 'guest@aura.sanctuary',
      handle: 'believer_' + Math.random().toString(36).substring(2, 6),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=AuraGuest`,
      bio: 'Walking in the Light with Aura.',
      status: 'online',
      followersCount: 0,
      followingCount: 0,
      isVerified: true,
      joinedAt: new Date().toISOString(),
      authProvider: 'guest'
    };
    setUserAndCache(localGuest);
    return { success: true };
  };

  const loginAsAdminTex = async () => {
    const texProfile: UserProfile = {
      id: 'tex_admin_primary',
      name: 'Tex',
      email: 'lightsouttattootex@gmail.com',
      handle: 'tex',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=TexAdminAura',
      bio: 'Aura Founder & Administrator. Sanctuary architect.',
      status: 'online',
      statusMessage: 'Building the Kingdom in the Matrix',
      followersCount: 777,
      followingCount: 12,
      isVerified: true,
      joinedAt: new Date().toISOString(),
      authProvider: 'google'
    };
    setUserAndCache(texProfile);
    return { success: true };
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncFirebaseUserToDb(result.user, { authProvider: 'google' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signInWithFacebook = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      await syncFirebaseUserToDb(result.user, { authProvider: 'facebook' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signInWithGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      await syncFirebaseUserToDb(result.user, { authProvider: 'github' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No authenticated user.' };
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const setupRecaptcha = (containerId: string) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
      });
    }
  };

  const sendPhoneCode = async (phoneNumber: string) => {
    try {
      if (!window.recaptchaVerifier) throw new Error("Recaptcha not initialized");
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const verifyPhoneCode = async (code: string) => {
    if (!confirmationResult) return { success: false, error: 'No confirmation result found' };
    try {
      const result = await confirmationResult.confirm(code);
      await syncFirebaseUserToDb(result.user, { authProvider: 'phone' });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    setUserAndCache(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.id);
    try {
      await updateDoc(userDocRef, updates);
    } catch (e) {
      console.warn('Firestore updateDoc warning:', e);
    }
    setUserAndCache({ ...user, ...updates });
  };

  const setUserStatus = async (status: UserStatus, statusMessage?: string) => {
    await updateProfile({ status, statusMessage });
  };

  const getUserById = (id: string) => allUsers.find(u => u.id === id);

  const followUser = async (targetUserId: string) => {
    if (!user) return false;
    const isFollowing = user.followingUserIds?.includes(targetUserId);
    const newFollowing = isFollowing
      ? (user.followingUserIds || []).filter((id) => id !== targetUserId)
      : [...(user.followingUserIds || []), targetUserId];

    try {
      const userRef = doc(db, 'users', user.id);
      const targetUserRef = doc(db, 'users', targetUserId);
      
      // Update current user
      await updateDoc(userRef, {
        followingUserIds: isFollowing ? arrayRemove(targetUserId) : arrayUnion(targetUserId)
      });
      
      // Get target user to update their followers count
      const targetDoc = await getDoc(targetUserRef);
      if (targetDoc.exists()) {
        const targetData = targetDoc.data();
        const currentFollowers = targetData.followersCount || 0;
        await updateDoc(targetUserRef, {
          followersCount: isFollowing ? Math.max(0, currentFollowers - 1) : currentFollowers + 1
        });
      }

      setUserAndCache({ ...user, followingUserIds: newFollowing });
      return true;
    } catch (e) {
      console.error('Error following user:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, allUsers, isAuthModalOpen, setIsAuthModalOpen, openAuthModal,
      loginWithEmail, registerWithEmail, loginAsGuest, loginAsAdminTex, logout,
      signInWithGoogle, signInWithFacebook, signInWithGithub,
      sendVerificationEmail, resetPassword,
      setupRecaptcha, sendPhoneCode, verifyPhoneCode,
      updateProfile, setUserStatus, getUserById, followUser,
      isOnline, isServerConnected
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
