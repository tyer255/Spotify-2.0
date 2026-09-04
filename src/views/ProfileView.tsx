import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from '../types';
import { useUser } from '../context/UserContext';
import { usePlayer } from '../context/PlayerContext';
import { AuthModal } from '../components/Auth/AuthModal';
import { PlaylistCard } from '../components/Common/PlaylistCard';
import { UserAvatar } from '../components/Common/UserAvatar';
import { ArtistAvatar } from '../components/Common/ArtistAvatar';
import { CompactTrackRow } from '../components/Common/CompactTrackRow';
import { compressImageToDataUrl } from '../utils/imageHelper';
import {
  Crown,
  Edit3,
  Settings,
  ListMusic,
  Camera,
  Trash2,
  X,
  Upload,
  Check,
  Loader2,
  History,
  Play,
  Pause,
  Clock,
  Users,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileViewProps {
  onNavigate: (view: ViewState) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const {
    profile,
    playlists,
    followedArtistIds,
    followedArtistsList,
    toggleFollowArtist,
    isArtistFollowed,
    updateProfileName,
    updateProfileAvatar,
    removeProfileAvatar,
    removeTrackFromHistory,
    clearListeningHistory,
    showToast,
    firebaseUser,
    login,
    logoutUser,
    savedAccounts,
    switchAccount,
    addAccount,
    removeSavedAccount,
  } = useUser();
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (profile) {
      setNameInput(profile.name || 'Your Name');
    }
  }, [profile]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      await updateProfileName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const handleTriggerUpload = () => {
    setIsPhotoModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      const dataUrl = await compressImageToDataUrl(file, 512, 0.85);
      await updateProfileAvatar(dataUrl);
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload photo');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsPhotoModalOpen(false);
    await removeProfileAvatar();
  };

  
  if (!firebaseUser) {
    return (
      <div className="pb-32 w-full max-w-6xl mx-auto flex flex-col justify-start sm:justify-center items-center min-h-[calc(100vh-80px)] pt-4 sm:pt-8 px-4">
        <AuthModal />
      </div>
    );
  }
  if (!profile) return null;


  const currentName = profile.name || 'Your Name';
  const hasCustomAvatar = Boolean(profile.avatar && profile.avatar.trim() !== '');
  const followingCount = followedArtistIds.size;

  const scrollToFollowing = () => {
    const el = document.getElementById('profile-following-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="profile-view-container" className="p-4 md:p-8 pb-32 space-y-8 text-white max-w-6xl mx-auto select-none">
      {/* Hidden File Input for Image Selection */}
      <input
        id="profile-avatar-file-input"
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header Profile Card */}
      <div
        id="profile-header-card"
        className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 md:p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-[#181818] to-neutral-950 border border-white/5 shadow-2xl relative overflow-hidden"
      >
        {/* Avatar Container with Tap to Edit */}
        <div className="relative group flex-shrink-0">
          <button
            id="profile-avatar-btn"
            onClick={() => setIsPhotoModalOpen(true)}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-2xl border-4 border-white/10 relative group hover:border-[#1ed760]/50 transition-all cursor-pointer block"
            title="Change profile photo"
          >
            <UserAvatar
              avatarUrl={profile.avatar}
              name={currentName}
              sizeClassName="w-full h-full"
              iconClassName="w-20 h-20 text-neutral-400"
            />

            {/* Hover / Overlay Indicator */}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-white text-xs font-semibold">
              <Camera className="w-6 h-6 stroke-[2]" />
              <span>{hasCustomAvatar ? 'Change Photo' : 'Choose Photo'}</span>
            </div>

            {/* Loading Overlay */}
            {isProcessingPhoto && (
              <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center text-[#1ed760]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </button>

          {/* Camera Badge Icon */}
          <button
            onClick={() => setIsPhotoModalOpen(true)}
            className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-neutral-900"
            title="Edit Photo"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Profile Info Details */}
        <div className="space-y-2.5 text-center sm:text-left flex-1 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <button
              onClick={() => onNavigate({ type: 'premium' })}
              className="px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
              title="View Premium Status"
            >
              <Crown className="w-3.5 h-3.5 fill-[#1ed760] text-[#1ed760]" />
              <span>{profile?.subscription && profile.subscription !== 'Spotiz Free' ? profile.subscription : 'Spotiz Premium'}</span>
            </button>
          </div>

          {/* Editable User Name */}
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center justify-center sm:justify-start gap-2 max-w-sm">
              <input
                id="profile-name-input"
                type="text"
                value={nameInput || ''}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                placeholder="Enter your name"
                className="px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white font-bold text-lg focus:outline-none focus:border-[#1ed760] w-full"
              />
              <button
                id="profile-name-save-btn"
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-[#1ed760] text-black text-xs font-bold hover:bg-[#1db954] active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameInput(profile.name || 'Your Name');
                  setIsEditingName(false);
                }}
                className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <h1 id="profile-name-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {currentName}
              </h1>
              <button
                id="profile-edit-name-btn"
                onClick={() => setIsEditingName(true)}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Edit name"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* User Email (Only rendered if non-empty real email) */}
          {profile.email && profile.email.trim() !== '' && (
            <p className="text-xs sm:text-sm text-neutral-400">{profile.email}</p>
          )}

          {/* Stats Bar */}
          <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-neutral-400 font-medium">
            <span>
              <strong className="text-white font-bold">{playlists.length}</strong> Playlists
            </span>
            <span>•</span>
            <span>
              <strong className="text-white font-bold">{profile.followersCount || 0}</strong> Followers
            </span>
            <span>•</span>
            <button
              id="profile-following-stat-btn"
              onClick={scrollToFollowing}
              className="hover:text-white transition-colors cursor-pointer"
              title="View followed artists"
            >
              <strong id="profile-following-count" className="text-white font-bold">{followingCount}</strong> Following
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 items-center sm:items-end mt-4 sm:mt-0">
          <button
            onClick={logoutUser}
            className="bg-zinc-800 text-white border border-white/10 p-2.5 rounded-full hover:bg-zinc-700 hover:scale-105 transition-all text-sm font-semibold px-4"
          >
            Log out
          </button>
        </div>

        {/* Settings button */}

        <button
          id="profile-settings-btn"
          onClick={() => onNavigate({ type: 'settings' })}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 self-center sm:self-end transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Followed Artists Section */}
      <section id="profile-following-section" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1ed760]" />
              <span>Following ({followingCount})</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Artists you follow receive top priority in your music searches and recommendations.
            </p>
          </div>
        </div>

        {followedArtistsList.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-white/5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-800 mx-auto flex items-center justify-center text-neutral-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm text-neutral-300 font-medium">You aren&apos;t following any artists yet.</p>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Follow artists to keep up with their latest releases and automatically boost their songs to the top of your search results.
            </p>
            <button
              onClick={() => onNavigate({ type: 'search' })}
              className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore & Follow Artists</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {followedArtistsList.map((artist) => {
              const isFollowed = isArtistFollowed(artist.id) || isArtistFollowed(artist.name);
              return (
                <div
                  key={`followed-art-${artist.id}`}
                  onClick={() => onNavigate({ type: 'artist', artistId: artist.id })}
                  className="group relative p-4 rounded-2xl bg-neutral-900/50 hover:bg-neutral-800/80 border border-white/5 hover:border-white/10 transition-all duration-200 cursor-pointer flex flex-col items-center text-center space-y-3"
                >
                  {/* Artist Avatar */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-neutral-800 shadow-lg border-2 border-white/5 group-hover:border-[#1ed760]/30 transition-all flex-shrink-0">
                    <ArtistAvatar
                      id={artist.id}
                      name={artist.name}
                      image={artist.image}
                      sizeClassName="w-full h-full"
                      showHoverEffect={true}
                    />
                  </div>

                  {/* Artist Info */}
                  <div className="w-full min-w-0 space-y-0.5">
                    <h4 className="font-bold text-sm text-white group-hover:text-[#1ed760] transition-colors truncate">
                      {artist.name}
                    </h4>
                    <p className="text-xs text-neutral-400 capitalize truncate">
                      {artist.genres?.[0] || 'Artist'}
                    </p>
                  </div>

                  {/* Following / Unfollow Toggle Button */}
                  <button
                    id={`profile-unfollow-btn-${artist.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollowArtist(artist);
                    }}
                    className={`w-full py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isFollowed
                        ? 'border border-white/30 text-white hover:border-red-500 hover:text-red-400 hover:bg-red-500/10'
                        : 'bg-[#1ed760] text-black hover:bg-[#1db954]'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-[#1ed760]" />
                        <span>Following</span>
                      </>
                    ) : (
                      <span>Follow</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* User Playlists Section */}
      <section id="profile-playlists-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-[#1ed760]" />
            <span>Public Playlists</span>
          </h3>
        </div>

        {playlists.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-white/5 text-center space-y-2">
            <p className="text-sm text-neutral-300 font-medium">You haven&apos;t created any playlists yet.</p>
            <p className="text-xs text-neutral-500">Create your first playlist from your library to start collecting your favorite tracks.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
            {playlists.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Listening History Section */}
      <section id="profile-history-section" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-[#1ed760]" />
              <span>Recently Played</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Music you recently listened to. You can remove individual tracks below.
            </p>
          </div>
          {profile?.recentHistory && profile.recentHistory.length > 0 && (
            <button
              onClick={clearListeningHistory}
              className="text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors cursor-pointer px-3 py-1.5 rounded-full bg-neutral-900/80 hover:bg-red-500/10 border border-white/5 flex items-center gap-1.5"
              title="Clear all recent history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {!profile?.recentHistory || profile.recentHistory.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-white/5 text-center space-y-2">
            <p className="text-sm text-neutral-300 font-medium">No recent listening history</p>
            <p className="text-xs text-neutral-500">Songs you play in the app will appear here with instant remove controls.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {profile.recentHistory.map((item, idx) => {
              const playedDate = item.playedAt ? new Date(item.playedAt) : null;
              const formattedTime = playedDate
                ? playedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={`profile-hist-${item.track.id}-${idx}`}
                  className="group flex items-center justify-between p-2.5 rounded-2xl bg-neutral-900/50 hover:bg-neutral-800/80 border border-white/5 transition-all duration-200"
                >
                  <div
                    onClick={() => playTrack(item.track, profile.recentHistory.map((h) => h.track))}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer pr-2"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800 shadow">
                      <img
                        src={item.track.images?.small || item.track.images?.medium || 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96'}
                        alt={item.track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {currentTrack?.id === item.track.id && isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="flex items-end gap-[2px] h-3.5">
                            <span className="w-0.5 bg-[#1ed760] rounded-full h-full animate-pulse" />
                            <span className="w-0.5 bg-[#1ed760] rounded-full h-2 animate-pulse delay-75" />
                            <span className="w-0.5 bg-[#1ed760] rounded-full h-3 animate-pulse delay-150" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-bold text-sm truncate ${currentTrack?.id === item.track.id ? 'text-[#1ed760]' : 'text-white group-hover:text-[#1ed760]'} transition-colors`}>
                        {item.track.title}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {item.track.artist} {formattedTime ? `• ${formattedTime}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Delete option on every music column */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => removeTrackFromHistory(item.track.id)}
                      className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all cursor-pointer"
                      title={`Remove "${item.track.title}" from history`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Photo Selection Action Modal / Bottom Sheet */}
      <AnimatePresence>
        {isPhotoModalOpen && (
          <div
            id="profile-photo-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-[#282828] rounded-2xl p-6 text-white shadow-2xl border border-white/10 space-y-5 z-10 text-center"
            >
              <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-neutral-900 border-2 border-white/10 shadow-inner flex items-center justify-center">
                <UserAvatar
                  avatarUrl={profile.avatar}
                  name="Preview"
                  sizeClassName="w-full h-full"
                  iconClassName="w-10 h-10 text-neutral-400"
                />
              </div>

              <div>
                <h3 className="text-lg font-bold">Profile Photo</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Customize your avatar with any photo from your device.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {/* Upload from Gallery / Choose photo */}
                <button
                  id="profile-modal-upload-btn"
                  onClick={handleTriggerUpload}
                  className="w-full py-3 px-4 rounded-full bg-white text-black font-bold text-sm hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Upload className="w-4 h-4 stroke-[2.5]" />
                  <span>Upload from Gallery</span>
                </button>

                {/* Remove photo (if existing) */}
                {hasCustomAvatar && (
                  <button
                    id="profile-modal-remove-btn"
                    onClick={handleRemovePhoto}
                    className="w-full py-2.5 px-4 rounded-full bg-neutral-800 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Photo</span>
                  </button>
                )}

                {/* Cancel button */}
                <button
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-full bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
