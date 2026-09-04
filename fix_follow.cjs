const fs = require('fs');
let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

code = code.replace(
  /if \(wasFollowed\) \{\n\s*if \(existingKey\) \{\n\s*newSet\.delete\(existingKey\);\n\s*delete newMap\[existingKey\];\n\s*\}\n\s*newSet\.delete\(artistId\);\n\s*if \(newMap\[artistId\]\) \{\n\s*delete newMap\[artistId\];\n\s*\}\n\s*showToast\(\`Unfollowed \$\{artistName\}\`\);\n\s*\} else \{\n\s*newSet\.add\(artistId\);\n\s*newMap\[artistId\] = \{[\s\S]*?\}\;\n\s*showToast\(\`Following \$\{artistName\}\`\);\n\s*\}/,
  `if (wasFollowed) {
      if (existingKey) {
        newSet.delete(existingKey);
        delete newMap[existingKey];
      }
      newSet.delete(artistId);
      if (newMap[artistId]) {
        delete newMap[artistId];
      }
      
      if (auth.currentUser) {
        deleteDoc(doc(db, 'users', auth.currentUser.uid, 'followedArtists', existingKey || artistId)).catch(() => {});
      }
      showToast(\`Unfollowed \${artistName}\`);
    } else {
      newSet.add(artistId);
      const newArtist = {
        id: artistId,
        name: artistName,
        image: (artistInput as any).image || '',
        headerImage: (artistInput as any).headerImage,
        followers: (artistInput as any).followers || 0,
        monthlyListeners: (artistInput as any).monthlyListeners || 0,
        genres: (artistInput as any).genres || ['Pop'],
        bio: (artistInput as any).bio || '',
        verified: (artistInput as any).verified ?? true,
        topTracks: (artistInput as any).topTracks || [],
        albums: (artistInput as any).albums || [],
        singles: (artistInput as any).singles || [],
      };
      newMap[artistId] = newArtist;
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid, 'followedArtists', artistId), {
          artistId,
          artistData: newArtist,
          createdAt: new Date().toISOString()
        }).catch(() => {});
      }
      showToast(\`Following \${artistName}\`);
    }`
);

fs.writeFileSync('src/context/UserContext.tsx', code);
