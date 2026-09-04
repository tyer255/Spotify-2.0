const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('./firebase-applet-config.json');

admin.initializeApp({
  projectId: config.projectId,
});

const db = getFirestore();
if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
    db.settings({ databaseId: config.firestoreDatabaseId });
}

db.collection('test').limit(1).get().then(() => {
  console.log("Success");
  process.exit(0);
}).catch(err => {
  console.error("Error", err);
  process.exit(1);
});
