import React, { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { ViewState } from '../types';

interface BlendSetupViewProps {
  onNavigate: (view: ViewState) => void;
  onBack: () => void;
}

export const BlendSetupView: React.FC<BlendSetupViewProps> = ({ onNavigate, onBack }) => {
  const { profile, firebaseUser, createPlaylist } = useUser();
  const [loading, setLoading] = useState(false);

  const initial = (profile?.name || firebaseUser?.email || 'U').charAt(0).toUpperCase();
  const avatarUrl = profile?.avatar || firebaseUser?.photoURL;

  const handleInvite = async () => {
    setLoading(true);
    // Create a new blend
    const newBlend = await createPlaylist('Blend', '', '', [], { isBlend: true });
    setLoading(false);
    
    if (newBlend) {
      // Copy invite link
      const inviteLink = `${window.location.origin}?blend=${newBlend.id}`;
      navigator.clipboard.writeText(inviteLink).catch(() => {});
      
      // Try to open share sheet
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join my Blend on Spotiz',
            text: 'I created a Blend! Join me to see our taste match.',
            url: inviteLink,
          });
        } catch (err) {
          // Fallback
          alert(`Blend created! Invite link copied to clipboard:\n\n${inviteLink}`);
        }
      } else {
        alert(`Blend created! Invite link copied to clipboard:\n\n${inviteLink}`);
      }
      onNavigate({ type: 'playlist', playlistId: newBlend.id });
    }
  };

  return (
    <div className="w-full min-h-full flex flex-col items-center text-white px-4 sm:px-6 pt-2 pb-48">
      {/* Header */}
      <div className="w-full flex items-center h-14 max-w-md shrink-0 mb-4">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 text-white hover:text-neutral-300 active:scale-95 transition-all cursor-pointer rounded-full"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-base sm:text-lg font-bold pr-6">Create a Blend</h1>
      </div>

      {/* Content */}
      <div className="w-full max-w-md flex flex-col items-center text-center">
        {/* Avatars */}
        <div className="relative w-[184px] h-[112px] sm:w-[208px] sm:h-[128px] my-4 shrink-0 mx-auto">
          <div className="absolute left-0 top-0 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#4285F4] border-4 border-neutral-900 z-10 flex items-center justify-center shadow-lg overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl sm:text-6xl font-semibold text-black">{initial}</span>
            )}
          </div>
          <div className="absolute right-0 top-0 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#3E3E3E] border-4 border-neutral-900 z-0 flex items-center justify-center shadow-md">
            <Plus className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-300 stroke-[3]" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-4 mb-3">
          Invite friends to Blend
        </h2>
        
        <p className="text-neutral-300 text-sm sm:text-base leading-snug mb-5 max-w-xs sm:max-w-sm">
          Invite up to 10 friends to a Blend, a shared playlist that gives you social recommendations based on all of your music tastes.
        </p>

        <p className="text-neutral-400 text-[11px] sm:text-xs leading-relaxed mb-8 max-w-[320px] px-2 text-center">
          Note: People in this Blend will be able to add their friends. We may also create other playlists that include social recommendations. People in social recommendations playlists will be able to see your profile picture and username. <span className="underline cursor-pointer text-neutral-300">Learn more</span> about these playlists and information they include.
        </p>

        <button
          onClick={handleInvite}
          disabled={loading}
          className="bg-white text-black text-sm sm:text-base font-bold rounded-full py-3.5 px-12 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-xl mb-8"
        >
          {loading ? 'Creating...' : 'Invite'}
        </button>
      </div>
    </div>
  );
};
