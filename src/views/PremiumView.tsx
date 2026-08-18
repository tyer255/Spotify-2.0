import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { ViewState } from '../types';
import {
  Check,
  CheckCircle2,
  Infinity as InfinityIcon,
  Bell,
  Megaphone,
  Shuffle,
  Headphones,
  Users,
  Download,
  Video,
  Sparkles,
  Music2,
  ListMusic,
  History,
  Layers,
  Repeat,
  Mic2,
  Laptop2,
  ShieldCheck,
  Disc,
} from 'lucide-react';
import { SpotifyLogo } from '../components/Common/SpotifyLogo';

interface PremiumViewProps {
  onNavigate?: (view: ViewState) => void;
}

export const PremiumView: React.FC<PremiumViewProps> = ({ onNavigate }) => {
  useEffect(() => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#10B981', '#34D399', '#ffffff']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#10B981', '#34D399', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);
  return (
    <div className="min-h-full bg-black text-white select-none antialiased pb-24 overflow-x-hidden">
      {/* 1. TOP HERO SECTION WITH SPOTIFY ALBUM COLLAGE BACKGROUND */}
      <div className="relative overflow-hidden w-full bg-gradient-to-b from-[#311042] via-[#1a0f2b] to-black pt-6 pb-8 px-5 sm:px-7">
        {/* Artistic collage album tiles resembling the Spotify screenshot */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 mix-blend-screen">
          {/* Tile 1: Purple PHONK */}
          <div className="absolute -top-6 -left-6 w-36 h-48 bg-gradient-to-br from-purple-600 via-fuchsia-800 to-indigo-950 rounded-2xl transform -rotate-12 border border-white/20 p-3 shadow-2xl flex flex-col justify-between">
            <span className="text-[10px] font-black tracking-widest text-purple-200">SPOTIFY MIX</span>
            <span className="text-2xl font-black tracking-tighter text-white rotate-90 origin-bottom-left">PHONK</span>
            <span className="text-[9px] font-bold text-fuchsia-300">BASS BOOSTED</span>
          </div>

          {/* Tile 2: Yellow EAT FRIDAY */}
          <div className="absolute -top-10 left-32 w-36 h-36 bg-[#cbe846] rounded-xl transform rotate-6 border border-black/20 p-3 shadow-2xl text-black flex flex-col justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase">NEW MUSIC</span>
            <div className="text-xl font-black tracking-tight leading-tight">
              EAT<br />FRIDAY
            </div>
            <span className="text-[8px] font-black uppercase">FRESH HITS</span>
          </div>

          {/* Tile 3: Green HOUSEWERK */}
          <div className="absolute -top-4 right-16 w-36 h-36 bg-gradient-to-br from-emerald-400 via-green-600 to-teal-950 rounded-xl transform -rotate-6 border border-white/20 p-3 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <SpotifyLogo size={16} />
              <span className="text-[8px] font-bold text-emerald-200">OFFICIAL</span>
            </div>
            <span className="text-sm font-black tracking-wider text-white">HOUSEWERK</span>
            <div className="w-full h-1 bg-emerald-300 rounded-full" />
          </div>

          {/* Tile 4: Silver/Blue Reggaeton CD */}
          <div className="absolute top-4 -right-8 w-40 h-40 bg-gradient-to-tr from-yellow-500 via-amber-300 to-neutral-200 rounded-full transform rotate-12 border-4 border-neutral-300/40 p-3 shadow-2xl text-black flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/80 flex items-center justify-center border-2 border-white/40">
              <Disc className="w-6 h-6 text-white animate-spin" />
            </div>
          </div>
        </div>

        {/* Gradient fade to pure black */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-black pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-xl mx-auto space-y-4 pt-4">
          {/* Spotify Premium Logo Header */}
          <div className="flex items-center gap-2">
            <SpotifyLogo size={28} />
            <span className="text-xl font-black tracking-tight text-white">
              Premium
            </span>
          </div>

          {/* Main Large Bold Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Listen without limits. Unlimited Lifetime Access with Spotify.
          </h1>

          {/* Notification Pill (Limited time offer style -> Permanent Active) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900/90 border border-white/10 text-neutral-200 text-xs font-semibold backdrop-blur-md">
            <Bell className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            <span>Permanent Active Entitlement</span>
          </div>

          {/* Big White Rounded Button */}
          <div className="pt-2">
            <button
              onClick={() => {}}
              className="w-full py-4 px-6 rounded-full bg-white hover:bg-neutral-100 active:scale-[0.98] text-black font-extrabold text-base tracking-tight shadow-xl transition-transform cursor-pointer text-center"
            >
              Unlimited Lifetime Access
            </button>
            <p className="text-[11px] text-neutral-400 text-center mt-2.5 leading-relaxed">
              Permanent Unlimited Access. Your account has lifetime Spotify Premium enabled with no expiration date. All features unlocked.
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAIN BODY CONTENT */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-8 pt-4">
        {/* PERMANENT ACTIVE STATUS CARD */}
        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative p-5 rounded-3xl bg-gradient-to-r from-emerald-900/40 via-[#181818] to-[#181818] border border-emerald-500/50 space-y-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] overflow-hidden"
        >
          {/* Animated Gradient Sweep */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12"
            animate={{ left: ['-100%', '200%'] }}
            transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.5 }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
              >
                <Check className="w-4 h-4 text-black stroke-[3]" />
              </motion.div>
              <span className="text-xl font-black text-white tracking-tight">Premium Active</span>
            </div>
            <motion.span 
              animate={{ opacity: [0.8, 1, 0.8], boxShadow: ["0 0 0px rgba(52,211,153,0)", "0 0 12px rgba(52,211,153,0.5)", "0 0 0px rgba(52,211,153,0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[11px] font-black uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm"
            >
              Unlimited Lifetime
            </motion.span>
          </div>

          <div className="relative pl-10 space-y-1">
            <p className="text-sm font-bold text-emerald-100 flex items-center gap-1.5">
              <InfinityIcon className="w-4 h-4 text-emerald-400" />
              <span>Unlimited Lifetime Access</span>
            </p>
            <p className="text-xs text-neutral-400 font-medium">
              Never Expires · No renewal or payment required
            </p>
          </div>
        </motion.div>

        {/* "Why join Premium Standard?" Grouped Card (Styled exactly as in screenshot) */}
        <section className="rounded-3xl bg-[#181818] border border-white/5 p-6 space-y-6 shadow-2xl">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Why join Premium Standard?
          </h2>

          <div className="space-y-6">
            {/* 1. Ad-free music listening */}
            <div className="flex items-center gap-4">
              <Megaphone className="w-6 h-6 text-neutral-200 flex-shrink-0" />
              <span className="text-base font-semibold text-white">
                Ad-free music listening
              </span>
            </div>

            {/* 2. Play songs in any order */}
            <div className="flex items-center gap-4">
              <Shuffle className="w-6 h-6 text-neutral-200 flex-shrink-0" />
              <span className="text-base font-semibold text-white">
                Play songs in any order
              </span>
            </div>

            {/* 3. Very high audio quality */}
            <div className="flex items-center gap-4">
              <Headphones className="w-6 h-6 text-neutral-200 flex-shrink-0" />
              <span className="text-base font-semibold text-white">
                Very high audio quality
              </span>
            </div>

            {/* 4. Listen with friends in real time */}
            <div className="flex items-center gap-4">
              <Users className="w-6 h-6 text-neutral-200 flex-shrink-0" />
              <span className="text-base font-semibold text-white">
                Listen with friends in real time
              </span>
            </div>

            {/* 5. Download to listen offline */}
            <div className="flex items-center gap-4">
              <Download className="w-6 h-6 text-neutral-200 flex-shrink-0" />
              <span className="text-base font-semibold text-white">
                Download to listen offline
              </span>
            </div>

            {/* 6. Watch videos with fewer ads */}
            <div className="flex items-center gap-4">
              <Video className="w-6 h-6 text-neutral-200 flex-shrink-0" />
              <span className="text-base font-semibold text-white">
                Watch videos with fewer ads
              </span>
            </div>
          </div>
        </section>

        {/* "Available plans" / Active Plans Section (Styled exactly as in screenshot) */}
        <section className="space-y-4">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Available plans
          </h2>

          {/* Standard Plan Card */}
          <motion.div 
            animate={{ boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 20px rgba(16,185,129,0.4)", "0 0 0px rgba(16,185,129,0)"], borderColor: ["rgba(255,255,255,0.1)", "rgba(16,185,129,0.5)", "rgba(255,255,255,0.1)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative rounded-3xl bg-[#181818] border border-white/10 p-6 space-y-5 shadow-2xl overflow-hidden"
          >
            {/* Top pill badge */}
            <div className="inline-block px-3 py-1 rounded-md bg-emerald-400 text-black text-xs font-black">
              Unlimited for Lifetime
            </div>

            {/* Plan Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SpotifyLogo size={18} />
                <span className="text-xs font-bold text-neutral-300">Premium</span>
              </div>
              <h3 className="text-3xl font-black text-emerald-400 tracking-tight">
                Standard
              </h3>
              <p className="text-lg font-bold text-white">
                Lifetime Premium Access
              </p>
              <p className="text-xs text-neutral-400">
                Never Expires · Permanent Active Account
              </p>
            </div>

            {/* Bullet points */}
            <div className="border-t border-white/10 pt-4 space-y-2.5">
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>1 Standard verified account</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>Download to listen offline</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>Very high audio quality (up to ~320kbps)</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>Subscribe or one-time payment: Permanent Lifetime</span>
              </div>
            </div>

            {/* Buttons inside Plan Card */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {}}
                className="w-full py-3.5 px-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-tight transition-transform cursor-pointer"
              >
                Active Forever
              </button>
              <button
                onClick={() => {}}
                className="w-full py-3.5 px-6 rounded-full bg-transparent hover:bg-white/5 border border-white/40 text-white font-extrabold text-sm tracking-tight transition-colors cursor-pointer"
              >
                Permanent Entitlement
              </button>
            </div>

            <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
              Your Spotify Premium account is active permanently. Terms apply.
            </p>
          </motion.div>

          {/* Platinum / Unlimited Plan Card */}
          <div className="rounded-3xl bg-[#181818] border border-white/10 p-6 space-y-5 shadow-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SpotifyLogo size={18} />
                <span className="text-xs font-bold text-neutral-300">Premium</span>
              </div>
              <h3 className="text-3xl font-black text-amber-300 tracking-tight">
                Platinum
              </h3>
              <p className="text-lg font-bold text-white">
                Unlimited Lossless Audio
              </p>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2.5">
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>Up to 3 Platinum accounts</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>Download to listen offline</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>Lossless audio quality (up to ~24-bit/44.1kHz)</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>Mix your playlists & Your personal AI DJ</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>AI playlist creation & Connect your DJ software</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-neutral-200">
                <span className="text-neutral-400">•</span>
                <span>Included in your Unlimited Account</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {}}
                className="w-full py-3.5 px-6 rounded-full bg-amber-300 hover:bg-amber-200 text-black font-extrabold text-sm tracking-tight transition-transform cursor-pointer"
              >
                Included with Premium
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

