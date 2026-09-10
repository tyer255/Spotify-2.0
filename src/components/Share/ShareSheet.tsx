import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Track } from '../../types';
import { api } from '../../services/apiClient';
import { extractColorsFromImage, ExtractedColors } from '../../utils/colorExtractor';
import { useUser } from '../../context/UserContext';
import { usePlayer } from '../../context/PlayerContext';
import { SongShareCard } from './SongShareCard';
import { LyricsShareCard } from './LyricsShareCard';
import {
  CopyLinkIcon,
  WhatsAppIcon,
  SnapchatIcon,
  InstagramStoriesIcon,
  MessagesIcon,
  MoreDotsIcon,
  PencilEditIcon,
} from './ShareIcons';

interface ShareSheetProps {
  track: Track;
  onClose: () => void;
}

export type ShareType = 'song' | 'lyrics';
export type CardStyle = 'default' | 'vibrant' | 'dark' | 'gradient';

interface LyricLine {
  text: string;
  time: number;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({ track, onClose }) => {
  const [shareType, setShareType] = useState<ShareType>('song');
  const [cardStyle, setCardStyle] = useState<CardStyle>('default');
  const [colors, setColors] = useState<ExtractedColors | null>(null);

  // Dual-language lyrics support
  const [romanizedLines, setRomanizedLines] = useState<LyricLine[]>([]);
  const [hindiLines, setHindiLines] = useState<LyricLine[]>([]);
  const [lyricsScript, setLyricsScript] = useState<'romanized' | 'hindi'>('romanized');
  const [selectedLyricIndex, setSelectedLyricIndex] = useState<number>(0);
  const [hasLyrics, setHasLyrics] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const [isEditingLyrics, setIsEditingLyrics] = useState<boolean>(false);

  // Animated green loop border for Copy Link button
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [copyProgress, setCopyProgress] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const { showToast } = useUser();
  const { lyricsData } = usePlayer();
  const sheetRef = useRef<HTMLDivElement>(null);
  const lyricsCardRef = useRef<HTMLDivElement>(null);

  // Active lyric lines
  const activeLyrics: LyricLine[] =
    lyricsScript === 'romanized' && romanizedLines.length > 0
      ? romanizedLines
      : hindiLines.length > 0
      ? hindiLines
      : romanizedLines;

  // 1. Extract dynamic artwork colors
  useEffect(() => {
    const imgUrl = track.images?.large || track.images?.medium || track.images?.small;
    if (imgUrl) {
      extractColorsFromImage(imgUrl).then(setColors).catch(() => {});
    }
  }, [track]);

  // 2. Comprehensive Lyrics Fetcher
  useEffect(() => {
    let isMounted = true;

    const fetchAllLyrics = async () => {
      let romLines: LyricLine[] = [];
      let hinLines: LyricLine[] = [];

      // A: PlayerContext
      if (
        lyricsData &&
        (lyricsData.trackId === track.id ||
          lyricsData.title.toLowerCase().includes(track.title.toLowerCase())) &&
        lyricsData.lines?.length
      ) {
        const lines = lyricsData.lines
          .filter((l) => l && l.text && l.text.trim().length > 0 && !l.text.includes('♪'))
          .map((l) => ({ text: l.text.trim(), time: l.time || 0 }));

        if (lines.length > 0) {
          const hasDevanagari = lines.some((l) => /[\u0900-\u097F]/.test(l.text));
          if (hasDevanagari) hinLines = lines;
          else romLines = lines;
        }
      }

      // B: Server API
      try {
        const res = await api.getLyrics(track.id, track.title, track.artist, track.duration);
        if (res.success && res.data) {
          let serverLines: LyricLine[] = [];
          if (Array.isArray(res.data.lines) && res.data.lines.length > 0) {
            serverLines = res.data.lines
              .filter((l: any) => l && l.text && l.text.trim().length > 0 && !l.text.includes('♪'))
              .map((l: any) => ({ text: l.text.trim(), time: l.time || 0 }));
          } else if (res.data.plainLyrics) {
            serverLines = res.data.plainLyrics
              .split('\n')
              .map((t: string) => t.replace(/^\[.*?\]/, '').trim())
              .filter((t: string) => t.length > 0 && !t.includes('♪'))
              .map((text: string, idx: number) => ({ text, time: idx * 4 }));
          }

          if (serverLines.length > 0) {
            const hasDev = serverLines.some((l) => /[\u0900-\u097F]/.test(l.text));
            if (hasDev && hinLines.length === 0) hinLines = serverLines;
            else if (!hasDev && romLines.length === 0) romLines = serverLines;
          }
        }
      } catch (e) {}

      // C: LRCLIB search
      try {
        const cleanTitle = track.title.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
        const cleanArtist = track.artist.split(',')[0].split('&')[0].trim();
        const lrcUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`;
        const lrcCandidates = await fetch(lrcUrl).then((r) => r.json()).catch(() => []);

        if (Array.isArray(lrcCandidates)) {
          for (const item of lrcCandidates) {
            const textSource = item.plainLyrics || item.syncedLyrics;
            if (!textSource) continue;

            const split = textSource
              .split('\n')
              .map((t: string) => t.replace(/^\[.*?\]/, '').trim())
              .filter((t: string) => t.length > 0 && !t.includes('♪'))
              .map((text: string, idx: number) => ({ text, time: idx * 4 }));

            if (split.length === 0) continue;

            const isDev = split.some((l: any) => /[\u0900-\u097F]/.test(l.text));
            if (isDev && hinLines.length === 0) {
              hinLines = split;
            } else if (!isDev && romLines.length === 0) {
              romLines = split;
            }
          }
        }
      } catch (e) {}

      if (!isMounted) return;

      if (romLines.length > 0 || hinLines.length > 0) {
        setRomanizedLines(romLines);
        setHindiLines(hinLines);
        setHasLyrics(true);
        setLyricsScript(romLines.length > 0 ? 'romanized' : 'hindi');
        setSelectedLyricIndex(0);
      } else {
        setHasLyrics(false);
      }
    };

    fetchAllLyrics();

    return () => {
      isMounted = false;
    };
  }, [track.id, track.title, track.artist]);

  // Reset generated URL on parameter change
  useEffect(() => {
    setGeneratedShareUrl(null);
  }, [shareType, cardStyle, selectedLyricIndex, lyricsScript]);

  const getSelectedLyricsText = () => {
    if (activeLyrics.length === 0) return '';
    const endIdx = Math.min(activeLyrics.length - 1, selectedLyricIndex + 3);
    return activeLyrics.slice(selectedLyricIndex, endIdx + 1).map((l) => l.text).join('\n');
  };

  const getCardBackground = () => {
    const dominant = colors?.primary || track.color || '#243033';
    const vibrant = colors?.vibrant || '#1DB954';

    switch (cardStyle) {
      case 'vibrant':
        return `linear-gradient(170deg, ${dominant} 0%, #121415 100%)`;
      case 'dark':
        return '#141617';
      case 'gradient':
        return `linear-gradient(135deg, ${dominant} 0%, ${vibrant} 70%, #111 100%)`;
      case 'default':
      default:
        return `linear-gradient(180deg, ${dominant} 0%, #121415 85%)`;
    }
  };

  // Unique Backend Share Link Generator
  const generateShareLink = async (): Promise<string | null> => {
    if (generatedShareUrl) return generatedShareUrl;

    setIsGenerating(true);
    try {
      const isLyrics = shareType === 'lyrics';
      let customImageBase64: string | undefined;

      if (isLyrics && lyricsCardRef.current) {
        try {
          customImageBase64 = await toPng(lyricsCardRef.current, { pixelRatio: 2, cacheBust: true });
        } catch (e) {
          console.error("Failed to generate lyrics image", e);
        }
      }

      const payload = {
        type: shareType,
        songId: track.id,
        title: track.title,
        artist: track.artist,
        artwork: track.images?.large || track.images?.medium || track.images?.small || '',
        album: track.album || '',
        duration: track.duration || 0,
        lyrics: isLyrics ? getSelectedLyricsText() : undefined,
        customImageBase64,
      };

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data?.shareId) {
        const url = `${window.location.origin}/share/${shareType}/${json.data.shareId}`;
        setGeneratedShareUrl(url);
        return url;
      } else {
        throw new Error('Failed to generate link');
      }
    } catch (e) {
      console.error(e);
      showToast('Unable to create share link. Please try again.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // ACTION: Copy Link with fast circular green line loop animation on button boundary
  const handleCopyLink = async () => {
    if (isCopying) return;
    setIsCopying(true);
    setCopyProgress(0);

    // Pre-generate/fetch the share URL in parallel
    const urlPromise = generateShareLink();

    // Animate green stroke around circle boundary (~420ms loop)
    const animDuration = 420; // fast & snappy
    const startTime = performance.now();

    const frame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / animDuration);
      setCopyProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        // Green loop completed! Now copy the link
        urlPromise.then(async (url) => {
          if (url) {
            try {
              await navigator.clipboard.writeText(url);
            } catch (err) {}
            setIsCopied(true);
            showToast('Link copied to clipboard');

            // Revert state after 2 seconds
            setTimeout(() => {
              setIsCopied(false);
              setIsCopying(false);
              setCopyProgress(0);
            }, 2000);
          } else {
            setIsCopying(false);
            setCopyProgress(0);
          }
        });
      }
    };

    requestAnimationFrame(frame);
  };

  // ACTION: WhatsApp
  const handleWhatsApp = async () => {
    const url = await generateShareLink();
    if (!url) return;

    const lyricsSnippet = getSelectedLyricsText();
    const shareText =
      shareType === 'lyrics' && lyricsSnippet
        ? `"${lyricsSnippet}"\n\nListen to "${track.title}" by ${track.artist} on Spotiz:\n${url}`
        : `Listen to "${track.title}" by ${track.artist} on Spotiz:\n${url}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  // ACTION: Snapchat
  const handleSnapchat = async () => {
    const url = await generateShareLink();
    if (!url) return;

    const shareText = `Listen to "${track.title}" by ${track.artist} on Spotiz:\n${url}`;
    try {
      await navigator.clipboard.writeText(shareText);
      showToast('Link copied! Opening Snapchat...');
    } catch (e) {}

    window.open('https://www.snapchat.com', '_blank');
  };

  // ACTION: Instagram Stories
  const handleInstagramStories = async () => {
    const url = await generateShareLink();
    if (!url) return;

    const shareText =
      shareType === 'lyrics' && getSelectedLyricsText()
        ? `"${getSelectedLyricsText()}" — ${track.title} by ${track.artist}`
        : `Listen to "${track.title}" by ${track.artist}`;

    if (navigator.share && navigator.canShare) {
      try {
        await navigator.share({
          title: track.title,
          text: `${shareText}\n${url}`,
          url,
        });
        return;
      } catch (err) {}
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied! Paste it in your Instagram Story sticker');
    } catch (e) {}
    window.open('https://www.instagram.com', '_blank');
  };

  // ACTION: Messages (SMS)
  const handleMessages = async () => {
    const url = await generateShareLink();
    if (!url) return;

    const shareText = `Listen to "${track.title}" by ${track.artist} on Spotiz: ${url}`;
    window.location.href = `sms:?&body=${encodeURIComponent(shareText)}`;
  };

  // ACTION: More (Native System Share)
  const handleMore = async () => {
    const url = await generateShareLink();
    if (!url) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${track.title} by ${track.artist}`,
          text: `Listen to "${track.title}" by ${track.artist} on Spotiz`,
          url,
        });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard');
    }
  };

  // Circumference for boundary circle (radius = 26, C = 2 * PI * 26 = 163.36)
  const circleRadius = 26;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference * (1 - copyProgress);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-end">
        {/* Dark translucent backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-[6px]"
        />

        {/* Bottom Sheet Panel - sized properly for all viewports without cutoff */}
        <motion.div
          ref={sheetRef}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={0.15}
          onDragEnd={(e, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) {
              onClose();
            }
          }}
          className="relative w-full bg-[#121212] rounded-t-[28px] sm:rounded-t-[32px] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-y-auto max-h-[92vh] sm:max-h-[90vh] pb-7 pt-2.5 scrollbar-none z-10"
        >
          {/* Top Drag Handle */}
          <div className="w-9 h-1 bg-white/30 rounded-full mx-auto mb-1.5 shrink-0 cursor-grab active:cursor-grabbing" />

          {/* Cards Carousel Area with Controlled Peek (never clips active card) */}
          <div className="relative w-full flex items-center justify-center overflow-hidden py-1.5 shrink-0 px-3">
            <div className="relative flex items-center justify-center w-full max-w-sm">
              {/* Active Center Card */}
              <div className="relative z-10 shrink-0 transition-all duration-300">
                {shareType === 'song' ? (
                  <SongShareCard
                    track={track}
                    style={cardStyle}
                    background={getCardBackground()}
                  />
                ) : (
                  <div ref={lyricsCardRef}>
                    <LyricsShareCard
                      track={track}
                      lyrics={getSelectedLyricsText()}
                      style={cardStyle}
                      background={getCardBackground()}
                      hasLyrics={hasLyrics}
                    />
                  </div>
                )}
              </div>

              {/* Adjacent Peeking Card (Smoothly aligned on right, tap to switch) */}
              <div
                onClick={() => setShareType(shareType === 'song' ? 'lyrics' : 'song')}
                className="absolute right-0 translate-x-[42%] sm:translate-x-[46%] z-0 scale-[0.88] opacity-35 hover:opacity-60 transition-all duration-300 cursor-pointer pointer-events-auto shrink-0 select-none"
              >
                {shareType === 'song' ? (
                  <LyricsShareCard
                    track={track}
                    lyrics={getSelectedLyricsText()}
                    style={cardStyle}
                    background={getCardBackground()}
                    hasLyrics={hasLyrics}
                    isPeeking={true}
                  />
                ) : (
                  <SongShareCard
                    track={track}
                    style={cardStyle}
                    background={getCardBackground()}
                    isPeeking={true}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Controls Section (Segmented Toggle & Sub-controls) */}
          <div className="w-full flex flex-col items-center gap-2.5 my-2 shrink-0 px-4">
            {/* Spotify Segmented Pill: "Song" | "Lyrics" */}
            <div className="w-[210px] sm:w-[230px] h-[38px] bg-[#242424] rounded-full p-1 flex items-center justify-between relative shadow-inner">
              <button
                onClick={() => setShareType('song')}
                className={`flex-1 h-full rounded-full text-[13px] font-bold transition-all duration-200 flex items-center justify-center ${
                  shareType === 'song'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Song
              </button>
              <button
                onClick={() => setShareType('lyrics')}
                className={`flex-1 h-full rounded-full text-[13px] font-bold transition-all duration-200 flex items-center justify-center ${
                  shareType === 'lyrics'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Lyrics
              </button>
            </div>

            {/* Sub-controls */}
            {shareType === 'song' ? (
              <div className="flex items-center justify-center gap-3 h-[32px]">
                {/* Album Art Swatch */}
                <button
                  onClick={() => setCardStyle('default')}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 transition-transform active:scale-95 ${
                    cardStyle === 'default'
                      ? 'border-white ring-2 ring-white/30 scale-110'
                      : 'border-white/20 opacity-70'
                  }`}
                >
                  <img
                    src={track.images?.small || track.images?.medium || ''}
                    alt="Style thumbnail"
                    className="w-full h-full object-cover"
                  />
                </button>

                {/* Extracted Vibrant Swatch */}
                <button
                  onClick={() => setCardStyle('vibrant')}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform active:scale-95 ${
                    cardStyle === 'vibrant'
                      ? 'border-white ring-2 ring-white/30 scale-110'
                      : 'border-white/20 opacity-70'
                  }`}
                  style={{ backgroundColor: colors?.primary || '#1DB954' }}
                />

                {/* Dark Charcoal Swatch */}
                <button
                  onClick={() => setCardStyle('dark')}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#181818] border-2 transition-transform active:scale-95 ${
                    cardStyle === 'dark'
                      ? 'border-white ring-2 ring-white/30 scale-110'
                      : 'border-white/20 opacity-70'
                  }`}
                />

                {/* Gradient Swatch */}
                <button
                  onClick={() => setCardStyle('gradient')}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform active:scale-95 flex items-center justify-center ${
                    cardStyle === 'gradient'
                      ? 'border-white ring-2 ring-white/30 scale-110'
                      : 'border-white/20 opacity-70'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${colors?.primary || '#333'} 0%, #111 100%)`,
                  }}
                >
                  <div className="w-2 h-2 rounded-full border border-white/60" />
                </button>
              </div>
            ) : (
              /* Lyrics Sub-controls */
              <div className="h-[32px] flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsEditingLyrics(true)}
                  className="px-4 py-1.5 bg-[#242424] hover:bg-[#2c2c2c] active:scale-95 border border-white/10 rounded-full text-white text-[12px] font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <PencilEditIcon className="w-3.5 h-3.5 text-white/80" />
                  <span>Edit lyrics</span>
                </button>

                {romanizedLines.length > 0 && hindiLines.length > 0 && (
                  <button
                    onClick={() =>
                      setLyricsScript(lyricsScript === 'romanized' ? 'hindi' : 'romanized')
                    }
                    className="px-3 py-1.5 bg-[#242424] hover:bg-[#2c2c2c] active:scale-95 border border-white/10 rounded-full text-white/80 text-[11px] font-medium transition-all"
                  >
                    {lyricsScript === 'romanized' ? 'हिंदी में देखें' : 'English / Romanized'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sharing Destinations Row - Prominently visible and comfortably spaced */}
          <div className="w-full mt-2 shrink-0 px-2">
            <div className="flex items-start justify-between max-w-sm sm:max-w-md mx-auto px-2 py-1">
              {/* 1. Copy Link with Green Boundary Loop Animation */}
              <button
                onClick={handleCopyLink}
                disabled={isCopying}
                className="flex flex-col items-center shrink-0 group focus:outline-none"
              >
                <div className="relative w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full bg-[#242424] group-active:scale-95 flex items-center justify-center transition-all duration-150 shadow-md">
                  {/* SVG Green Boundary Loop */}
                  {isCopying && (
                    <svg
                      className="absolute -inset-[2px] w-[calc(100%+4px)] h-[calc(100%+4px)] -rotate-90 pointer-events-none z-10"
                      viewBox="0 0 60 60"
                    >
                      <circle
                        cx="30"
                        cy="30"
                        r={circleRadius}
                        fill="none"
                        stroke="#1DB954"
                        strokeWidth="3"
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(29, 185, 84, 0.9))',
                        }}
                      />
                    </svg>
                  )}

                  {/* Icon: changes to green checkmark when copied */}
                  {isCopied ? (
                    <Check className="w-6 h-6 text-[#1DB954] stroke-[2.5] animate-in zoom-in-50 duration-200" />
                  ) : (
                    <CopyLinkIcon
                      className={`w-6 h-6 text-white transition-all ${
                        isCopying ? 'scale-90 opacity-90' : 'group-hover:scale-105'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium text-center mt-1.5 whitespace-nowrap transition-colors ${
                    isCopied ? 'text-[#1DB954] font-bold' : 'text-[#b3b3b3]'
                  }`}
                >
                  {isCopied ? 'Copied!' : 'Copy link'}
                </span>
              </button>

              {/* 2. WhatsApp */}
              <button
                onClick={handleWhatsApp}
                disabled={isGenerating}
                className="flex flex-col items-center shrink-0 group focus:outline-none"
              >
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full bg-[#25D366] group-active:scale-95 flex items-center justify-center transition-all duration-150 shadow-md">
                  <WhatsAppIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <span className="text-[11px] text-[#b3b3b3] font-medium text-center mt-1.5 whitespace-nowrap">
                  WhatsApp
                </span>
              </button>

              {/* 3. Snapchat */}
              <button
                onClick={handleSnapchat}
                disabled={isGenerating}
                className="flex flex-col items-center shrink-0 group focus:outline-none"
              >
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full bg-[#FFFC00] group-active:scale-95 flex items-center justify-center transition-all duration-150 shadow-md">
                  <SnapchatIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <span className="text-[11px] text-[#b3b3b3] font-medium text-center mt-1.5 whitespace-nowrap">
                  Snapchat
                </span>
              </button>

              {/* 4. Stories (Instagram) */}
              <button
                onClick={handleInstagramStories}
                disabled={isGenerating}
                className="flex flex-col items-center shrink-0 group focus:outline-none"
              >
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)] group-active:scale-95 flex items-center justify-center transition-all duration-150 shadow-md">
                  <InstagramStoriesIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <span className="text-[11px] text-[#b3b3b3] font-medium text-center mt-1.5 whitespace-nowrap">
                  Stories
                </span>
              </button>

              {/* 5. Messages */}
              <button
                onClick={handleMessages}
                disabled={isGenerating}
                className="flex flex-col items-center shrink-0 group focus:outline-none"
              >
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full bg-gradient-to-tr from-[#0084FF] to-[#A033FF] group-active:scale-95 flex items-center justify-center transition-all duration-150 shadow-md">
                  <MessagesIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <span className="text-[11px] text-[#b3b3b3] font-medium text-center mt-1.5 whitespace-nowrap">
                  Messages
                </span>
              </button>

              {/* 6. More */}
              <button
                onClick={handleMore}
                disabled={isGenerating}
                className="flex flex-col items-center shrink-0 group focus:outline-none"
              >
                <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] rounded-full bg-[#242424] group-active:scale-95 flex items-center justify-center transition-all duration-150 shadow-md">
                  <MoreDotsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-[11px] text-[#b3b3b3] font-medium text-center mt-1.5 whitespace-nowrap">
                  More
                </span>
              </button>
            </div>
          </div>

          {/* Edit Lyrics Selection Modal */}
          {isEditingLyrics && (
            <div className="absolute inset-0 bg-[#121212] z-50 flex flex-col p-5 overflow-hidden animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
                <h3 className="text-base font-bold text-white">Select lyrics lines</h3>
                <div className="flex items-center gap-3">
                  {romanizedLines.length > 0 && hindiLines.length > 0 && (
                    <button
                      onClick={() =>
                        setLyricsScript(lyricsScript === 'romanized' ? 'hindi' : 'romanized')
                      }
                      className="px-2.5 py-1 text-xs text-white/80 bg-white/10 rounded-full hover:bg-white/20"
                    >
                      {lyricsScript === 'romanized' ? 'Switch to हिंदी' : 'Switch to English'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditingLyrics(false)}
                    className="px-4 py-1.5 bg-white text-black font-bold text-xs rounded-full shadow hover:bg-white/90"
                  >
                    Done
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-2">
                {activeLyrics.length === 0 ? (
                  <p className="text-white/50 text-sm text-center mt-8">
                    No lyrics lines found for this song.
                  </p>
                ) : (
                  activeLyrics.map((line, idx) => {
                    const isSelected =
                      idx >= selectedLyricIndex &&
                      idx <= Math.min(activeLyrics.length - 1, selectedLyricIndex + 3);
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedLyricIndex(idx)}
                        className={`p-3.5 rounded-xl cursor-pointer text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-white/20 text-white font-bold border border-white/40'
                            : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {line.text}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
