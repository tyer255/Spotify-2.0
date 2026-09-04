import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

async function test() {
    try {
        const key = JSON.parse(fs.readFileSync('./service-account.json', 'utf8'));
        const app = initializeApp({ credential: cert(key) });
        const db = getFirestore(app);
        
        const canvasRef = db.collection('canvases'); // Or maybe tracks?
        const snapshot = await canvasRef.limit(5).get();
        if (snapshot.empty) {
            console.log("No documents in 'canvases' collection.");
        }
        snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
        });
        
        const trackRef = db.collection('tracks');
        const trackSnap = await trackRef.limit(5).get();
        if (trackSnap.empty) {
            console.log("No documents in 'tracks' collection.");
        }
        trackSnap.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
        });
        
    } catch(e) { console.error(e); }
}
test();
