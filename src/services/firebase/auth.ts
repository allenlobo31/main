import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import { auth } from './config';
import { db, userDoc, setDoc, serverTimestamp } from './firestore';
import { UserRole } from '../../types';
import { getDoc } from 'firebase/firestore';

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerUser(params: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}): Promise<FirebaseUser> {
  const { email, password, name, role } = params;
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { user } = credential;

  await updateProfile(user, { displayName: name });

  // Create the Firestore user document
  const baseDoc = {
    uid: user.uid,
    role,
    name,
    email: user.email ?? email,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    createdAt: serverTimestamp(),
  };

  const userRef = userDoc(user.uid);

  if (role === 'patient') {
    await setDoc(userRef as never, {
      ...baseDoc,
      linkedDoctorId: null,
    });
  } else {
    await setDoc(userRef as never, {
      ...baseDoc,
      linkedPatientIds: [],
    });
  }

  return user;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<FirebaseUser> {
  const { email, password } = params;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// ─── Auth State Listener ──────────────────────────────────────────────────────

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback);
}

// ─── Fetch User Role ──────────────────────────────────────────────────────────

export async function fetchUserRole(uid: string): Promise<UserRole | null> {
  try {
    const snap = await getDoc(userDoc(uid));
    if (!snap.exists()) return null;
    return snap.data()?.role ?? null;
  } catch {
    return null;
  }
}

// ─── Error Parser ─────────────────────────────────────────────────────────────

export function parseAuthError(error: AuthError): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
