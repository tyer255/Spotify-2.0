import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# 1. Add RecentSearchItem interface
interface_code = """
export interface RecentSearchItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: string;
}
"""

content = content.replace("interface SearchViewProps {", interface_code + "\ninterface SearchViewProps {")

# 2. Update recentSearches state
state_code = """
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    try {
      const saved = localStorage.getItem('spotify_recent_items_v2');
      if (saved) {
        return JSON.parse(saved);
      }
      // Migrate old string searches if needed, or just return empty
      return [];
    } catch {
      return [];
    }
  });

  const saveRecentSearches = useCallback((items: RecentSearchItem[]) => {
    setRecentSearches(items);
    try {
      localStorage.setItem('spotify_recent_items_v2', JSON.stringify(items));
    } catch (e) {}
  }, []);

  const addRecentItem = useCallback((item: RecentSearchItem) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.id !== item.id);
      const updated = [item, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('spotify_recent_items_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);
"""

content = re.sub(
    r"const \[recentSearches, setRecentSearches\] = useState<string\[\]>\(\(\) => \{.*?\}\);",
    state_code.strip(),
    content,
    flags=re.DOTALL
)

# 3. Remove addRecentSearch(query: string) and saveRecentSearches(searches: string[]) definitions
content = re.sub(
    r"const saveRecentSearches = useCallback\(\(searches: string\[\]\) => \{.*?\}, \[\]\);",
    "",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"const addRecentSearch = useCallback\(\(query: string\) => \{.*?\}, \[\]\);",
    "",
    content,
    flags=re.DOTALL
)

# 4. In executeFullSearch, remove addRecentSearch(cleanQ) and instead add the topResult to recent items
content = content.replace("addRecentSearch(cleanQ);", "/* addRecentSearch removed */")

top_result_logic = """
            if (ranked.topResult) {
              let title = '';
              let subtitle = '';
              let image = '';
              let typeLabel = '';
              
              if (ranked.topResult.type === 'track') {
                const track = ranked.topResult.data as Track;
                title = track.title;
                subtitle = `Song • ${track.artist}`;
                image = track.images?.small || track.images?.medium || track.images?.large || '';
                typeLabel = 'track';
              } else if (ranked.topResult.type === 'artist') {
                const artist = ranked.topResult.data as any;
                title = artist.name;
                subtitle = 'Artist';
                image = artist.images?.small || artist.images?.medium || artist.images?.large || '';
                typeLabel = 'artist';
              } else if (ranked.topResult.type === 'album') {
                const album = ranked.topResult.data as any;
                title = album.name;
                subtitle = `Album • ${album.artist}`;
                image = album.images?.small || album.images?.medium || album.images?.large || '';
                typeLabel = 'album';
              } else if (ranked.topResult.type === 'playlist') {
                const playlist = ranked.topResult.data as any;
                title = playlist.name;
                subtitle = 'Playlist';
                image = playlist.images?.small || playlist.images?.medium || playlist.images?.large || '';
                typeLabel = 'playlist';
              }

              if (title && image) {
                addRecentItem({
                  id: (ranked.topResult.data as any).id,
                  title,
                  subtitle,
                  image,
                  type: typeLabel
                });
              }
            }
"""

content = content.replace("setSearchError(null);\n          } else if", top_result_logic + "\n            setSearchError(null);\n          } else if")

# 5. Handle matchingRecentSearches
matching_recent = """
  const matchingRecentSearches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return recentSearches.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 3);
  }, [searchQuery, recentSearches]);
"""

content = re.sub(
    r"const matchingRecentSearches = useMemo\(\(\) => \{.*?\}, \[searchQuery, recentSearches\]\);",
    matching_recent.strip(),
    content,
    flags=re.DOTALL
)

# 6. Fix matchingRecentSearches mapping (item is now RecentSearchItem, not string)
# Find: {matchingRecentSearches.map((item) => (
# and fix item to item.title inside the loop.
# It's easier to just replace the whole matchingRecentSearches map block.
old_matching_map = """
              {matchingRecentSearches.map((item) => (
                <div
                  key={`recent-${item}`}
                  onClick={() => selectQuery(item)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/80 active:bg-neutral-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <p className="text-sm font-semibold truncate capitalize text-neutral-200 group-hover:text-white transition-colors">
                      {item}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSearchChange) onSearchChange(item);
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex-shrink-0 ml-2"
                    title={`Fill "${item}" into search`}
                  >
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>
                </div>
              ))}
"""

new_matching_map = """
              {matchingRecentSearches.map((item) => (
                <div
                  key={`recent-${item.id}`}
                  onClick={() => selectQuery(item.title)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/80 active:bg-neutral-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <p className="text-sm font-semibold truncate capitalize text-neutral-200 group-hover:text-white transition-colors">
                      {item.title}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSearchChange) onSearchChange(item.title);
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex-shrink-0 ml-2"
                    title={`Fill "${item.title}" into search`}
                  >
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>
                </div>
              ))}
"""
content = content.replace(old_matching_map.strip(), new_matching_map.strip())

# 7. Update removeRecent to use id
content = re.sub(
    r"const removeRecent = \(item: string\) => \{.*?const updated = recentSearches\.filter\(\(s\) => s !== item\);.*?saveRecentSearches\(updated\);\n  \};",
    "const removeRecent = (id: string) => {\n    const updated = recentSearches.filter((s) => s.id !== id);\n    saveRecentSearches(updated);\n  };",
    content,
    flags=re.DOTALL
)

# 8. Render Recent Searches section
# The old one renders bubbles. We replace it with the new list view.
old_recent_jsx = """
          {/* Recent Searches (If any) */}
          {recentSearches.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Recent Searches
                </h3>
                <button
                  onClick={() => saveRecentSearches([])}
                  className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {recentSearches.map((item) => (
                    <motion.div
                      key={item}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => selectQuery(item)}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-emerald-500/40 text-xs text-neutral-200 cursor-pointer group transition-all shadow-sm"
                    >
                      <Search className="w-3 h-3 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                      <span className="font-medium">{item}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(item);
                        }}
                        className="text-neutral-500 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors"
                        title="Remove from recent searches"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
"""

new_recent_jsx = """
          {/* Recent Searches (If any) */}
          {recentSearches.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Recents
                </h2>
              </div>

              <div className="flex flex-col gap-0">
                <AnimatePresence>
                  {recentSearches.map((item) => {
                    const isLiked = isTrackLiked(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => {
                          if (item.type === 'track') {
                            const dummyTrack: any = { id: item.id, title: item.title, artist: item.subtitle.replace('Song • ', '').replace('Single • ', ''), images: { small: item.image, medium: item.image, large: item.image } };
                            playTrack(dummyTrack);
                          } else if (item.type === 'artist') {
                            onNavigate({ type: 'artist', id: item.id });
                          } else if (item.type === 'album') {
                            onNavigate({ type: 'album', id: item.id });
                          } else if (item.type === 'playlist') {
                            onNavigate({ type: 'playlist', id: item.id });
                          }
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <div className="relative w-14 h-14 flex-shrink-0 overflow-hidden">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80'}
                            alt={item.title}
                            className={`w-full h-full object-cover shadow-sm ${item.type === 'artist' ? 'rounded-full' : 'rounded-md'}`}
                            loading="lazy"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
                          <h4 className={`text-base font-medium truncate ${item.type === 'track' && currentTrack?.id === item.id && isPlaying ? 'text-emerald-400' : 'text-white'}`}>
                            {item.title}
                          </h4>
                          <p className="text-sm text-neutral-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          {item.type === 'track' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const dummyTrack: any = { id: item.id, title: item.title, artist: item.subtitle.replace('Song • ', '').replace('Single • ', ''), images: { small: item.image, medium: item.image, large: item.image } };
                                toggleLikeTrack(dummyTrack);
                              }}
                              className="p-2 text-neutral-400 hover:text-white transition-colors"
                            >
                              {isLiked ? (
                                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-black stroke-[3]" />
                                </div>
                              ) : (
                                <Plus className="w-6 h-6 stroke-1" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecent(item.id);
                            }}
                            className="p-2 text-neutral-400 hover:text-white transition-colors"
                          >
                            <X className="w-6 h-6 stroke-1" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
"""

content = content.replace(old_recent_jsx.strip(), new_recent_jsx.strip())

# Add to suggestions click so when user taps suggestion, it adds to recents.
# PlaySuggestionTrack
play_suggestion_track_old = """
  const playSuggestionTrack = (sug: SearchSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    const t: Track = {
      id: sug.id,
      title: sug.title,
      artist: sug.artist || 'Unknown Artist',
      album: sug.album || 'Unknown Album',
      images: {
        small: sug.image || '',
        medium: sug.image || '',
        large: sug.image || '',
      },
      duration: 0,
      streamUrl: '',
      provider: 'open-authorized-music',
    };
    playTrack(t);
  };
"""

play_suggestion_track_new = """
  const playSuggestionTrack = (sug: SearchSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    const t: Track = {
      id: sug.id,
      title: sug.title,
      artist: sug.artist || 'Unknown Artist',
      album: sug.album || 'Unknown Album',
      images: {
        small: sug.image || '',
        medium: sug.image || '',
        large: sug.image || '',
      },
      duration: 0,
      streamUrl: '',
      provider: 'open-authorized-music',
    };
    playTrack(t);
    
    // Add to recents
    addRecentItem({
      id: sug.id,
      title: sug.title,
      subtitle: `Song • ${sug.artist}`,
      image: sug.image || '',
      type: 'track'
    });
  };
"""

content = content.replace(play_suggestion_track_old.strip(), play_suggestion_track_new.strip())


with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

