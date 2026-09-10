import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Track, ViewState } from "../../types";
import { usePlayer } from "../../context/PlayerContext";
import { useUser } from "../../context/UserContext";
import { useShare } from "../../context/ShareContext";
import { PlaylistArtwork } from "./PlaylistArtwork";
import { SongQrCard } from "./SongQrCard";
import {
  Heart,
  ListMusic,
  Share,
  User,
  Disc,
  Info,
  Radio,
  Download,
  Users,
  MinusCircle,
  Plus,
  QrCode,
  Music2,
  ChevronLeft,
  Sparkle,
} from "lucide-react";

interface ContextMenuProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: ViewState) => void;
  onDeleteFromHistory?: () => void;
  showRemoveFromHistory?: boolean;
  onRemoveFromPlaylist?: () => void;
}

type MenuTab = "main" | "playlist" | "credits" | "code";

export const ContextMenu: React.FC<ContextMenuProps> = ({
  track,
  isOpen,
  onClose,
  onNavigate,
  onRemoveFromPlaylist,
}) => {
  const { addToQueue, setIsAmbientModeOpen } = usePlayer();
  const {
    profile,
    isTrackLiked,
    toggleLikeTrack,
    playlists,
    addTrackToPlaylist,
    toggleDownloadTrack,
    isTrackDownloaded,
    isTrackHidden,
    hideTrack,
    unhideTrack,
  } = useUser();

  const { openShare } = useShare();
  const [activeTab, setActiveTab] = useState<MenuTab>("main");

  const isLiked = track ? isTrackLiked(track.id) : false;
  const isDownloaded = track ? isTrackDownloaded(track.id) : false;
  const isHidden = track ? isTrackHidden(track.id) : false;

  const handleClose = () => {
    onClose();
    setTimeout(() => setActiveTab("main"), 300);
  };

  const handleToggleLike = async () => {
    if (!track) return;
    await toggleLikeTrack(track);
    handleClose();
  };

  const handleAddToQueue = () => {
    if (!track) return;
    addToQueue(track);
    handleClose();
  };

  const handleGoToArtist = () => {
    if (!track) return;
    if (onNavigate) {
      onNavigate({
        type: "artist",
        artistId: track.artistId || track.artist,
        expectedName: track.artist,
      });
    }
    handleClose();
  };

  const handleGoToAlbum = () => {
    if (!track) return;
    if (onNavigate) {
      // If we have an albumId use it, else search for the album name
      if (track.albumId) {
        onNavigate({ type: "album", albumId: track.albumId });
      } else if (track.album) {
        onNavigate({ type: "search", initialQuery: track.album });
      }
    }
    handleClose();
  };

  const handleToggleDownload = async () => {
    if (!track) return;
    await toggleDownloadTrack(track);
  };

  const handleShare = async () => {
    if (!track) return;
    openShare(track);
    handleClose();
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!track) return;
    await addTrackToPlaylist(playlistId, track);
    handleClose();
  };

  const handleSongRadio = () => {
    if (!track) return;
    if (onNavigate) {
      onNavigate({ type: 'radio-station', stationId: track.id, stationTitle: `${track.title} Radio` });
    }
    handleClose();
  };

  const handleToggleHide = async () => {
    if (!track) return;
    if (isHidden) {
      await unhideTrack(track.id);
    } else {
      await hideTrack(track.id, track);
    }
    handleClose();
  };

  if (typeof document === "undefined") return null;

  const renderIcon = (
    IconComponent: any,
    active?: boolean,
    activeColor?: string,
  ) => (
    <div className={`w-12 flex items-center justify-center`}>
      <IconComponent
        className={`w-6 h-6 ${active ? activeColor : "text-neutral-400 group-hover:text-white transition-colors"} ${active && (activeColor === "text-red-500" || activeColor === "text-emerald-500") ? (activeColor === "text-red-500" ? "fill-red-500" : "fill-emerald-500") : ""}`}
        strokeWidth={1.5}
      />
    </div>
  );

  const ActionRow = ({
    icon,
    label,
    onClick,
    active = false,
    activeColor = "",
    rightElement = null,
  }: any) => (
    <button
      onClick={onClick}
      className="w-full flex items-center min-h-[56px] hover:bg-white/10 active:bg-white/20 transition-colors text-left group"
    >
      {renderIcon(icon, active, activeColor)}
      <span
        className={`text-[15px] font-medium flex-1 truncate ${active && activeColor !== "text-emerald-500" ? activeColor : "text-white"}`}
      >
        {label}
      </span>
      {rightElement && <div className="pr-4">{rightElement}</div>}
    </button>
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && track && (
        <div
          className={`fixed inset-0 z-[100000] flex items-end sm:items-center justify-center overflow-hidden touch-none ${activeTab === "code" ? "pointer-events-none" : ""}`}
        >
          {/* Main Backdrop (Hidden if QR code is active since QR modal has its own full screen background) */}
          {activeTab !== "code" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm -z-10 cursor-pointer"
            />
          )}

          {/* Main Sheet (hidden if QR code is active) */}
          {activeTab !== "code" && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 350,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) handleClose();
              }}
              className="relative w-full max-w-md bg-[#121212] sm:border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col z-10 max-h-[85vh] shadow-2xl"
            >
              {/* Handle */}
              <div className="w-full pt-3 pb-1 flex justify-center flex-shrink-0">
                <div className="w-10 h-1.5 bg-neutral-600 rounded-full" />
              </div>

              {/* Track Header */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-white/10 flex-shrink-0">
                <img
                  src={
                    track.images?.medium ||
                    track.images?.small ||
                    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80"
                  }
                  alt={track.title}
                  className="w-14 h-14 object-cover shadow-lg"
                />
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <h4 className="font-bold text-[17px] truncate text-white leading-tight mb-1">
                    {track.title}
                  </h4>
                  <p className="text-[14px] text-neutral-400 truncate">
                    {track.artist}
                  </p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                {activeTab === "main" && (
                  <div className="flex flex-col py-2">
                    <ActionRow
                      icon={Heart}
                      label={isLiked ? "Liked" : "Like"}
                      onClick={handleToggleLike}
                      active={isLiked}
                      activeColor="text-red-500"
                    />
                    <ActionRow
                      icon={MinusCircle}
                      label={isHidden ? "Unhide this song" : "Hide this song"}
                      onClick={handleToggleHide}
                      active={isHidden}
                      activeColor="text-amber-400"
                    />
                    <ActionRow
                      icon={Plus}
                      label="Add to playlist"
                      onClick={() => setActiveTab("playlist")}
                    />
                    <ActionRow
                      icon={ListMusic}
                      label="Add to queue"
                      onClick={handleAddToQueue}
                    />

                    {/* Start a Jam is premium/disabled */}
                    <div className="w-full flex items-center min-h-[56px] text-left opacity-60 cursor-not-allowed">
                      {renderIcon(Users)}
                      <span className="text-[15px] font-medium flex-1 truncate text-white">
                        Start a Jam
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 pr-5">
                        Premium
                      </span>
                    </div>

                    <ActionRow
                      icon={Download}
                      label={isDownloaded ? "Delete download" : "Download"}
                      onClick={handleToggleDownload}
                      active={isDownloaded}
                      activeColor="text-emerald-500"
                    />

                    <ActionRow
                      icon={Sparkle}
                      label="Open Ambient Mode"
                      onClick={() => {
                        setIsAmbientModeOpen(true);
                        handleClose();
                      }}
                    />
                    <ActionRow
                      icon={Radio}
                      label="Go to song radio"
                      onClick={handleSongRadio}
                    />
                    <ActionRow
                      icon={User}
                      label="Go to artist"
                      onClick={handleGoToArtist}
                    />
                    {track.album && (
                      <ActionRow
                        icon={Disc}
                        label="Go to album"
                        onClick={handleGoToAlbum}
                      />
                    )}
                    <ActionRow
                      icon={Info}
                      label="Show credits"
                      onClick={() => setActiveTab("credits")}
                    />
                    <ActionRow
                      icon={QrCode}
                      label="Show Spotiz Code"
                      onClick={() => setActiveTab("code")}
                    />
                    <ActionRow
                      icon={Share}
                      label="Share"
                      onClick={handleShare}
                    />
                  </div>
                )}

                {/* Playlist Picker */}
                {activeTab === "playlist" && (
                  <div className="flex flex-col py-2">
                    <button
                      onClick={() => setActiveTab("main")}
                      className="flex items-center gap-3 px-4 py-4 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/10"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                      <span className="text-white font-bold text-lg">
                        Add to playlist
                      </span>
                    </button>
                    <div className="pt-2">
                      {playlists.length === 0 ? (
                        <p className="text-center text-neutral-400 text-sm mt-8">
                          No playlists found.
                        </p>
                      ) : (
                        playlists.map((pl) => (
                          <button
                            key={pl.id}
                            onClick={() => handleSelectPlaylist(pl.id)}
                            className="w-full flex items-center px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors text-left group"
                          >
                            <div className="w-12 h-12 flex-shrink-0 bg-neutral-800 flex items-center justify-center mr-4">
                              <PlaylistArtwork
                                playlist={pl}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[15px] font-medium text-white flex-1 truncate">
                              {pl.title}
                            </span>
                            {pl.tracks.some((t) => t.id === track.id) && (
                              <span className="text-emerald-500 text-sm font-medium">
                                Added
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Credits */}
                {activeTab === "credits" && (
                  <div className="flex flex-col py-2 px-6 pb-8">
                    <button
                      onClick={() => setActiveTab("main")}
                      className="flex items-center gap-3 -ml-2 py-4 hover:opacity-80 transition-opacity mb-4"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                      <span className="text-white font-bold text-lg">
                        Credits
                      </span>
                    </button>
                    <h2 className="text-3xl font-bold text-white mb-6">
                      {track.title}
                    </h2>

                    <div className="flex justify-between items-center py-4 border-b border-white/10">
                      <div className="flex flex-col">
                        <span className="text-white text-base font-bold">
                          {track.artist}
                        </span>
                        <span className="text-neutral-400 text-sm">
                          Main Artist
                        </span>
                      </div>
                    </div>

                    {track.album && (
                      <div className="flex justify-between items-center py-4 border-b border-white/10">
                        <div className="flex flex-col">
                          <span className="text-white text-base font-bold">
                            {track.album}
                          </span>
                          <span className="text-neutral-400 text-sm">
                            Album
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-4 border-b border-white/10">
                      <div className="flex flex-col">
                        <span className="text-white text-base font-bold">
                          {track.provider || "Platform"}
                        </span>
                        <span className="text-neutral-400 text-sm">Source</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Song QR Code (Independent Full Screen Modal) */}
          {activeTab === "code" && (
            <div className="pointer-events-auto w-full h-full">
              <SongQrCard track={track} onClose={handleClose} />
            </div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
