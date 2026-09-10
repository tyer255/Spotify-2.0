import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { usePlayer } from '../../context/PlayerContext';
import { SettingsPage } from './types';
import { SettingsRow } from './components/SettingsComponents';
import { 
 User, Music2, Lock, Volume2, Bell, Tv2, 
 ArrowDownCircle, Sliders, Sparkles, EyeOff, Info,
 Search, ArrowLeft, BarChart2, Laptop, CheckCircle2
} from 'lucide-react';
import { ConfirmationModal } from '../../components/Common/ConfirmationModal';

export const SettingsHome: React.FC<{
 onNavigate: (page: SettingsPage) => void;
 onGlobalBack: () => void;
 onSearch: () => void;
}> = ({ onNavigate, onGlobalBack, onSearch }) => {
 const { profile, updateSettings, logoutUser } = useUser();
 const { dataSaver, setDataSaver } = usePlayer();
 const [showLogoutModal, setShowLogoutModal] = useState(false);

 const isPrivate = profile?.settings?.privateSession || false;

 return (
  <div className=" min-h-full text-white select-none bg-black">
   {/* Sticky Header */}
   <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md pb-3 pt-3 mb-2 border-b border-white/5">
    <div className="flex items-center justify-between px-4 md:px-6 max-w-2xl mx-auto">
     <button 
      type="button"
      onClick={onGlobalBack} 
      className="p-1 -ml-1 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
      aria-label="Go Back"
     >
      <ArrowLeft className="w-6 h-6" />
     </button>
     <h1 className="text-[17px] font-bold text-white tracking-wide">Settings</h1>
     <button 
      type="button"
      onClick={onSearch} 
      className="p-1 -mr-1 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
      aria-label="Search Settings"
     >
      <Search className="w-6 h-6" />
     </button>
    </div>
   </div>

   <div className="px-4 md:px-6 max-w-2xl mx-auto space-y-5 pt-2">
    
    {/* Account Plan Header (Free account - Premium Active) */}
    <div className="text-center py-2 flex flex-col items-center">
     <h2 className="text-xl font-bold text-white tracking-tight">
      {profile?.email ? profile.email : 'Free account'}
     </h2>
     <button
      type="button"
      onClick={() => onNavigate('account')}
      className="mt-3 px-5 py-2 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-xs tracking-wide active:scale-95 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
      title="Premium Active"
     >
      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
      <span>Premium Active</span>
     </button>
     <p className="text-[12px] text-[#4ade80] font-medium mt-3 tracking-wide">
      All high-fidelity audio & offline capabilities enabled
     </p>
    </div>

    {/* Quick Settings Grid (Data Saver & Private Session Exact Sizing) */}
    <div className="grid grid-cols-2 gap-3.5">
     {/* Data Saver Mode Box */}
     <button 
      type="button"
      onClick={() => setDataSaver(!dataSaver)}
      className="flex flex-col items-center justify-center py-3.5 px-3 bg-[#242424] hover:bg-[#2c2c2c] active:bg-[#333333] rounded-lg border border-transparent transition-all cursor-pointer text-center group min-h-[76px]"
     >
      <BarChart2 className={`w-5 h-5 mb-1.5 transition-colors ${dataSaver ? 'text-[#4ade80]' : 'text-white'}`} />
      <span className="text-xs font-semibold text-white leading-tight">Data Saver mode</span>
      <span className="text-[11px] text-[#a7a7a7] mt-0.5">
       {dataSaver ? 'On' : 'Always off'}
      </span>
     </button>
     
     {/* Private Session Box */}
     <button 
      type="button"
      onClick={() => updateSettings({ privateSession: !isPrivate })}
      className="flex flex-col items-center justify-center py-3.5 px-3 bg-[#242424] hover:bg-[#2c2c2c] active:bg-[#333333] rounded-lg border border-transparent transition-all cursor-pointer text-center group min-h-[76px]"
     >
      <EyeOff className={`w-5 h-5 mb-1.5 transition-colors ${isPrivate ? 'text-[#4ade80]' : 'text-white'}`} />
      <span className="text-xs font-semibold text-white leading-tight">Private session</span>
      <span className="text-[11px] text-[#a7a7a7] mt-0.5">
       {isPrivate ? 'On' : 'Off'}
      </span>
     </button>
    </div>

    {/* Settings Category Rows */}
    <div className="space-y-1 pt-1">
     <SettingsRow 
      icon={<User className="w-6 h-6" />} 
      title="Account" 
      subtitle="Username • Close account" 
      onClick={() => onNavigate('account')} 
     />
     <SettingsRow 
      icon={<Music2 className="w-6 h-6" />} 
      title="Content and display" 
      subtitle="Canvas • Languages for music" 
      onClick={() => onNavigate('content-display')} 
     />
     <SettingsRow 
      icon={<Lock className="w-6 h-6" />} 
      title="Privacy and social" 
      subtitle="Private session • Public playlists" 
      onClick={() => onNavigate('privacy')} 
     />
     <SettingsRow 
      icon={<Volume2 className="w-6 h-6" />} 
      title="Playback" 
      subtitle="Gapless playback • Autoplay" 
      onClick={() => onNavigate('playback')} 
     />
     <SettingsRow 
      icon={<Bell className="w-6 h-6" />} 
      title="Notifications" 
      subtitle="Push • Email" 
      onClick={() => onNavigate('notifications')} 
     />
     <SettingsRow 
      icon={<Laptop className="w-6 h-6" />} 
      title="Apps and devices" 
      subtitle="Google Maps • Spotify Connect control" 
      onClick={() => onNavigate('apps-devices')} 
     />
     <SettingsRow 
      icon={<ArrowDownCircle className="w-6 h-6" />} 
      title="Data-saving and offline" 
      subtitle="Data Saver mode • Downloads over cellular" 
      onClick={() => onNavigate('data-saving')} 
     />
     <SettingsRow 
      icon={<BarChart2 className="w-6 h-6" />} 
      title="Media quality" 
      subtitle="Wi-Fi streaming quality • Audio download quality" 
      onClick={() => onNavigate('media-quality')} 
     />
     <SettingsRow 
      icon={<Tv2 className="w-6 h-6" />} 
      title="Advertisements" 
      subtitle="Tailored ads" 
      onClick={() => onNavigate('advertisements')} 
     />
     <SettingsRow 
      icon={<EyeOff className="w-6 h-6" />} 
      title="Hide Songs" 
      subtitle="Hidden tracks • Unhide songs" 
      onClick={() => onNavigate('hide-songs')} 
     />
     <SettingsRow 
      icon={<Info className="w-6 h-6" />} 
      title="About and support" 
      subtitle="Version • Privacy Policy" 
      onClick={() => onNavigate('about')} 
     />
    </div>

    {/* Log Out Action */}
    <div className="pt-6 pb-6 flex justify-center">
     <button
      type="button"
      onClick={() => setShowLogoutModal(true)}
      className="px-6 py-2 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-sm tracking-tight active:scale-95 transition-all shadow-md cursor-pointer"
     >
      Log out
     </button>
    </div>
   </div>

   {/* Confirmation Modal */}
   <ConfirmationModal
    isOpen={showLogoutModal}
    title="Log out of your account?"
    description="You will need to sign in again to sync your playlists and library across devices."
    confirmLabel="Log out"
    cancelLabel="Cancel"
    isDestructive={true}
    onConfirm={async () => {
     setShowLogoutModal(false);
     await logoutUser();
    }}
    onCancel={() => setShowLogoutModal(false)}
   />
  </div>
 );
};
