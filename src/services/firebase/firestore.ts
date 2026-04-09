import {
  getFirestore,
  FirestoreDataConverter,
  DocumentData,
  WithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  runTransaction,
  serverTimestamp,
  FieldValue,
  increment,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { app } from './config';
import {
  User,
  GamificationProfile,
  SymptomEntry,
  DiaryEntry,
  Report,
  Expert,
  Consultation,
  AIInsight,
} from '../../types';

// ─── Initialize Firestore with offline persistence ────────────────────────────

const db = getFirestore(app);

export { db };

// ─── Typed Converters ─────────────────────────────────────────────────────────

function makeConverter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: WithFieldValue<T>): DocumentData {
      return data as DocumentData;
    },
    fromFirestore(
      snap: QueryDocumentSnapshot,
      options: SnapshotOptions,
    ): T {
      return snap.data(options) as T;
    },
  };
}

export const converters = {
  user: makeConverter<User>(),
  gamification: makeConverter<GamificationProfile>(),
  symptom: makeConverter<SymptomEntry>(),
  diary: makeConverter<DiaryEntry>(),
  report: makeConverter<Report>(),
  expert: makeConverter<Expert>(),
  consultation: makeConverter<Consultation>(),
  aiInsight: makeConverter<AIInsight>(),
};

// ─── Collection Refs ──────────────────────────────────────────────────────────

export const usersCol = () => collection(db, 'users').withConverter(converters.user);
export const userDoc = (uid: string) => doc(db, 'users', uid).withConverter(converters.user);
export const gamificationDoc = (uid: string) =>
  doc(db, 'users', uid, 'gamification', 'profile').withConverter(converters.gamification);
export const symptomsCol = (uid: string) =>
  collection(db, 'users', uid, 'symptoms').withConverter(converters.symptom);
export const diaryCol = (uid: string) =>
  collection(db, 'users', uid, 'diary').withConverter(converters.diary);
export const reportsCol = (uid: string) =>
  collection(db, 'users', uid, 'reports').withConverter(converters.report);
export const expertsCol = () => collection(db, 'experts').withConverter(converters.expert);
export const consultationsCol = () =>
  collection(db, 'consultations').withConverter(converters.consultation);
export const aiInsightDoc = (uid: string, date: string) =>
  doc(db, 'aiInsights', uid, 'daily', date).withConverter(converters.aiInsight);

// ─── Re-exports for convenience ───────────────────────────────────────────────

export {
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  runTransaction,
  serverTimestamp,
  FieldValue,
  increment,
  arrayUnion,
  Timestamp,
};
