const fs = require('fs');
let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

const migrationCode = `
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        // --- DATA MIGRATION FROM LOCALSTORAGE TO FIRESTORE ---
        let hasMigratedLocalData = false;
        try {
          if (localStorage.getItem('spotify_migrated_to_firestore') !== 'true') {
            const batch = writeBatch(db);
            let needsCommit = false;
            
            // Migrate recent history & stats
            let historyToSave = [];
            let statsToSave = { trackPlays: {}, artistPlays: {}, searchSelections: {}, skips: {}, replays: {}, trackCache: {} };
            
            try {
              const localHistory = localStorage.getItem('spotify_recent_history');
              if (localHistory) historyToSave = JSON.parse(localHistory);
            } catch(e) {}
            
            try {
              const localStats = localStorage.getItem('spotify_interaction_stats');
              if (localStats) statsToSave = JSON.parse(localStats);
            } catch(e) {}
            
            // Update or Create the main user doc
            batch.set(userRef, {
              id: user.uid,
              name: userSnap.exists() ? userSnap.data().name : (user.displayName || localStorage.getItem('spotify_guest_name') || 'Your Name'),
              email: userSnap.exists() ? userSnap.data().email : (user.email || ''),
              avatar: userSnap.exists() ? userSnap.data().avatar : (user.photoURL || localStorage.getItem('spotify_guest_avatar') || ''),
              recentHistory: userSnap.exists() && userSnap.data().recentHistory?.length ? userSnap.data().recentHistory : historyToSave,
              interactionStats: userSnap.exists() && Object.keys(userSnap.data().interactionStats?.trackPlays || {}).length ? userSnap.data().interactionStats : statsToSave,
              createdAt: userSnap.exists() ? userSnap.data().createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
            needsCommit = true;

            // Migrate Liked Tracks
            try {
              const localLikedData = localStorage.getItem('spotify_liked_tracks_data');
              if (localLikedData) {
                const parsedLikedData = JSON.parse(localLikedData);
                for (const trackId of Object.keys(parsedLikedData)) {
                  const trackRef = doc(db, 'users', user.uid, 'likedTracks', trackId);
                  batch.set(trackRef, { trackId, trackData: parsedLikedData[trackId], createdAt: new Date().toISOString() }, { merge: true });
                  needsCommit = true;
                }
              }
            } catch(e) {}

            // Migrate Followed Artists
            try {
              const localFollowedData = localStorage.getItem('spotify_followed_artists_data');
              if (localFollowedData) {
                const parsedFollowedData = JSON.parse(localFollowedData);
                for (const artistId of Object.keys(parsedFollowedData)) {
                  const artistRef = doc(db, 'users', user.uid, 'followedArtists', artistId);
                  batch.set(artistRef, { artistId, artistData: parsedFollowedData[artistId], createdAt: new Date().toISOString() }, { merge: true });
                  needsCommit = true;
                }
              }
            } catch(e) {}

            // Migrate Downloads
            try {
              const localDownloadsData = localStorage.getItem('spotify_offline_tracks');
              if (localDownloadsData) {
                const parsedDownloadsData = JSON.parse(localDownloadsData);
                for (const trackId of Object.keys(parsedDownloadsData)) {
                  const downloadRef = doc(db, 'users', user.uid, 'downloads', trackId);
                  batch.set(downloadRef, { trackId, trackData: parsedDownloadsData[trackId], createdAt: new Date().toISOString() }, { merge: true });
                  needsCommit = true;
                }
              }
            } catch(e) {}

            // Migrate Playlists
            try {
              const localPlaylists = localStorage.getItem('spotify_user_playlists');
              if (localPlaylists) {
                const parsedPlaylists = JSON.parse(localPlaylists);
                for (const pl of parsedPlaylists) {
                  // Only migrate playlists that this user owns
                  if (pl.id) {
                    const plRef = doc(db, 'playlists', pl.id);
                    batch.set(plRef, pl, { merge: true });
                    needsCommit = true;
                  }
                }
              }
            } catch(e) {}
            
            if (needsCommit) {
              await batch.commit();
            }
            
            // Mark as migrated so we don't do this expensive batch write again
            localStorage.setItem('spotify_migrated_to_firestore', 'true');
            hasMigratedLocalData = true;
          }
        } catch(e) {
          console.warn('Error during data migration:', e);
        }

        // If it still doesn't exist (and we didn't migrate because flag was true but doc was missing somehow)
        if (!userSnap.exists() && !hasMigratedLocalData) {
          await setDoc(userRef, {
            id: user.uid,
            name: user.displayName || 'Your Name',
            email: user.email || '',
            avatar: user.photoURL || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        // --- END MIGRATION ---
`;

// Replace the old code segment
code = code.replace(
  /const userRef = doc\(db, 'users', user\.uid\);\n\s*const userSnap = await getDoc\(userRef\);\n\s*if \(\!userSnap\.exists\(\)\) \{\n\s*await setDoc\(userRef, \{\n\s*id: user\.uid,\n\s*name: user\.displayName \|\| 'Your Name',\n\s*email: user\.email \|\| '',\n\s*avatar: user\.photoURL \|\| '',\n\s*createdAt: new Date\(\)\.toISOString\(\),\n\s*updatedAt: new Date\(\)\.toISOString\(\)\n\s*\}\);\n\s*\}/,
  migrationCode
);

// We also need to import writeBatch from firebase/firestore
if (!code.includes('writeBatch')) {
  code = code.replace(/import \{([\s\S]*?)onSnapshot([\s\S]*?)\} from 'firebase\/firestore';/, "import {$1onSnapshot, writeBatch$2} from 'firebase/firestore';");
}

fs.writeFileSync('src/context/UserContext.tsx', code);
