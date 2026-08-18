import React, { useState, useEffect } from 'react';
import { Playlist, ViewState, Track } from '../types';
import { api } from '../services/apiClient';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { TrackRow } from '../components/Common/TrackRow';
import { HeroSkeleton } from '../components/Common/SkeletonLoaders';
import { PlaylistArtwork } from '../components/Common/PlaylistArtwork';
import {
  Play,
  Pause,
  Shuffle,
  Edit2,
  Trash2,
  Plus,
  Clock,
  Music,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from 'lucide-react';

interface PlaylistViewProps {
  playlistId: string;
  onNavigate: (view: ViewState) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, onNavigate }) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [suggestedSongs, setSuggestedSongs] = useState<Track[]>([]);

  const { track: currentTrack, isPlaying, playTrack, togglePlay, setShuffleEnabled } = usePlayer();
  const { playlists, likedTrackIds, downloadedTracksList, updatePlaylist, deletePlaylist, removeTrackFromPlaylist, addTrackToPlaylist, reorderPlaylist } = useUser();

  const loadPlaylist = async () => {
    // Special: Downloaded Songs playlist
    if (playlistId === 'downloaded-tracks') {
      setPlaylist({
        id: 'downloaded-tracks',
        title: 'Downloaded Songs',
        description: 'Your offline available tracks',
        coverImage: '',
        userId: 'user',
        isPublic: false,
        tracks: downloadedTracksList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likesCount: downloadedTracksList.length,
        color: '#1e3a8a'
      });
      setEditTitle('Downloaded Songs');
      setEditDesc('Your offline available tracks');
      setLoading(false);
      return;
    }

    // Special: Liked Songs playlist
    if (playlistId === 'liked-songs') {
      try {
        const feed = await api.getHomeFeed();
        const pool = feed.data?.popularSongs || [];
        const likedTracks = pool.filter(t => likedTrackIds.has(t.id));
        const finalTracks = likedTracks.length > 0 ? likedTracks : pool.slice(0, 10);
        setPlaylist({
          id: 'liked-songs',
          title: 'Liked Songs',
          description: 'Your favorite saved songs',
          coverImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
          userId: 'user',
          isPublic: false,
          tracks: finalTracks,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likesCount: finalTracks.length,
          color: '#5b21b6'
        });
        setEditTitle('Liked Songs');
        setEditDesc('Your favorite saved songs');
        setLoading(false);
        return;
      } catch (e) {}
    }

    // Special: New Episodes
    if (playlistId === 'new-episodes') {
      try {
        const feed = await api.getHomeFeed();
        const pool = feed.data?.popularSongs || [];
        setPlaylist({
          id: 'new-episodes',
          title: 'New Episodes',
          description: 'Updated podcast episodes and fresh audio',
          coverImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&auto=format&fit=crop&q=80',
          userId: 'spotify',
          isPublic: true,
          tracks: pool.slice(0, 8),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likesCount: 1420,
          color: '#542c75'
        });
        setEditTitle('New Episodes');
        setEditDesc('Updated podcast episodes');
        setLoading(false);
        return;
      } catch (e) {}
    }

    // Immediate synchronous check from local storage first
    let localFound: Playlist | undefined;
    try {
      const saved = localStorage.getItem('spotify_user_playlists');
      if (saved) {
        const parsed: Playlist[] = JSON.parse(saved);
        localFound = parsed.find(p => p.id === playlistId);
        if (localFound) {
          setPlaylist(localFound);
          setEditTitle(localFound.title);
          setEditDesc(localFound.description || '');
          setLoading(false);
        }
      }
    } catch (e) {}

    // Also check context playlists
    if (!localFound && playlists.length > 0) {
      const fromCtx = playlists.find(p => p.id === playlistId);
      if (fromCtx) {
        setPlaylist(fromCtx);
        setEditTitle(fromCtx.title);
        setEditDesc(fromCtx.description || '');
        setLoading(false);
      }
    }

    try {
      const res = await api.getPlaylist(playlistId);
      if (res.success && res.data) {
        setPlaylist(res.data);
        setEditTitle(res.data.title);
        setEditDesc(res.data.description || '');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Failed to load playlist from API:', e);
    }

    // If still not found after network call, check context again
    const finalFallback = playlists.find(p => p.id === playlistId);
    if (finalFallback) {
      setPlaylist(finalFallback);
      setEditTitle(finalFallback.title);
      setEditDesc(finalFallback.description || '');
    } else if (!localFound) {
      setPlaylist(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  // Search songs for quick adding
  useEffect(() => {
    if (showAddSongs) {
      const query = songSearchQuery.trim() || 'trending hits';
      api.search(query).then((res) => {
        if (res.success && res.data) {
          setSuggestedSongs(res.data.songs);
        }
      });
    }
  }, [showAddSongs, songSearchQuery]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8 text-center space-y-6 max-w-md mx-auto my-12 text-white">
        <div className="w-20 h-20 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
          <Music className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Playlist Not Found</h2>
          <p className="text-sm text-neutral-400">
            This playlist may have been removed or is temporarily unavailable.
          </p>
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => onNavigate({ type: 'home' })}
            className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all"
          >
            Go to Home
          </button>
          <button
            onClick={() => onNavigate({ type: 'library', subTab: 'playlists' })}
            className="px-6 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-all"
          >
            Your Library
          </button>
        </div>
      </div>
    );
  }

  const isPlayingThisPlaylist = playlist.tracks.some((t) => t.id === currentTrack?.id) && isPlaying;

  const handlePlayPlaylist = () => {
    if (playlist.tracks.length > 0) {
      if (isPlayingThisPlaylist) {
        togglePlay();
      } else {
        playTrack(playlist.tracks[0], playlist.tracks);
      }
    }
  };

  const handleShufflePlaylist = () => {
    if (playlist.tracks.length > 0) {
      setShuffleEnabled(true);
      const randomIndex = Math.floor(Math.random() * playlist.tracks.length);
      playTrack(playlist.tracks[randomIndex], playlist.tracks);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    await updatePlaylist(playlist.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });
    setPlaylist((prev) => (prev ? { ...prev, title: editTitle.trim(), description: editDesc.trim() } : null));
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${playlist.title}"?`)) {
      await deletePlaylist(playlist.id);
      onNavigate({ type: 'library' });
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    await removeTrackFromPlaylist(playlist.id, trackId);
    setPlaylist((prev) =>
      prev ? { ...prev, tracks: prev.tracks.filter((t) => t.id !== trackId) } : null
    );
  };

  const handleAddTrack = async (track: Track) => {
    await addTrackToPlaylist(playlist.id, track);
    setPlaylist((prev) =>
      prev ? { ...prev, tracks: [...prev.tracks, track] } : null
    );
  };

  const handleMoveTrack = async (fromIdx: number, toIdx: number) => {
    if (!playlist || toIdx < 0 || toIdx >= playlist.tracks.length) return;
    const newTracks = [...playlist.tracks];
    const [moved] = newTracks.splice(fromIdx, 1);
    newTracks.splice(toIdx, 0, moved);
    setPlaylist({ ...playlist, tracks: newTracks });
    await reorderPlaylist(playlist.id, newTracks.map((t) => t.id));
  };

  return (
    <div className="pb-32 text-white">
      {/* Header Banner */}
      <div
        className="p-6 md:p-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 rounded-b-3xl"
        style={{
          background: `linear-gradient(180deg, ${playlist.color || '#10B981'}66 0%, #121212 100%)`,
        }}
      >
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 bg-neutral-800">
          <PlaylistArtwork playlist={playlist} className="w-full h-full" />
        </div>

        <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
          <span className="text-xs uppercase font-bold tracking-widest text-neutral-300">
            Playlist
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow">
            {playlist.title}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 max-w-xl">
            {playlist.description || 'No description provided.'}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-neutral-300">
            <span>Spotify 2.0 User</span>
            <span>•</span>
            <span>{playlist.tracks.length} songs</span>
            <span>•</span>
            <span className="text-neutral-400">Created on {playlist.createdAt}</span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPlaylist}
              disabled={playlist.tracks.length === 0}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
              title="Play Playlist"
            >
              {isPlayingThisPlaylist ? (
                <Pause className="w-6 h-6 fill-black" />
              ) : (
                <Play className="w-6 h-6 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={handleShufflePlaylist}
              disabled={playlist.tracks.length === 0}
              className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-40 text-neutral-300 hover:text-white transition-colors"
              title="Shuffle Playlist"
            >
              <Shuffle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
              title="Edit Playlist Details"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-red-400 transition-colors"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tracks List */}
        {playlist.tracks.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 pb-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center">#</span>
                <span>Title</span>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="w-4 h-4 mr-6" />
              </div>
            </div>

            {playlist.tracks.map((track, idx) => (
              <div key={`${track.id}-${idx}`} className="group relative flex items-center">
                <div className="flex-1 min-w-0">
                  <TrackRow
                    track={track}
                    index={idx}
                    queueContext={playlist.tracks}
                    onNavigate={onNavigate}
                  />
                </div>
                {/* Reorder / Remove quick actions on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 pr-2">
                  {idx > 0 && (
                    <button
                      onClick={() => handleMoveTrack(idx, idx - 1)}
                      title="Move Up"
                      className="p-1 text-neutral-400 hover:text-white"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {idx < playlist.tracks.length - 1 && (
                    <button
                      onClick={() => handleMoveTrack(idx, idx + 1)}
                      title="Move Down"
                      className="p-1 text-neutral-400 hover:text-white"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveTrack(track.id)}
                    title="Remove from playlist"
                    className="p-1 text-neutral-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl space-y-3">
            <Music className="w-12 h-12 mx-auto text-neutral-600" />
            <h3 className="text-lg font-bold text-neutral-300">Your playlist is empty</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Find more songs to add below and make this playlist uniquely yours!
            </p>
          </div>
        )}

        {/* Find More Songs Section */}
        <section className="pt-8 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-500" />
              <span>Let&apos;s find something for your playlist</span>
            </h3>
            <button
              onClick={() => setShowAddSongs(!showAddSongs)}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              {showAddSongs ? 'Hide Search' : 'Add More Songs'}
            </button>
          </div>

          {showAddSongs && (
            <div className="space-y-4 bg-neutral-900/60 p-4 rounded-2xl border border-white/5">
              <input
                type="text"
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                placeholder="Search songs to add..."
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:border-emerald-500 focus:outline-none"
              />

              <div className="space-y-1">
                {suggestedSongs.map((track) => {
                  const alreadyIn = playlist.tracks.some((t) => t.id === track.id);
                  return (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={track.images?.small || track.images?.medium || track.images?.large || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
                          alt={track.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="font-semibold text-sm truncate text-white">{track.title}</h5>
                          <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddTrack(track)}
                        disabled={alreadyIn}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1 transition-all ${
                          alreadyIn
                            ? 'bg-neutral-800 text-neutral-500 border-transparent'
                            : 'border-white/20 text-white hover:border-emerald-500 hover:text-emerald-400'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{alreadyIn ? 'Added' : 'Add'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Edit Details Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="text-lg font-bold">Edit Playlist Details</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-emerald-500 text-black font-semibold text-sm hover:bg-emerald-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
