const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const newRule = `
    match /music_events/{eventId} {
      allow read: if true; // Backend needs to read this to calculate ranking
      allow create: if true; // Any client can log events
      allow update, delete: if false;
    }
`;

rules = rules.replace(/  \}\n\}/, newRule + "\n  }\n}");
fs.writeFileSync('firestore.rules', rules);
