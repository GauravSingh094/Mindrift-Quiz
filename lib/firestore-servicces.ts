// lib/firestore-service.ts
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from './firebase'; // assumes firebase.ts exports initialized app

const db = getFirestore(app);

// Fetch a specific quiz by ID
export async function getQuizById(id: string) {
  const quizRef = doc(db, 'quizzes', id);
  const quizSnap = await getDoc(quizRef);
  return quizSnap.exists() ? { id: quizSnap.id, ...quizSnap.data() } : null;
}

// Fetch a quiz by code (used in join flows)
export async function getQuizByCode(code: string) {
  const q = query(collection(db, 'quizzes'), where('code', '==', code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

// Fetch all quizzes (e.g., admin dashboard or explore page)
export async function getAllQuizzes() {
  const snapshot = await getDocs(collection(db, 'quizzes'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Fetch competition data by code (if you have a competitions collection)
export async function getCompetitionByCode(code: string) {
  const q = query(collection(db, 'competitions'), where('code', '==', code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}
