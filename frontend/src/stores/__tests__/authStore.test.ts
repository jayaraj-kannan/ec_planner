import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as firebaseAuth from 'firebase/auth';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(() => ({})),
    GoogleAuthProvider: class {
      setCustomParameters = vi.fn();
    },
    signInWithPopup: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    onAuthStateChanged: vi.fn(),
  };
});

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      commit: vi.fn(),
    })),
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
  };
});

import {
  authState,
  authActions,
  syncUserProfile,
} from '../authStore';

describe('authStore Unit Tests', () => {
  beforeEach(() => {
    authState.user = null;
    authState.profile = null;
    authState.isLoading = false;
    authState.isAuthModalOpen = false;
    authState.authMode = 'signin';
    authState.error = null;
    vi.clearAllMocks();
  });

  describe('Modal Navigation State Actions', () => {
    it('opens auth modal with default or specified mode and clears error', () => {
      authState.error = 'Old error';
      authActions.openAuthModal('signup');
      expect(authState.isAuthModalOpen).toBe(true);
      expect(authState.authMode).toBe('signup');
      expect(authState.error).toBeNull();

      authActions.openAuthModal();
      expect(authState.authMode).toBe('signin');
    });

    it('closes auth modal and clears error', () => {
      authState.isAuthModalOpen = true;
      authState.error = 'Some error';
      authActions.closeAuthModal();
      expect(authState.isAuthModalOpen).toBe(false);
      expect(authState.error).toBeNull();
    });

    it('sets auth mode and clears error', () => {
      authState.error = 'Error';
      authActions.setAuthMode('signup');
      expect(authState.authMode).toBe('signup');
      expect(authState.error).toBeNull();
    });
  });

  describe('syncUserProfile', () => {
    it('constructs user profile and saves to Firestore users collection', async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined as any);

      const fakeUser: any = {
        uid: 'user-abc',
        email: 'alex@example.com',
        displayName: 'Alex Rivers',
        photoURL: 'https://example.com/avatar.jpg',
        providerData: [{ providerId: 'google.com' }],
      };

      await syncUserProfile(fakeUser);

      expect(authState.profile).toEqual({
        uid: 'user-abc',
        email: 'alex@example.com',
        displayName: 'Alex Rivers',
        photoURL: 'https://example.com/avatar.jpg',
        provider: 'google.com',
      });
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('handles sync errors gracefully without throwing', async () => {
      vi.mocked(firestore.setDoc).mockRejectedValue(new Error('Network offline'));
      const fakeUser: any = {
        uid: 'user-xyz',
        email: 'test@example.com',
      };
      await expect(syncUserProfile(fakeUser)).resolves.not.toThrow();
    });
  });

  describe('signInWithGoogle', () => {
    it('signs in with popup, syncs profile, and closes modal on success', async () => {
      const fakeUser: any = {
        uid: 'google-uid-1',
        email: 'guser@example.com',
        displayName: 'Google User',
      };
      vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValue({
        user: fakeUser,
      } as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined as any);

      authState.isAuthModalOpen = true;
      const user = await authActions.signInWithGoogle();

      expect(user).toBe(fakeUser);
      expect(authState.user).toEqual(fakeUser);
      expect(authState.isAuthModalOpen).toBe(false);
      expect(authState.isLoading).toBe(false);
    });

    it('sets error and throws when signInWithPopup fails', async () => {
      vi.mocked(firebaseAuth.signInWithPopup).mockRejectedValue(new Error('Popup blocked by browser'));

      await expect(authActions.signInWithGoogle()).rejects.toThrow('Popup blocked by browser');
      expect(authState.error).toContain('Popup blocked');
      expect(authState.isLoading).toBe(false);
    });
  });

  describe('signInWithEmailPassword', () => {
    it('signs in with email and password and syncs profile', async () => {
      const fakeUser: any = {
        uid: 'email-uid-1',
        email: 'member@test.com',
      };
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValue({
        user: fakeUser,
      } as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined as any);

      authState.isAuthModalOpen = true;
      const user = await authActions.signInWithEmailPassword('member@test.com', 'Pass1234');

      expect(user).toBe(fakeUser);
      expect(authState.user).toEqual(fakeUser);
      expect(authState.isAuthModalOpen).toBe(false);
      expect(authState.isLoading).toBe(false);
    });

    it('translates various error codes to helpful messages', async () => {
      // invalid-credential
      const err1: any = new Error('Auth error');
      err1.code = 'auth/invalid-credential';
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValueOnce(err1);
      await expect(authActions.signInWithEmailPassword('a@b.com', '123')).rejects.toBeDefined();
      expect(authState.error).toContain('Invalid email or password');

      // user-not-found
      const err2: any = new Error('Auth error');
      err2.code = 'auth/user-not-found';
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValueOnce(err2);
      await expect(authActions.signInWithEmailPassword('a@b.com', '123')).rejects.toBeDefined();
      expect(authState.error).toContain('No account found');

      // invalid-email
      const err3: any = new Error('Auth error');
      err3.code = 'auth/invalid-email';
      vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockRejectedValueOnce(err3);
      await expect(authActions.signInWithEmailPassword('a@b.com', '123')).rejects.toBeDefined();
      expect(authState.error).toContain('valid email address');
    });
  });

  describe('signUpWithEmailPassword', () => {
    it('creates user with email, sets display name, and syncs profile', async () => {
      const fakeUser: any = {
        uid: 'new-uid-1',
        email: 'fresh@test.com',
      };
      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValue({
        user: fakeUser,
      } as any);
      vi.mocked(firebaseAuth.updateProfile).mockResolvedValue(undefined as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined as any);

      const user = await authActions.signUpWithEmailPassword('fresh@test.com', 'Pass1234', 'Fresh Host');
      expect(user).toBe(fakeUser);
      expect(firebaseAuth.updateProfile).toHaveBeenCalledWith(fakeUser, { displayName: 'Fresh Host' });
      expect(authState.user).toEqual(fakeUser);
      expect(authState.isLoading).toBe(false);
    });

    it('translates signup error codes properly', async () => {
      const err1: any = new Error('Auth error');
      err1.code = 'auth/email-already-in-use';
      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockRejectedValueOnce(err1);
      await expect(authActions.signUpWithEmailPassword('a@b.com', '123', '')).rejects.toBeDefined();
      expect(authState.error).toContain('already registered');

      const err2: any = new Error('Auth error');
      err2.code = 'auth/weak-password';
      vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockRejectedValueOnce(err2);
      await expect(authActions.signUpWithEmailPassword('a@b.com', '123', '')).rejects.toBeDefined();
      expect(authState.error).toContain('at least 6 characters');
    });
  });

  describe('logout', () => {
    it('signs out and resets user and profile', async () => {
      authState.user = { uid: 'u1' } as any;
      authState.profile = { uid: 'u1' } as any;
      vi.mocked(firebaseAuth.signOut).mockResolvedValue(undefined as any);

      await authActions.logout();

      expect(firebaseAuth.signOut).toHaveBeenCalled();
      expect(authState.user).toBeNull();
      expect(authState.profile).toBeNull();
      expect(authState.isLoading).toBe(false);
    });

    it('handles signout errors gracefully', async () => {
      vi.mocked(firebaseAuth.signOut).mockRejectedValue(new Error('Sign out error'));
      await expect(authActions.logout()).resolves.not.toThrow();
      expect(authState.isLoading).toBe(false);
    });
  });
});
