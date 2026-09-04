const fs = require('fs');

let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

// Update addTrackToHistory
code = code.replace(
  /const addTrackToHistory = useCallback\(\(track: Track\) => \{[\s\S]*?\}, \[profile\]\);/,
  `const addTrackToHistory = useCallback((track: Track) => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return prev;
      const filtered = prev.recentHistory.filter((h) => h.track.id !== track.id);
      const newHistory = [
        { track, playedAt: new Date().toISOString() },
        ...filtered
      ].slice(0, 30);
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { recentHistory: newHistory, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } else {
        try {
          localStorage.setItem('spotify_recent_history', JSON.stringify(newHistory));
        } catch (e) {}
      }
      return { ...prev, recentHistory: newHistory };
    });
  }, [profile]);`
);

// Update removeTrackFromHistory
code = code.replace(
  /const removeTrackFromHistory = useCallback\(\(trackId: string\) => \{[\s\S]*?\}, \[showToast\]\);/,
  `const removeTrackFromHistory = useCallback((trackId: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const targetItem = prev.recentHistory.find((h) => h.track.id === trackId);
      const newHistory = prev.recentHistory.filter((h) => h.track.id !== trackId);
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { recentHistory: newHistory, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } else {
        try {
          localStorage.setItem('spotify_recent_history', JSON.stringify(newHistory));
        } catch (e) {}
      }
      
      if (targetItem) {
        showToast(\`Removed "\${targetItem.track.title}" from recent history\`);
      } else {
        showToast(\`Removed from recent history\`);
      }
      return { ...prev, recentHistory: newHistory };
    });
  }, [showToast]);`
);

// Update recordInteraction
code = code.replace(
  /const recordInteraction = useCallback\(\(type: 'play'[\s\S]*?\}, \[\]\);/,
  `const recordInteraction = useCallback((type: 'play' | 'skip' | 'replay' | 'search_selection', trackId: string, artistName?: string, query?: string, track?: Track) => {
    setProfile(prev => {
      if (!prev) return prev;
      
      const newStats = { 
        trackPlays: {}, 
        artistPlays: {}, 
        searchSelections: {}, 
        skips: {}, 
        replays: {},
        trackCache: {},
        ...(prev.interactionStats || {}) 
      };
      
      if (track) {
        newStats.trackCache = { ...newStats.trackCache, [trackId]: track };
      }

      if (type === 'play') {
        newStats.trackPlays = { ...newStats.trackPlays, [trackId]: (newStats.trackPlays[trackId] || 0) + 1 };
        if (artistName) {
          newStats.artistPlays = { ...newStats.artistPlays, [artistName]: (newStats.artistPlays[artistName] || 0) + 1 };
        }
      } else if (type === 'search_selection' && query) {
        const q = query.toLowerCase().trim();
        newStats.searchSelections = { ...newStats.searchSelections };
        newStats.searchSelections[q] = { ...(newStats.searchSelections[q] || {}) };
        newStats.searchSelections[q][trackId] = (newStats.searchSelections[q][trackId] || 0) + 1;
      } else if (type === 'skip') {
        newStats.skips = { ...newStats.skips, [trackId]: (newStats.skips[trackId] || 0) + 1 };
      } else if (type === 'replay') {
        newStats.replays = { ...newStats.replays, [trackId]: (newStats.replays[trackId] || 0) + 1 };
      }

      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { interactionStats: newStats, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } else {
        try {
          localStorage.setItem('spotify_interaction_stats', JSON.stringify(newStats));
        } catch (e) {}
      }

      return { ...prev, interactionStats: newStats };
    });
  }, []);`
);

// We need to rewrite Playlist logic to use Firestore when auth.currentUser is available
// 1. createPlaylist
code = code.replace(
  /const createPlaylist = async \(title: string[\s\S]*?return newPl;\n  \};/,
  `const createPlaylist = async (title: string, description?: string, coverImage?: string): Promise<Playlist | null> => {
    const newId = \`user-pl-\${Date.now()}\`;
    const cleanTitle = title.trim() || \`My Playlist #\${playlists.length + 1}\`;
    const newPl: Playlist = {
      id: newId,
      title: cleanTitle,
      description: description ? String(description).trim() : 'Custom playlist created on Spotify 2.0',
      coverImage: coverImage || '',
      userId: profile?.id || 'guest-user',
      isPublic: true,
      tracks: [], // ALWAYS completely empty
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      likesCount: 0,
      color: '#10B981',
    };

    setPlaylists((prev) => [newPl, ...prev]);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playlists', newId), newPl);
      } catch(e) {}
    } else {
      try {
        localStorage.setItem('spotify_user_playlists', JSON.stringify([newPl, ...playlists]));
      } catch (e) {}
    }

    // Call API as well if it does other server-side stuff, though local state or firebase takes over
    try {
      await api.createPlaylist(newPl.title, newPl.description, newPl.coverImage, newId);
    } catch(e) {}

    return newPl;
  };`
);

// 2. updatePlaylist
code = code.replace(
  /const updatePlaylist = async \(id: string[\s\S]*?return true;\n  \};/,
  `const updatePlaylist = async (id: string, updates: { title?: string; description?: string; coverImage?: string }): Promise<boolean> => {
    let updatedPl: Playlist | null = null;
    setPlaylists((prev) => {
      const nextList = prev.map((p) => {
        if (p.id === id) {
          updatedPl = {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return updatedPl;
        }
        return p;
      });
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser && updatedPl) {
      try {
        await setDoc(doc(db, 'playlists', id), updatedPl, { merge: true });
      } catch(e) {}
    }

    showToast(\`Playlist updated\`);
    try {
      await api.updatePlaylist(id, updates);
    } catch (e) {}
    return true;
  };`
);

// 3. deletePlaylist
code = code.replace(
  /const deletePlaylist = async \(id: string[\s\S]*?return true;\n  \};/,
  `const deletePlaylist = async (id: string): Promise<boolean> => {
    setPlaylists((prev) => {
      const nextList = prev.filter((p) => p.id !== id);
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'playlists', id));
      } catch(e) {}
    }

    showToast(\`Playlist deleted\`);
    try {
      await api.deletePlaylist(id);
    } catch (e) {}
    return true;
  };`
);

// 4. addTrackToPlaylist
code = code.replace(
  /const addTrackToPlaylist = async \(playlistId: string, track: Track\)[\s\S]*?return true;\n  \};/,
  `const addTrackToPlaylist = async (playlistId: string, track: Track): Promise<boolean> => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return false;

    if (pl.tracks.some((t) => t.id === track.id)) {
      showToast(\`"\${track.title}" is already in this playlist\`);
      return false;
    }

    const updatedPl: Playlist = {
      ...pl,
      tracks: [...pl.tracks, track],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setPlaylists((prev) => {
      const nextList = prev.map((p) => (p.id === playlistId ? updatedPl : p));
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playlists', playlistId), updatedPl, { merge: true });
      } catch(e) {}
    }

    recordInteraction('play', track.id, track.artist, undefined, track);
    showToast(\`Added "\${track.title}" to "\${pl.title}"\`);

    try {
      await api.addTrackToPlaylist(playlistId, track.id, track);
    } catch (e) {}
    return true;
  };`
);

// 5. removeTrackFromPlaylist
code = code.replace(
  /const removeTrackFromPlaylist = async \(playlistId: string, trackId: string\)[\s\S]*?return true;\n  \};/,
  `const removeTrackFromPlaylist = async (playlistId: string, trackId: string): Promise<boolean> => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return false;

    const updatedPl: Playlist = {
      ...pl,
      tracks: pl.tracks.filter((t) => t.id !== trackId),
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setPlaylists((prev) => {
      const nextList = prev.map((p) => (p.id === playlistId ? updatedPl : p));
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playlists', playlistId), updatedPl, { merge: true });
      } catch(e) {}
    }

    showToast(\`Removed from "\${pl.title}"\`);

    try {
      await api.removeTrackFromPlaylist(playlistId, trackId);
    } catch (e) {}
    return true;
  };`
);

// 6. reorderPlaylist
code = code.replace(
  /const reorderPlaylist = async \(playlistId: string, trackIds: string\[\]\)[\s\S]*?return true;\n  \};/,
  `const reorderPlaylist = async (playlistId: string, trackIds: string[]): Promise<boolean> => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return false;

    const trackMap = new Map(pl.tracks.map((t) => [t.id, t]));
    const newTracks: Track[] = [];
    
    trackIds.forEach((id) => {
      const t = trackMap.get(id);
      if (t) newTracks.push(t);
    });

    const updatedPl: Playlist = {
      ...pl,
      tracks: newTracks,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setPlaylists((prev) => {
      const nextList = prev.map((p) => (p.id === playlistId ? updatedPl : p));
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playlists', playlistId), updatedPl, { merge: true });
      } catch(e) {}
    }

    try {
      await api.reorderPlaylist(playlistId, trackIds);
    } catch (e) {}
    return true;
  };`
);

fs.writeFileSync('src/context/UserContext.tsx', code);
