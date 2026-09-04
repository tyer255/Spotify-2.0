import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig, "server-app");
export const serverDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { collection, getDocs, addDoc, query, where, orderBy, limit, Timestamp };
