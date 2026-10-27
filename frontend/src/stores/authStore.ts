import { reactive } from 'vue';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  authMode: 'signin' | 'signup';
}

export const authState = reactive<AuthState>({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  isAuthModalOpen: false,
  authMode: 'signin',
});

// Sync user profile to Firestore users/{uid} collection
export async function syncUserProfile(user: User, providerOverride?: string) {
  try {
    const provider = providerOverride || user.providerData?.[0]?.providerId || 'password';
    const profileData: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Planner Host',
      photoURL: user.photoURL,
      provider,
    };

    authState.profile = profileData;

    // Persist document to Firestore users/{uid}
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        ...profileData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore sync user profile warning (offline or test fallback):', err);
  }
}

let onUserLoginCallback: ((userId: string) => Promise<void>) | null = null;
let onUserLogoutCallback: (() => void) | null = null;

export function registerAuthSyncHooks(
  onLogin: (userId: string) => Promise<void>,
  onLogout: () => void
) {
  onUserLoginCallback = onLogin;
  onUserLogoutCallback = onLogout;
}

export const authActions = {
  openAuthModal(mode: 'signin' | 'signup' = 'signin') {
    authState.authMode = mode;
    authState.error = null;
    authState.isAuthModalOpen = true;
  },

  closeAuthModal() {
    authState.isAuthModalOpen = false;
    authState.error = null;
  },

  setAuthMode(mode: 'signin' | 'signup') {
    authState.authMode = mode;
    authState.error = null;
  },

  async signInWithGoogle() {
    authState.isLoading = true;
    authState.error = null;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      authState.user = result.user;
      await syncUserProfile(result.user, 'google');
      if (onUserLoginCallback) {
        await onUserLoginCallback(result.user.uid);
      }
      authState.isAuthModalOpen = false;
      return result.user;
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      authState.error = err.message || 'Failed to sign in with Google. Please try again.';
      throw err;
    } finally {
      authState.isLoading = false;
    }
  },

  async signInWithEmailPassword(email: string, pass: string) {
    authState.isLoading = true;
    authState.error = null;
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      authState.user = result.user;
      await syncUserProfile(result.user, 'password');
      if (onUserLoginCallback) {
        await onUserLoginCallback(result.user.uid);
      }
      authState.isAuthModalOpen = false;
      return result.user;
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      let msg = err.message || 'Invalid email or password.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please verify and try again.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email. Please sign up.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      authState.error = msg;
      throw err;
    } finally {
      authState.isLoading = false;
    }
  },

  async signUpWithEmailPassword(email: string, pass: string, name: string) {
    authState.isLoading = true;
    authState.error = null;
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (name.trim()) {
        try {
          await updateProfile(result.user, { displayName: name.trim() });
        } catch {
          // non-blocking
        }
      }
      authState.user = result.user;
      await syncUserProfile(result.user, 'password');
      if (onUserLoginCallback) {
        await onUserLoginCallback(result.user.uid);
      }
      authState.isAuthModalOpen = false;
      return result.user;
    } catch (err: any) {
      console.error('Email Sign-Up Error:', err);
      let msg = err.message || 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      }
      authState.error = msg;
      throw err;
    } finally {
      authState.isLoading = false;
    }
  },

  async logout() {
    authState.isLoading = true;
    try {
      await signOut(auth);
      authState.user = null;
      authState.profile = null;
      if (onUserLogoutCallback) {
        onUserLogoutCallback();
      }
    } catch (err: any) {
      console.error('Sign-out error:', err);
    } finally {
      authState.isLoading = false;
    }
  },
};

// Initialize Auth Listener
try {
  onAuthStateChanged(auth, async (user) => {
    authState.user = user;
    if (user) {
      await syncUserProfile(user);
      if (onUserLoginCallback) {
        await onUserLoginCallback(user.uid);
      }
    } else {
      authState.profile = null;
      if (onUserLogoutCallback) {
        onUserLogoutCallback();
      }
    }
    authState.isInitialized = true;
  });
} catch (e) {
  authState.isInitialized = true;
}
