import React, { useState, useMemo, useEffect } from 'react';
import { ViewState, Track } from '../../types';
import { useUser } from '../../context/UserContext';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';
import { SettingsHeader, SettingsToggle, SettingsRow } from './components/SettingsComponents';
import { PWAInstallButton } from '../../components/Common/PWAInstallButton';
import { api } from '../../services/apiClient';
import { 
 User, Check, Trash2, Eye, EyeOff, Search, HardDrive, 
 Shield, Smartphone, Laptop, Sparkles, Moon, Sun, Bell,
 Volume2, Music, Wifi, Radio, Layers, Sliders, Globe,
 HelpCircle, FileText, Loader2, Info
} from 'lucide-react';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

// ==========================================
// 1. Account Settings
// ==========================================
export const AccountSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const { profile, logoutUser } = useUser();
 const [showCloseModal, setShowCloseModal] = useState(false);

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Account" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-6">
    
    {/* User Profile Card */}
    <div className="flex items-center gap-4 p-5 bg-[#181818] rounded-2xl border border-white/5 shadow-sm">
     {profile?.avatar ? (
      <img 
       src={profile.avatar} 
       alt={profile.name || 'User'} 
       className="w-16 h-16 rounded-full object-cover border border-white/10"
      />
     ) : (
      <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 border border-white/10">
       <User className="w-8 h-8" />
      </div>
     )}
     <div className="min-w-0 flex-1">
      <h2 className="text-lg font-bold text-white truncate">{profile?.name || 'Spotiz User'}</h2>
      <p className="text-xs text-neutral-400 truncate">{profile?.email || 'Logged in via active session'}</p>
      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
       <Sparkles className="w-3 h-3" />
       Spotiz Premium Active
      </div>
     </div>
    </div>

    {/* Account Details */}
    <div className="space-y-1">
     <div className="py-3 px-2 border-b border-white/5 flex items-center justify-between">
      <div>
       <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Username</p>
       <p className="text-sm text-white font-medium mt-0.5">{profile?.username || profile?.name || 'user'}</p>
      </div>
     </div>
     <div className="py-3 px-2 border-b border-white/5 flex items-center justify-between">
      <div>
       <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Email</p>
       <p className="text-sm text-white font-medium mt-0.5">{profile?.email || 'Registered account'}</p>
      </div>
     </div>
     <div className="py-3 px-2 border-b border-white/5 flex items-center justify-between">
      <div>
       <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Subscription Plan</p>
       <p className="text-sm text-emerald-400 font-medium mt-0.5">Spotiz Premium (Ad-Free & Lossless)</p>
      </div>
     </div>
     <div className="py-3 px-2 border-b border-white/5 flex items-center justify-between">
      <div>
       <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Country / Region</p>
       <p className="text-sm text-white font-medium mt-0.5">India (Global Catalog)</p>
      </div>
     </div>
    </div>

    {/* Close Account */}
    <div className="pt-4">
     <button
      type="button"
      onClick={() => setShowCloseModal(true)}
      className="w-full py-3.5 px-4 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 active:scale-[0.99] transition-all text-sm font-semibold text-left flex items-center justify-between cursor-pointer"
     >
      <span>Close account & sign out</span>
      <Trash2 className="w-4 h-4 text-red-400" />
     </button>
     <p className="text-xs text-neutral-500 mt-2 px-1">
      Closing your account deletes your synced playlists and custom preferences from this device.
     </p>
    </div>
   </div>

   <ConfirmationModal
    isOpen={showCloseModal}
    title="Close Account"
    description="Are you sure you want to log out and clear your active account session?"
    confirmLabel="Close Account"
    cancelLabel="Cancel"
    isDestructive={true}
    onConfirm={async () => {
     setShowCloseModal(false);
     await logoutUser();
    }}
    onCancel={() => setShowCloseModal(false)}
   />
  </div>
 );
};

// ==========================================
// 2. Content and Display Settings
// ==========================================
export const ContentDisplaySettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const { canvasEnabled, setCanvasEnabled, dataSaver } = usePlayer();
 const { theme, setTheme } = useTheme();
 const { profile, updateSettings, showToast } = useUser();
 
 const showUnplayable = profile?.settings?.showUnplayable ?? true;
 const filterExplicit = profile?.settings?.filterExplicit ?? false;

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Content and display" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-6">
    
    {/* Canvas Visuals Toggle */}
    <div className="space-y-1">
     <SettingsToggle
      title="Canvas"
      subtitle="Display short, looping visuals on tracks. When Data Saver mode is active, Canvas is automatically turned off."
      checked={canvasEnabled && !dataSaver}
      disabled={dataSaver}
      onChange={(v) => {
       if (!dataSaver) setCanvasEnabled(v);
      }}
     />
     {dataSaver && (
      <p className="text-xs text-amber-400/90 px-2 mt-1">
       Canvas is currently disabled because Data Saver is turned on.
      </p>
     )}
    </div>

    {/* Show Unplayable Songs */}
    <SettingsToggle
     title="Show unplayable songs"
     subtitle="Show songs that aren't available in your region or current connection as greyed out items."
     checked={showUnplayable}
     onChange={(v) => {
      updateSettings({ showUnplayable: v });
      showToast(v ? 'Showing unplayable tracks' : 'Hiding unplayable tracks');
     }}
    />

    {/* Filter Explicit Content */}
    <SettingsToggle
     title="Filter explicit content"
     subtitle="Turn off to prevent playback of explicit-rated tracks and podcasts."
     checked={filterExplicit}
     onChange={(v) => {
      updateSettings({ filterExplicit: v });
      showToast(v ? 'Explicit content filter active' : 'Explicit content allowed');
     }}
    />

    {/* Theme Preference */}
    <div className="pt-4 border-t border-white/5">
     <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-3">Theme</h3>
     <div className="grid grid-cols-2 gap-3">
      <button
       type="button"
       onClick={() => setTheme('dark')}
       className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
        theme === 'dark'
         ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm'
         : 'bg-[#181818] border-white/5 text-neutral-400 hover:bg-[#202020]'
       }`}
      >
       <div className="flex items-center gap-2.5">
        <Moon className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-semibold text-white">Dark Theme</span>
       </div>
       {theme === 'dark' && <Check className="w-4 h-4 text-emerald-400" />}
      </button>
      <button
       type="button"
       onClick={() => setTheme('light')}
       className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
        theme === 'light'
         ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm'
         : 'bg-[#181818] border-white/5 text-neutral-400 hover:bg-[#202020]'
       }`}
      >
       <div className="flex items-center gap-2.5">
        <Sun className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-white">Light Theme</span>
       </div>
       {theme === 'light' && <Check className="w-4 h-4 text-emerald-400" />}
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

// ==========================================
// 3. Privacy and Social Settings
// ==========================================
export const PrivacySocialSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const { profile, updateSettings } = useUser();

 const isPrivate = profile?.settings?.privateSession ?? false;
 const listeningActivity = profile?.settings?.listeningActivity ?? true;
 const recentArtistsVisible = profile?.settings?.recentArtistsVisible ?? true;
 const publicPlaylistsDefault = profile?.settings?.publicPlaylistsDefault ?? true;

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Privacy and social" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-6">
    
    {/* Private Session */}
    <SettingsToggle
     title="Private session"
     subtitle="Temporarily hide your listening activity and newly played tracks from recommendations, followers, and taste profiling."
     checked={isPrivate}
     onChange={(v) => updateSettings({ privateSession: v })}
    />

    {/* Listening Activity */}
    <SettingsToggle
     title="Listening activity"
     subtitle="Share what you are currently listening to on your public profile and with your followers."
     checked={listeningActivity}
     onChange={(v) => updateSettings({ listeningActivity: v })}
    />

    {/* Recently Played Artists */}
    <SettingsToggle
     title="Recently played artists"
     subtitle="Show your top and recently played artists on your public Spotiz profile."
     checked={recentArtistsVisible}
     onChange={(v) => updateSettings({ recentArtistsVisible: v })}
    />

    {/* Public Playlists Default */}
    <SettingsToggle
     title="Make new playlists public"
     subtitle="Automatically make new playlists you create visible on your profile."
     checked={publicPlaylistsDefault}
     onChange={(v) => updateSettings({ publicPlaylistsDefault: v })}
    />

    <div className="p-4 bg-[#181818] rounded-2xl border border-white/5 space-y-2">
     <div className="flex items-center gap-2 text-emerald-400">
      <Shield className="w-5 h-5" />
      <h4 className="text-sm font-bold text-white">Privacy Protection</h4>
     </div>
     <p className="text-xs text-neutral-400 leading-relaxed">
      Spotiz never shares your private listening data or history with third-party tracking networks.
     </p>
    </div>
   </div>
  </div>
 );
};

// ==========================================
// 4. Playback Settings
// ==========================================
export const PlaybackSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const { profile, updateSettings, showToast } = useUser();
 const [volumeLevel, setVolumeLevel] = useState<'normal' | 'quiet' | 'loud'>('normal');

 const crossfade = profile?.settings?.crossfadeDuration ?? 4;
 const gapless = profile?.settings?.gaplessPlayback ?? true;
 const automix = profile?.settings?.automix ?? true;
 const normalizeVolume = profile?.settings?.normalizeVolume ?? true;
 const monoAudio = profile?.settings?.monoAudio ?? false;
 const autoPlay = profile?.settings?.autoPlaySimilar ?? true;

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Playback" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-6">
    
    {/* Autoplay Similar Content */}
    <SettingsToggle
     title="Autoplay similar content"
     subtitle="Enjoy non-stop listening. When your current track or playlist finishes, we'll automatically play similar songs from related artists."
     checked={autoPlay}
     onChange={(v) => updateSettings({ autoPlaySimilar: v })}
    />

    {/* Crossfade Duration Slider */}
    <div className="py-3 px-2 border-t border-white/5 space-y-2">
     <div className="flex items-center justify-between">
      <div>
       <h3 className="text-sm sm:text-base font-medium text-white">Crossfade</h3>
       <p className="text-xs text-neutral-400 mt-0.5">
        Allows seamless fading between songs.
       </p>
      </div>
      <span className="text-sm font-bold text-emerald-400">
       {crossfade === 0 ? 'Off' : `${crossfade}s`}
      </span>
     </div>
     <input
      type="range"
      min="0"
      max="12"
      step="1"
      value={crossfade}
      onChange={(e) => updateSettings({ crossfadeDuration: Number(e.target.value) })}
      className="w-full accent-emerald-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
     />
     <div className="flex justify-between text-[11px] text-neutral-500 px-1 font-mono">
      <span>0s (Off)</span>
      <span>6s</span>
      <span>12s</span>
     </div>
    </div>

    {/* Gapless Playback */}
    <SettingsToggle
     title="Gapless playback"
     subtitle="Eliminate silence between tracks for uninterrupted live concert and album playback."
     checked={gapless}
     onChange={(v) => updateSettings({ gaplessPlayback: v })}
    />

    {/* Automix */}
    <SettingsToggle
     title="Automix"
     subtitle="Allows smooth, intelligent transitions between tracks on select playlists and DJ mixes."
     checked={automix}
     onChange={(v) => updateSettings({ automix: v })}
    />

    {/* Normalize Volume */}
    <div className="border-t border-white/5 pt-3 space-y-3">
     <SettingsToggle
      title="Normalize volume"
      subtitle="Automatically adjust audio levels to prevent sudden volume spikes between different tracks."
      checked={normalizeVolume}
      onChange={(v) => updateSettings({ normalizeVolume: v })}
     />

     {normalizeVolume && (
      <div className="px-2 pt-1">
       <p className="text-xs text-neutral-400 font-semibold mb-2">Volume Level</p>
       <div className="grid grid-cols-3 gap-2">
        {[
         { id: 'quiet', label: 'Quiet', desc: 'Relaxing environment' },
         { id: 'normal', label: 'Normal', desc: 'Standard default' },
         { id: 'loud', label: 'Loud', desc: 'Noisy environment' },
        ].map((lvl) => (
         <button
          key={lvl.id}
          type="button"
          onClick={() => {
           setVolumeLevel(lvl.id as any);
           showToast(`Volume level set to ${lvl.label}`);
          }}
          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
           volumeLevel === lvl.id
            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-bold'
            : 'bg-[#181818] border-white/5 text-neutral-300 hover:bg-[#202020]'
          }`}
         >
          <p className="text-xs font-bold">{lvl.label}</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">{lvl.desc}</p>
         </button>
        ))}
       </div>
      </div>
     )}
    </div>

    {/* Mono Audio */}
    <SettingsToggle
     title="Mono audio"
     subtitle="Makes the left and right speakers play the identical audio channel for single-earbud listening."
     checked={monoAudio}
     onChange={(v) => updateSettings({ monoAudio: v })}
    />
   </div>
  </div>
 );
};

// ==========================================
// 5. Notifications Settings
// ==========================================
export const NotificationsSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const { profile, updateSettings, showToast } = useUser();
 
 const browserPushEnabled = profile?.settings?.browserPushEnabled ?? false;
 const musicArtistUpdates = profile?.settings?.musicArtistUpdates ?? true;
 const playlistRadar = profile?.settings?.playlistRadar ?? true;
 const inAppAlerts = profile?.settings?.inAppAlerts ?? true;
 const emailNews = profile?.settings?.emailNews ?? false;
 const monthlyDigest = profile?.settings?.monthlyDigest ?? true;

 const handleTogglePush = async (val: boolean) => {
  if (val && typeof window !== 'undefined' && 'Notification' in window) {
   const permission = await Notification.requestPermission();
   if (permission === 'granted') {
    updateSettings({ browserPushEnabled: true });
    showToast('Push notifications enabled');
   } else {
    updateSettings({ browserPushEnabled: false });
    showToast('Notification permission was not granted');
   }
  } else {
   updateSettings({ browserPushEnabled: val });
   showToast('Notifications updated');
  }
 };

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Notifications" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-6">
    
    {/* Push Notifications Category */}
    <div>
     <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Push Notifications</h3>
     <div className="space-y-1">
      <SettingsToggle
       title="Push notifications master toggle"
       subtitle="Receive instant browser and device alerts for your music."
       checked={browserPushEnabled}
       onChange={handleTogglePush}
      />
      <SettingsToggle
       title="Music & Artist updates"
       subtitle="Get alerts when artists you follow drop new singles, albums, or live events."
       checked={musicArtistUpdates}
       onChange={(v) => updateSettings({ musicArtistUpdates: v })}
      />
      <SettingsToggle
       title="Playlist updates & Radar"
       subtitle="Recommendations based on your weekly listening habits."
       checked={playlistRadar}
       onChange={(v) => updateSettings({ playlistRadar: v })}
      />
      <SettingsToggle
       title="In-app alerts"
       subtitle="Show mini notifications inside the player for queue and playlist updates."
       checked={inAppAlerts}
       onChange={(v) => updateSettings({ inAppAlerts: v })}
      />
     </div>
    </div>

    {/* Email Notifications Category */}
    <div className="pt-4 border-t border-white/5">
     <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Email Notifications</h3>
     <div className="space-y-1">
      <SettingsToggle
       title="News and product offers"
       subtitle="Hear about new Spotiz features, exclusive beta releases, and special partner perks."
       checked={emailNews}
       onChange={(v) => updateSettings({ emailNews: v })}
      />
      <SettingsToggle
       title="Monthly streaming digest"
       subtitle="Get a summary of your most played artists, top tracks, and hours listened."
       checked={monthlyDigest}
       onChange={(v) => updateSettings({ monthlyDigest: v })}
      />
     </div>
    </div>

    <div className="p-4 bg-[#181818] rounded-2xl border border-white/5 flex items-start gap-3">
     <Bell className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
     <div className="text-xs text-neutral-400 leading-relaxed">
      You can modify individual notification permissions or disable browser alerts anytime in your browser settings.
     </div>
    </div>
   </div>
  </div>
 );
};

// ==========================================
// 6. Apps and Devices Settings
// ==========================================
export const AppsDevicesSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const browserInfo = typeof navigator !== 'undefined' ? navigator.userAgent : 'Spotiz Web Player';
 const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);
 const { profile, updateSettings } = useUser();
 
 const deviceBroadcast = profile?.settings?.deviceBroadcast ?? true;
 const localDevicesOnly = profile?.settings?.localDevicesOnly ?? false;

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Apps and devices" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-6">
    
    {/* Current Active Device */}
    <div>
     <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Current Active Device</h3>
     <div className="flex items-center gap-4 p-4 bg-[#181818] rounded-2xl border border-emerald-500/30">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
       {isMobile ? <Smartphone className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
      </div>
      <div className="min-w-0 flex-1">
       <div className="flex items-center gap-2">
        <p className="font-bold text-sm text-white">This Device</p>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold">
         Active
        </span>
       </div>
       <p className="text-xs text-neutral-400 mt-0.5 truncate">{browserInfo}</p>
      </div>
     </div>
    </div>

    {/* Device Broadcast Status */}
    <SettingsToggle
     title="Device Broadcast Status"
     subtitle="Allow other apps on your device to see what you are listening to (e.g. Discord, Smart Car, Lock Screen media)."
     checked={deviceBroadcast}
     onChange={(v) => updateSettings({ deviceBroadcast: v })}
    />

    {/* Show Local Devices Only */}
    <SettingsToggle
     title="Show local devices only"
     subtitle="Only show speakers and devices on your local Wi-Fi or Bluetooth network in the Connect menu."
     checked={localDevicesOnly}
     onChange={(v) => updateSettings({ localDevicesOnly: v })}
    />

    <div className="p-4 bg-[#181818] rounded-2xl border border-white/5 text-xs text-neutral-400 leading-relaxed">
     Playback runs with hardware acceleration directly inside your device's audio pipeline. Install the PWA for background and lockscreen audio controls.
    </div>
   </div>
  </div>
 );
};

// ==========================================
// 7. Data-Saving and Offline Settings
// ==========================================
export const DataOfflineSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const { dataSaver, setDataSaver } = usePlayer();
 const { profile, updateSettings, downloadedTracksList, clearAllDownloads, showToast } = useUser();
 const [showClearModal, setShowClearModal] = useState(false);
 
 const audioOnly = profile?.settings?.audioOnly ?? false;
 const downloadWifiOnly = profile?.settings?.downloadWifiOnly ?? true;
 const storageMb = (downloadedTracksList.length * 7.8).toFixed(1);

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Data-saving and offline" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-6">
    
    {/* Data Saver Mode */}
    <SettingsToggle
     title="Data Saver mode"
     subtitle="Sets audio streaming quality to low (24k) and disables Canvas looping video backgrounds."
     checked={dataSaver}
     onChange={setDataSaver}
    />

    {/* Audio Only Mode */}
    <SettingsToggle
     title="Audio-only streaming"
     subtitle="Save bandwidth by streaming only audio and disabling all video canvas tracks."
     checked={audioOnly}
     onChange={(v) => updateSettings({ audioOnly: v })}
    />

    {/* Download Cellular */}
    <SettingsToggle
     title="Download over cellular"
     subtitle="Allow downloading offline tracks using mobile cellular data. When off, downloads pause until connected to Wi-Fi."
     checked={!downloadWifiOnly}
     onChange={(v) => updateSettings({ downloadWifiOnly: !v })}
    />

    {/* Storage Breakdown & Cache */}
    <div className="pt-4 border-t border-white/5 space-y-4">
     <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-white/5 text-emerald-400">
       <HardDrive className="w-5 h-5" />
      </div>
      <div>
       <h3 className="text-sm font-bold text-white">Offline Storage</h3>
       <p className="text-xs text-neutral-400">
        {downloadedTracksList.length} downloaded {downloadedTracksList.length === 1 ? 'track' : 'tracks'} ({storageMb} MB cached)
       </p>
      </div>
     </div>

     <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden flex">
      <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, Math.max(8, downloadedTracksList.length * 5))}%` }} />
      <div className="bg-neutral-600 h-full flex-1" />
     </div>
     <div className="flex justify-between text-[11px] text-neutral-400">
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Offline Music ({storageMb} MB)</span>
      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-600 inline-block" /> Free Storage</span>
     </div>

     <button
      type="button"
      onClick={() => setShowClearModal(true)}
      className="w-full py-3.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 active:scale-[0.99] transition-all text-sm font-semibold text-neutral-300 hover:text-white flex items-center justify-between cursor-pointer"
     >
      <span>Clear offline cache & downloads</span>
      <Trash2 className="w-4 h-4 text-neutral-400" />
     </button>
    </div>
   </div>

   <ConfirmationModal
    isOpen={showClearModal}
    title="Clear Offline Cache"
    description={`This will delete all ${downloadedTracksList.length} downloaded tracks and cached audio data from your device.`}
    confirmLabel="Clear Cache"
    cancelLabel="Cancel"
    isDestructive={true}
    onConfirm={async () => {
     setShowClearModal(false);
     await clearAllDownloads();
     showToast('Offline cache cleared');
    }}
    onCancel={() => setShowClearModal(false)}
   />
  </div>
 );
};

// ==========================================
// 8. Media Quality Settings
// ==========================================
export const MediaQualitySettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const { audioQuality, setAudioQuality } = usePlayer();
 const { profile, updateSettings, showToast } = useUser();
 
 const cellularQuality = profile?.settings?.audioQuality ?? 'high';
 const downloadQuality = profile?.settings?.audioDownloadQuality ?? 'very_high';
 const autoAdjust = profile?.settings?.autoAdjust ?? true;

 const qualityOptions = [
  { id: 'normal', label: 'Normal', bitrate: '96 kbit/s', desc: 'Saves data, fast buffering' },
  { id: 'high', label: 'High', bitrate: '160 kbit/s', desc: 'Standard high-definition audio' },
  { id: 'very_high', label: 'Very High (Hi-Fi)', bitrate: '320 kbit/s', desc: 'Lossless studio clarity' },
 ];

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Media quality" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-6">
    
    {/* Wi-Fi Streaming Quality */}
    <div>
     <h3 className="text-sm font-bold text-white mb-1">Wi-Fi streaming quality</h3>
     <p className="text-xs text-neutral-400 mb-3">Audio resolution when connected to Wi-Fi.</p>
     
     <div className="space-y-2">
      {qualityOptions.map((q) => (
       <button
        key={q.id}
        type="button"
        onClick={() => {
         setAudioQuality(q.id as any);
         showToast(`Wi-Fi quality set to ${q.label}`);
        }}
        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
         audioQuality === q.id
          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
          : 'bg-[#181818] border-white/5 text-neutral-300 hover:bg-[#202020]'
        }`}
       >
        <div>
         <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white">{q.label}</span>
          <span className="text-xs text-emerald-400 font-semibold">({q.bitrate})</span>
         </div>
         <p className="text-xs text-neutral-400 mt-0.5">{q.desc}</p>
        </div>
        {audioQuality === q.id && <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
       </button>
      ))}
     </div>
    </div>

    {/* Cellular Streaming Quality */}
    <div className="pt-4 border-t border-white/5">
     <h3 className="text-sm font-bold text-white mb-1">Cellular streaming quality</h3>
     <p className="text-xs text-neutral-400 mb-3">Audio resolution when on mobile data.</p>
     <div className="grid grid-cols-3 gap-2">
      {qualityOptions.map((q) => (
       <button
        key={q.id}
        type="button"
        onClick={() => {
         updateSettings({ audioQuality: q.id as any });
         showToast(`Cellular quality set to ${q.label}`);
        }}
        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
         cellularQuality === q.id
          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-bold'
          : 'bg-[#181818] border-white/5 text-neutral-300 hover:bg-[#202020]'
        }`}
       >
        <p className="text-xs font-bold">{q.label}</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">{q.bitrate}</p>
       </button>
      ))}
     </div>
    </div>

    {/* Auto Adjust Quality */}
    <SettingsToggle
     title="Auto-adjust quality"
     subtitle="Dynamically adjust audio streaming bitrate when connection is weak to prevent stuttering."
     checked={autoAdjust}
     onChange={(v) => updateSettings({ autoAdjust: v })}
    />

    {/* Download Audio Quality */}
    <div className="pt-4 border-t border-white/5">
     <h3 className="text-sm font-bold text-white mb-1">Download quality</h3>
     <p className="text-xs text-neutral-400 mb-3">Audio resolution for downloaded offline songs.</p>
     <div className="grid grid-cols-3 gap-2">
      {qualityOptions.map((q) => (
       <button
        key={q.id}
        type="button"
        onClick={() => {
         updateSettings({ audioDownloadQuality: q.id as any });
         showToast(`Download quality set to ${q.label}`);
        }}
        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
         downloadQuality === q.id
          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-bold'
          : 'bg-[#181818] border-white/5 text-neutral-300 hover:bg-[#202020]'
        }`}
       >
        <p className="text-xs font-bold">{q.label}</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">{q.bitrate}</p>
       </button>
      ))}
     </div>
    </div>
   </div>
  </div>
 );
};

// ==========================================
// 9. Advertisements Settings
// ==========================================
export const AdvertisementsSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const { profile, updateSettings } = useUser();
 const tailoredAds = profile?.settings?.tailoredAds ?? false;
 const thirdPartyAds = profile?.settings?.thirdPartyAds ?? false;

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Advertisements" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-6">
    
    {/* Ad-Free Premium Active Card */}
    <div className="p-6 bg-gradient-to-b from-emerald-950/40 to-[#181818] rounded-2xl border border-emerald-500/30 text-center space-y-3">
     <div className="w-14 h-14 mx-auto bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
      <Sparkles className="w-7 h-7" />
     </div>
     <h2 className="text-xl font-black text-white tracking-tight">100% Ad-Free Experience</h2>
     <p className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
      Your account currently has <span className="text-emerald-400 font-bold">Premium active</span>. Audio ads and third-party sponsored interruptions are completely disabled.
     </p>
    </div>

    {/* Tailored Ads Toggle */}
    <SettingsToggle
     title="Tailored advertisements"
     subtitle="Allow personalized partner offers tailored to your musical genre tastes."
     checked={tailoredAds}
     onChange={(v) => updateSettings({ tailoredAds: v })}
    />

    {/* Third-Party Data Toggle */}
    <SettingsToggle
     title="Third-party data sharing"
     subtitle="Allow anonymous metrics sharing with certified music industry analytics partners."
     checked={thirdPartyAds}
     onChange={(v) => updateSettings({ thirdPartyAds: v })}
    />
   </div>
  </div>
 );
};

// ==========================================
// 10. Hide Songs Settings (With Real Metadata Resolution)
// ==========================================
export const HideSongsSettings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const { 
  hiddenTrackIds, 
  hiddenTracksMap,
  unhideTrack, 
  saveHiddenTrackMeta,
  showToast, 
  likedTracksList, 
  downloadedTracksList,
  profile 
 } = useUser();
 const [filterQuery, setFilterQuery] = useState('');
 const [showUnhideAllModal, setShowUnhideAllModal] = useState(false);
 const [fetchedMetaMap, setFetchedMetaMap] = useState<Record<string, any>>({});
 const [isLoadingMeta, setIsLoadingMeta] = useState(false);

 const hiddenArray = useMemo(() => Array.from(hiddenTrackIds), [hiddenTrackIds]);

 // Asynchronous effect: Automatically resolve real title, artist, and image for hidden tracks!
 useEffect(() => {
  let isCancelled = false;

  const resolveMissingTrackData = async () => {
   const missingIds = hiddenArray.filter((id) => {
    const inContextMap = hiddenTracksMap[id];
    const inFetched = fetchedMetaMap[id];
    return !inContextMap && !inFetched;
   });

   if (missingIds.length === 0) return;

   setIsLoadingMeta(true);
   for (const id of missingIds) {
    if (isCancelled) break;
    try {
     // Check if in liked or downloaded tracks first
     const localTrack = likedTracksList.find(t => t.id === id) || downloadedTracksList.find(t => t.id === id);
     if (localTrack) {
      saveHiddenTrackMeta(localTrack);
      setFetchedMetaMap(prev => ({ ...prev, [id]: localTrack }));
      continue;
     }

     // Fetch from API
     const res = await api.getTrack(id);
     if (res.success && res.data) {
      const trackData = res.data;
      saveHiddenTrackMeta(trackData);
      if (!isCancelled) {
       setFetchedMetaMap(prev => ({ ...prev, [id]: trackData }));
      }
     }
    } catch (e) {
     console.warn(`Could not resolve track ${id}`, e);
    }
   }
   if (!isCancelled) setIsLoadingMeta(false);
  };

  resolveMissingTrackData();

  return () => {
   isCancelled = true;
  };
 }, [hiddenArray, hiddenTracksMap, likedTracksList, downloadedTracksList, saveHiddenTrackMeta]);

 // Build resolved track items with full metadata
 const hiddenTracksWithMeta = useMemo(() => {
  const cachedStats = profile?.interactionStats?.trackCache || {};
  const trackMap = new Map<string, any>();
  
  // Seed with context maps & lists
  likedTracksList.forEach((t) => trackMap.set(t.id, t));
  downloadedTracksList.forEach((t) => trackMap.set(t.id, t));
  Object.entries(hiddenTracksMap).forEach(([id, t]) => trackMap.set(id, t));
  Object.entries(fetchedMetaMap).forEach(([id, t]) => trackMap.set(id, t));
  Object.entries(cachedStats).forEach(([id, t]) => {
   if (!trackMap.has(id)) trackMap.set(id, t);
  });

  return hiddenArray.map((id) => {
   const meta = trackMap.get(id);
   
   let title = meta?.title;
   let artist = meta?.artist;
   let image = meta?.images?.medium || meta?.images?.small || meta?.images?.large || meta?.image || '';

   // Fallback formatting if metadata is still resolving
   if (!title) {
    title = `Hidden Song (#${id.slice(-6)})`;
   }
   if (!artist) {
    artist = 'Spotiz Artist';
   }

   return {
    id,
    title,
    artist,
    image,
    duration: meta?.duration,
   };
  });
 }, [hiddenArray, hiddenTracksMap, fetchedMetaMap, likedTracksList, downloadedTracksList, profile]);

 const filteredList = useMemo(() => {
  if (!filterQuery.trim()) return hiddenTracksWithMeta;
  const q = filterQuery.toLowerCase().trim();
  return hiddenTracksWithMeta.filter(
   (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.id.includes(q)
  );
 }, [hiddenTracksWithMeta, filterQuery]);

 const handleUnhideAll = () => {
  hiddenArray.forEach((id) => unhideTrack(id));
  setShowUnhideAllModal(false);
  showToast('All hidden songs have been restored');
 };

 return (
  <div className=" min-h-full text-white select-none">
   <SettingsHeader title="Hide Songs" onBack={onBack} />
   <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-5">
    <div>
     <h2 className="text-lg font-bold text-white">Hidden Songs</h2>
     <p className="text-xs text-neutral-400 mt-0.5">
      Songs you've chosen not to hear will be excluded from recommendations, radio, and autoplay.
     </p>
    </div>

    {hiddenArray.length > 0 ? (
     <>
      {/* Filter Search Input */}
      <div className="relative">
       <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
       <input
        type="text"
        value={filterQuery}
        onChange={(e) => setFilterQuery(e.target.value)}
        placeholder="Search hidden songs"
        className="w-full py-2.5 pl-10 pr-4 bg-[#181818] border border-white/5 rounded-full text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
       />
      </div>

      {/* Unhide All Bar */}
      <div className="flex items-center justify-between pt-1">
       <span className="text-xs font-semibold text-neutral-400 flex items-center gap-2">
        <span>{hiddenArray.length} hidden {hiddenArray.length === 1 ? 'song' : 'songs'}</span>
        {isLoadingMeta && <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />}
       </span>
       <button
        type="button"
        onClick={() => setShowUnhideAllModal(true)}
        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
       >
        Unhide all
       </button>
      </div>

      {/* Songs List */}
      <div className="space-y-2 pt-2">
       {filteredList.map((track) => (
        <div
         key={track.id}
         className="flex items-center justify-between p-3 bg-[#181818] hover:bg-[#202020] rounded-xl border border-white/5 transition-all shadow-sm group"
        >
         <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
          {track.image ? (
           <img 
            src={track.image} 
            alt={track.title} 
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 shadow-sm border border-white/5" 
           />
          ) : (
           <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Music className="w-6 h-6" />
           </div>
          )}
          <div className="min-w-0 flex-1">
           <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
            {track.title}
           </p>
           <p className="text-xs text-neutral-400 truncate mt-0.5">
            {track.artist}
           </p>
          </div>
         </div>
         <button
          type="button"
          onClick={() => {
           unhideTrack(track.id);
           showToast(`Restored"${track.title}"`);
          }}
          className="px-4 py-1.5 rounded-full border border-white/20 hover:border-emerald-400 text-xs font-bold text-white hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 transition-all cursor-pointer flex-shrink-0"
         >
          Unhide
         </button>
        </div>
       ))}
      </div>
     </>
    ) : (
     <div className="py-16 text-center text-neutral-500 space-y-3">
      <div className="w-12 h-12 mx-auto bg-white/5 rounded-2xl flex items-center justify-center text-neutral-400">
       <Eye className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-neutral-300">You have no hidden songs.</p>
      <p className="text-xs text-neutral-500 max-w-xs mx-auto">
       When you hide songs from track options, they will appear here with full cover artwork and details.
      </p>
     </div>
    )}
   </div>

   <ConfirmationModal
    isOpen={showUnhideAllModal}
    title="Unhide All Songs"
    description="Are you sure you want to restore all hidden songs to your recommendations and discovery feeds?"
    confirmLabel="Unhide All"
    cancelLabel="Cancel"
    onConfirm={handleUnhideAll}
    onCancel={() => setShowUnhideAllModal(false)}
   />
  </div>
 );
};

// ==========================================
// 11. About and Support Settings
// ==========================================
export const AboutSupportSettings: React.FC<{ 
 onBack: () => void;
 onNavigate?: (view: ViewState) => void;
}> = ({ onBack, onNavigate }) => (
 <div className=" min-h-full text-white select-none">
  <SettingsHeader title="About and support" onBack={onBack} />
  <div className="px-4 md:px-8 max-w-3xl mx-auto space-y-5">
   
   {/* App Version Card */}
   <div className="p-4 bg-[#181818] rounded-2xl border border-white/5 space-y-1">
    <h3 className="text-sm font-bold text-white">Spotiz Music Streamer</h3>
    <p className="text-xs text-emerald-400 font-medium">Version 2.0.4 (Build 2026.09.06 - Hi-Fi Edition)</p>
    <p className="text-[11px] text-neutral-400">Licensed audio streaming client & Web Audio synthesis engine.</p>
   </div>

   {/* Navigation Rows */}
   <div className="space-y-1">
    <SettingsRow 
     icon={<FileText className="w-5 h-5 text-neutral-400" />}
     title="Terms and Conditions" 
     subtitle="Usage agreements, rights, and streaming terms" 
     onClick={() => {
      if (onNavigate) onNavigate({ type: 'info', pageId: 'terms' });
     }} 
    />
    <SettingsRow 
     icon={<Shield className="w-5 h-5 text-neutral-400" />}
     title="Privacy Policy" 
     subtitle="How your private data & preferences are protected" 
     onClick={() => {
      if (onNavigate) onNavigate({ type: 'info', pageId: 'privacy' });
     }} 
    />
    <SettingsRow 
     icon={<HelpCircle className="w-5 h-5 text-neutral-400" />}
     title="Support & Help Center" 
     subtitle="Audio troubleshooting, offline cache, and playback FAQ" 
     onClick={() => {
      if (onNavigate) onNavigate({ type: 'info', pageId: 'support' });
     }} 
    />
    <SettingsRow 
     icon={<Layers className="w-5 h-5 text-neutral-400" />}
     title="Third-Party Software" 
     subtitle="Open-source licenses and audio libraries" 
     onClick={() => {
      if (onNavigate) onNavigate({ type: 'info', pageId: 'third-party' });
     }} 
    />
    <SettingsRow 
     icon={<Info className="w-5 h-5 text-neutral-400" />}
     title="About Spotiz" 
     subtitle="Our mission, lossless audio technology, and team" 
     onClick={() => {
      if (onNavigate) onNavigate({ type: 'info', pageId: 'about' });
     }} 
    />
   </div>

   <div className="pt-4 border-t border-white/5">
    <PWAInstallButton variant="full" />
   </div>
  </div>
 </div>
);
