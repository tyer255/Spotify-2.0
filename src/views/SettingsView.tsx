import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ViewState } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { usePlayer } from '../context/PlayerContext';
import { SpotifyLogo } from '../components/Common/SpotifyLogo';
import { PWAInstallButton } from '../components/Common/PWAInstallButton';
import {
  Sliders,
  Volume2,
  Moon,
  Sun,
  HardDrive,
  Check,
  Trash2,
  Zap,
  SunMoon, 
  Crown 
} from 'lucide-react';

interface SettingsViewProps {
  onNavigate: (view: ViewState) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { showToast, downloadedTracksList, clearAllDownloads } = useUser();
  const { audioQuality, setAudioQuality, crossfadeSeconds, setCrossfadeSeconds, gapless, setGapless, normalizeVolume, setNormalizeVolume } = usePlayer();

        
  
  
  const accentOptions = [
    { name: 'Emerald (Spotify Green)', hex: '#10B981' },
    { name: 'Electric Purple', hex: '#8B5CF6' },
    { name: 'Sunset Pink', hex: '#EC4899' },
    { name: 'Cyan Wave', hex: '#06B6D4' },
    { name: 'Solar Amber', hex: '#F59E0B' },
  ];

  const handleClearCache = () => {
    clearAllDownloads();
    showToast('Offline cache and temporary audio data cleared');
  };

  return (
    <div className="p-4 md:p-8 pb-32 space-y-8 text-white max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Manage your audio playback, appearance, and offline cache
        </p>
      </div>

      {/* Premium Active Status Tile */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => onNavigate({ type: 'premium' })}
        className="relative p-4 sm:p-5 rounded-3xl liquid-glass-card border border-emerald-500/40 hover:border-emerald-500/60 transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] group overflow-hidden cursor-pointer"
      >
        {/* Animated Sweep */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12 pointer-events-none"
          animate={{ left: ['-100%', '200%'] }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
        />

        <div className="relative flex items-center justify-between gap-3 sm:gap-4">
          {/* Left Side: Icon + Title + Pill + Description */}
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                  Premium Active
                </h3>
                <span className="text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap shadow-sm">
                  Lifetime
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-tight truncate">
                Never Expires · All features unlocked
              </p>
            </div>
          </div>

          {/* Right Side: View Status Button */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate({ type: 'premium' });
              }}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white transition-all text-center whitespace-nowrap border border-white/10 shadow-sm cursor-pointer"
            >
              View Status
            </button>
          </div>
        </div>
      </motion.section>

      {/* Audio Streaming Quality */}
      <section className="p-5 sm:p-6 rounded-3xl liquid-glass-card space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neutral-800/80 text-neutral-300 border border-white/5">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Audio Quality</h3>
            <p className="text-xs text-neutral-400">Select preferred streaming bitrate</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'normal', label: 'Normal', bitrate: '96 kbit/s' },
            { id: 'high', label: 'High', bitrate: '160 kbit/s' },
            { id: 'very_high', label: 'Very High (Hi-Fi)', bitrate: '320 kbit/s' },
          ].map((q) => (
            <button
              key={q.id}
              onClick={() => {
                setAudioQuality(q.id as any);
                showToast(`Streaming quality set to ${q.label}`);
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                audioQuality === q.id
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">{q.label}</span>
                {audioQuality === q.id && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-neutral-400 mt-1">{q.bitrate}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Playback Controls & Crossfade */}
      <section className="p-5 sm:p-6 rounded-3xl liquid-glass-card space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neutral-800/80 text-neutral-300 border border-white/5">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Playback Features</h3>
            <p className="text-xs text-neutral-400">Transitions and leveling</p>
          </div>
        </div>

        <div className="space-y-4 divide-y divide-white/5">
          {/* Crossfade */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold">Crossfade Songs</h4>
                <p className="text-xs text-neutral-400">Smoothly blend songs into one another</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {crossfadeSeconds}s
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              value={crossfadeSeconds}
              onChange={(e) => setCrossfadeSeconds(parseInt(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Gapless Playback Toggle */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <h4 className="text-sm font-semibold">Gapless Playback</h4>
              <p className="text-xs text-neutral-400">Eliminates silence between live or concept albums</p>
            </div>
            <button
              onClick={() => setGapless(!gapless)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                gapless ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  gapless ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Volume Normalization */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <h4 className="text-sm font-semibold">Normalize Volume</h4>
              <p className="text-xs text-neutral-400">Set the same volume level for all tracks</p>
            </div>
            <button
              onClick={() => setNormalizeVolume(!normalizeVolume)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                normalizeVolume ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  normalizeVolume ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Appearance & Theming */}
      <section className="p-5 sm:p-6 rounded-3xl liquid-glass-card space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neutral-800/80 text-neutral-300 border border-white/5">
            <SunMoon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Appearance & Theme</h3>
            <p className="text-xs text-neutral-400">Personalize your color experience</p>
          </div>
        </div>

        {/* Theme mode selection */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              theme === 'dark'
                ? 'bg-white/10 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4" />
              <span className="font-semibold text-sm">Dark Theme</span>
            </div>
            {theme === 'dark' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              theme === 'light'
                ? 'bg-white/10 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <span className="font-semibold text-sm">Light Theme</span>
            </div>
            {theme === 'light' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Custom Accent Color Palette */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
            Custom Accent Color
          </h4>
          <div className="flex items-center gap-3">
            {accentOptions.map((opt) => (
              <button
                key={opt.hex}
                onClick={() => setAccentColor(opt.hex)}
                className="group relative w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-md"
                style={{ backgroundColor: opt.hex }}
                title={opt.name}
              >
                {accentColor === opt.hex && <Check className="w-4 h-4 text-black font-bold" />}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Progressive Web App (PWA) & App Info */}
      <section className="p-5 sm:p-6 rounded-3xl liquid-glass-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SpotifyLogo size={48} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">Spotify 2.0 PWA</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-300 border border-emerald-500/30">
                  Offline Ready
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Install as a native standalone app on iOS, Android, macOS, Windows & ChromeOS.
              </p>
            </div>
          </div>
          <PWAInstallButton variant="full" />
        </div>
      </section>

      {/* Storage & Cache */}
      <section className="p-5 sm:p-6 rounded-3xl liquid-glass-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neutral-800/80 text-neutral-300 border border-white/5">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">Storage & Cache</h3>
            <p className="text-xs text-neutral-400">
              {downloadedTracksList.length} downloaded tracks (Approx. {(downloadedTracksList.length * 7.8).toFixed(1)} MB)
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-neutral-400 max-w-sm">
            Free up device storage by clearing offline cached song files and lyrics history.
          </p>
          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cache</span>
          </button>
        </div>
      </section>
    </div>
  );
};
