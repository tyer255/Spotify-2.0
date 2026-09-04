import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '../../types';
import { useUser } from '../../context/UserContext';
import { usePlayer } from '../../context/PlayerContext';
import { UserAvatar } from '../Common/UserAvatar';
import { ArtistAvatar } from '../Common/ArtistAvatar';
import {
  History,
  Megaphone,
  Settings,
  ChevronRight,
  X,
  Sparkles,
  Music,
  ExternalLink,
  Check,
  Plus,
} from 'lucide-react';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [mounted, setMounted] = useState(false);
  const { profile, followedArtistsList, savedAccounts, firebaseUser, switchAccount, addAccount, showToast } = useUser();
  const { playTrack } = usePlayer();
  const [activeSubModal, setActiveSubModal] = useState<'recents' | 'updates' | 'accounts' | null>(null);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeSubModal) {
          setActiveSubModal(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeSubModal, onClose]);

  // Lock body scroll when drawer or modal is open
  useEffect(() => {
    if (isOpen || activeSubModal || isSwitchingAccount) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (!isSwitchingAccount) {
        setActiveSubModal(null);
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, activeSubModal, isSwitchingAccount]);

  const userName = profile?.name || 'Guest User';
  const recentItems = profile?.recentHistory || [];

  const handleNavigate = (view: ViewState) => {
    setActiveSubModal(null);
    onClose();
    onNavigate(view);
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden select-none">
            {/* Dimmed Backdrop Overlay */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              onClick={() => {
                if (activeSubModal) {
                  setActiveSubModal(null);
                } else {
                  onClose();
                }
              }}
              className="fixed inset-0 bg-black/75 z-40 will-change-[opacity]"
            />

            {/* Left Sliding Profile Panel with Optimized 60FPS Spring Physics */}
            <motion.aside
              key="drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{
                type: 'spring',
                damping: 32,
                stiffness: 340,
                mass: 0.7,
              }}
              drag="x"
              dragConstraints={{ left: -340, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80 || info.velocity.x < -300) {
                  onClose();
                }
              }}
              className="fixed top-0 bottom-0 left-0 inset-y-0 w-[84vw] max-w-[340px] h-[100dvh] bg-[#14151e] border-r border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col justify-between z-50 overflow-hidden will-change-transform transform-gpu"
              aria-label="Profile navigation drawer"
            >
              {/* Top Liquid Specular Light Sheen */}
              <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/[0.12] via-white/[0.02] to-transparent pointer-events-none z-0" />

              {/* Main Content Area */}
              <div className="p-5 sm:p-6 space-y-5 relative z-10 flex-1 overflow-y-auto no-scrollbar">
                
                {/* Top Spotiz-Style Account Area */}
                <div className="flex items-center justify-between gap-3 pt-2 pb-2">
                  {/* Current Profile - Navigates to Profile */}
                  <div
                    onClick={() => handleNavigate({ type: 'profile' })}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group active:scale-[0.98] transition-transform"
                    title="View profile"
                  >
                    <UserAvatar
                      avatarUrl={profile?.avatar}
                      name={userName}
                      sizeClassName="w-12 h-12 shadow-md ring-1 ring-white/10 flex-shrink-0"
                      iconClassName="w-6 h-6 text-neutral-300"
                    />

                    <div className="flex flex-col min-w-0 flex-1 justify-center">
                      <h2 className="text-lg font-bold text-white tracking-tight truncate leading-tight group-hover:text-[#1ed760] transition-colors">
                        {userName}
                      </h2>
                      <span className="text-xs font-medium text-neutral-400 group-hover:text-neutral-200 transition-colors mt-0.5">
                        View profile
                      </span>
                    </div>
                  </div>

                  {/* Other Accounts & Plus Button - Opens Account Switcher */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {savedAccounts && savedAccounts.filter(a => a.email !== firebaseUser?.email).slice(0, 3).map((acc, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubModal('accounts');
                        }}
                        className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-sm flex items-center justify-center bg-zinc-700 text-xs font-bold text-white uppercase hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        style={{ backgroundColor: ['#E0B0FF', '#FFB6C1', '#87CEFA', '#98FB98'][idx % 4] }}
                        title={`Switch to ${acc.name}`}
                      >
                        {acc.avatar && acc.avatar.trim() !== '' ? (
                          <img src={acc.avatar} alt={acc.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-black">{acc.name.charAt(0)}</span>
                        )}
                      </button>
                    ))}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSubModal('accounts');
                      }}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white border border-white/20 transition-all cursor-pointer"
                      title="Switch or add account"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtle Glass Divider */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent -mx-5 sm:-mx-6" />

                {/* Navigation Options List */}
                <nav className="space-y-2 pt-1">
                  {/* 1. Recents Button - Opens Pop-Up Card */}
                  <button
                    onClick={() => setActiveSubModal('recents')}
                    className="w-full flex items-center justify-between px-3.5 py-3.5 rounded-2xl text-left text-white bg-white/[0.04] hover:bg-white/[0.09] active:bg-white/[0.14] active:scale-[0.98] border border-white/10 hover:border-white/20 transition-all duration-150 group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <History className="w-5 h-5 text-neutral-300 group-hover:text-white flex-shrink-0" />
                      <span className="text-base font-semibold text-neutral-100 group-hover:text-white tracking-wide truncate">
                        Recents
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {recentItems.length > 0 && (
                        <span className="text-xs text-neutral-400 font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                          {recentItems.length}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                    </div>
                  </button>

                  {/* 2. Your Updates Button - Opens Pop-Up Card */}
                  <button
                    onClick={() => setActiveSubModal('updates')}
                    className="w-full flex items-center justify-between px-3.5 py-3.5 rounded-2xl text-left text-white bg-white/[0.04] hover:bg-white/[0.09] active:bg-white/[0.14] active:scale-[0.98] border border-white/10 hover:border-white/20 transition-all duration-150 group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Megaphone className="w-5 h-5 text-neutral-300 group-hover:text-white" />
                        {followedArtistsList.length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#1ed760] rounded-full ring-2 ring-[#121212]" />
                        )}
                      </div>
                      <span className="text-base font-semibold text-neutral-100 group-hover:text-white tracking-wide truncate">
                        Your Updates
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {followedArtistsList.length > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/30">
                          New
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                    </div>
                  </button>

                  {/* 3. Settings and privacy Button */}
                  <button
                    onClick={() => handleNavigate({ type: 'settings' })}
                    className="w-full flex items-center justify-between px-3.5 py-3.5 rounded-2xl text-left text-white bg-white/[0.04] hover:bg-white/[0.09] active:bg-white/[0.14] active:scale-[0.98] border border-white/10 hover:border-white/20 transition-all duration-150 group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Settings className="w-5 h-5 text-neutral-300 group-hover:text-white flex-shrink-0" />
                      <span className="text-base font-semibold text-neutral-100 group-hover:text-white tracking-wide truncate">
                        Settings and privacy
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white flex-shrink-0" />
                  </button>
                </nav>
              </div>

              {/* Bottom Footer Area: Liquid Glass Card for Premium Active */}
              <div className="p-5 sm:p-6 border-t border-white/10 bg-white/[0.03] flex items-center justify-between relative z-10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse shadow-[0_0_8px_rgba(30,215,96,0.6)]" />
                  <span className="text-[#1ed760] font-bold text-sm tracking-wide">
                    Premium Active
                  </span>
                </div>
                <button
                  onClick={() => handleNavigate({ type: 'premium' })}
                  className="text-xs font-medium text-neutral-400 hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Plan details
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Centered Liquid Glass Pop-Up Box Modal for Recents & Your Updates & Accounts */}
      <AnimatePresence>
        {activeSubModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
            {/* Modal Backdrop */}
            <motion.div
              key="submodal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={() => setActiveSubModal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-[2px] z-0 will-change-[opacity]"
            />

            {/* Modal Box */}
            <motion.div
              key="submodal-box"
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 10 }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 380,
                mass: 0.65,
              }}
              className="relative w-full max-w-sm sm:max-w-md max-h-[82vh] bg-[#161822] border border-white/20 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.25)] z-10 flex flex-col overflow-hidden will-change-transform transform-gpu"
            >
              {/* Top Specular Sheen */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.14] via-white/[0.03] to-transparent pointer-events-none rounded-t-3xl" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-white/10 relative z-10 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  {activeSubModal === 'recents' ? (
                    <>
                      <div className="p-2 rounded-xl bg-[#1ed760]/15 border border-[#1ed760]/30 text-[#1ed760]">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Recently Played</h3>
                        <p className="text-[11px] text-neutral-400">Your recent tracks & stations</p>
                      </div>
                    </>
                  ) : activeSubModal === 'accounts' ? (
                    <>
                      <div>
                        <h3 className="text-base font-bold text-white">Switch Accounts</h3>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded-xl bg-[#1ed760]/15 border border-[#1ed760]/30 text-[#1ed760]">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Your Updates</h3>
                        <p className="text-[11px] text-neutral-400">What's new with your artists</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setActiveSubModal(null)}
                  className="p-2 rounded-full text-neutral-400 hover:text-white bg-white/5 hover:bg-white/15 active:scale-90 border border-white/10 transition-all cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 no-scrollbar relative z-10">
                {activeSubModal === 'recents' ? (
                  recentItems.length > 0 ? (
                    recentItems.map(({ track, playedAt }, idx) => (
                      <div
                        key={`recent-popup-${track.id}-${idx}`}
                        onClick={() => {
                          playTrack(track, recentItems.map((i) => i.track));
                          setActiveSubModal(null);
                          onClose();
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.09] active:bg-white/[0.14] active:scale-[0.98] border border-white/5 hover:border-white/15 transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 shadow-sm ring-1 ring-white/10 flex items-center justify-center">
                          {track.images?.small || track.images?.medium || track.images?.large ? (
                            <img
                              src={track.images?.small || track.images?.medium || track.images?.large || undefined}
                              alt={track.title}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = 'none';
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-[#1ed760] transition-colors">
                            {track.title}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                        </div>
                        <span className="text-[11px] text-neutral-400 flex-shrink-0">
                          {new Date(playedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 space-y-2 text-neutral-400">
                      <History className="w-8 h-8 mx-auto text-neutral-600" />
                      <p className="text-sm">No listening history yet.</p>
                      <p className="text-xs text-neutral-500">Tracks you play will be saved here.</p>
                    </div>
                  )
                ) : activeSubModal === 'accounts' ? (
                  <div className="space-y-1">
                    {savedAccounts?.map(account => (
                      <div
                        key={account.email}
                        onClick={async () => {
                          if (account.email === firebaseUser?.email) return;
                          
                          setIsSwitchingAccount(true);
                          setActiveSubModal(null); // immediately close modal but show loading
                          
                          // Buffer UI frame
                          await new Promise(r => setTimeout(r, 100));
                          
                          try {
                            await switchAccount(account.email);
                          } catch(e) {
                            console.error(e);
                          }
                          
                          setIsSwitchingAccount(false);
                          onClose();
                          onNavigate({ type: 'home' });
                          setTimeout(() => showToast(`You're now logged in as ${account.name}`), 500);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${account.email === firebaseUser?.email ? 'bg-white/10' : 'hover:bg-white/5 cursor-pointer active:bg-white/10'}`}
                      >
                        {account.avatar && account.avatar.trim() !== '' ? (
                          <img src={account.avatar} alt="" className="w-12 h-12 rounded-full object-cover shadow-md" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-neutral-700 shadow-md flex items-center justify-center font-bold text-lg text-white">
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className={`text-base font-semibold truncate ${account.email === firebaseUser?.email ? 'text-[#1ed760]' : 'text-white'}`}>{account.name}</span>
                          {account.email === firebaseUser?.email && (
                            <span className="text-xs text-white/70">Current account</span>
                          )}
                        </div>
                        {account.email === firebaseUser?.email && (
                          <div className="flex-shrink-0 text-[#1ed760] px-2">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button
                      onClick={async () => {
                        setActiveSubModal(null);
                        onClose();
                        addAccount();
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer active:bg-white/10 transition-colors w-full text-left mt-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-neutral-300">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="text-base font-semibold text-white flex-1">Add account</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followedArtistsList.length > 0 ? (
                      followedArtistsList.map((artist) => (
                        <div
                          key={`update-popup-artist-${artist.id}`}
                          onClick={() => handleNavigate({ type: 'artist', artistId: artist.id })}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] active:bg-white/[0.14] active:scale-[0.98] border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-xs group"
                        >
                          <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-white/15">
                            <ArtistAvatar
                              id={artist.id}
                              name={artist.name}
                              image={artist.image}
                              sizeClassName="w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#1ed760] font-semibold">Artist Update</p>
                            <p className="text-sm font-bold text-white truncate group-hover:text-[#1ed760] transition-colors">
                              {artist.name}
                            </p>
                            <p className="text-xs text-neutral-400 truncate">New releases & top tracks</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 space-y-2">
                        <Sparkles className="w-8 h-8 text-neutral-500 mx-auto" />
                        <p className="text-sm font-semibold text-white">All caught up!</p>
                        <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                          Follow artists to receive real-time notifications when they release new singles and albums.
                        </p>
                      </div>
                    )}

                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900/60 to-neutral-900/80 border border-emerald-500/30 text-xs text-neutral-300 space-y-1 shadow-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>App Feature Updates</span>
                      </div>
                      <p>Stream authentic full-length tracks with verified audio and 320kbps fidelity.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between relative z-10 flex-shrink-0">
                {activeSubModal === 'recents' ? (
                  <>
                    <button
                      onClick={() => handleNavigate({ type: 'profile' })}
                      className="text-xs font-semibold text-[#1ed760] hover:underline cursor-pointer"
                    >
                      View all in Profile →
                    </button>
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95"
                    >
                      Close
                    </button>
                  </>
                ) : activeSubModal === 'updates' ? (
                  <>
                    <span className="text-xs text-neutral-400">
                      {followedArtistsList.length} following
                    </span>
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="px-5 py-1.5 rounded-full bg-[#1ed760] hover:bg-[#1db954] text-xs font-bold text-black transition-all cursor-pointer active:scale-95"
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <div className="w-full flex justify-end">
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3-Dot Loading Overlay for Account Switching */}
      <AnimatePresence>
        {isSwitchingAccount && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#000000] flex items-center justify-center flex-col gap-4"
          >
            <div className="flex gap-3 items-center">
              <motion.div
                animate={{ scale: [0.7, 1, 0.7], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: 0 }}
                className="w-4 h-4 rounded-full bg-white"
              />
              <motion.div
                animate={{ scale: [0.7, 1, 0.7], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: 0.3 }}
                className="w-4 h-4 rounded-full bg-white"
              />
              <motion.div
                animate={{ scale: [0.7, 1, 0.7], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: 0.6 }}
                className="w-4 h-4 rounded-full bg-white"
              />
            </div>
            <p className="text-sm font-semibold text-white/50 tracking-wider">Switching account...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
};
