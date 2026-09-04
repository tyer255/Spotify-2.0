import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider, signOut, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  sendEmailVerification, setPersistence, browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true }, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async (forceSelectAccount = false, loginHint?: string) => {
  const provider = new GoogleAuthProvider();
  if (forceSelectAccount) {
    provider.setCustomParameters({ prompt: 'select_account' });
  } else if (loginHint) {
    provider.setCustomParameters({ login_hint: loginHint });
  }
  return await signInWithPopup(auth, provider);
};

export const logout = async () => {
  await signOut(auth);
};

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connected successfully");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
