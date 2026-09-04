import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ViewState } from '../types';
import { useUser } from '../context/UserContext';

interface BlendInviteViewProps {
  blendId: string;
  onNavigate: (view: ViewState) => void;
  onBack?: () => void;
}

export const BlendInviteView: React.FC<BlendInviteViewProps> = ({ blendId, onNavigate, onBack }) => {
  const { profile, playlists, joinBlend, firebaseUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [blendData, setBlendData] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Animation state
  const [scene, setScene] = useState<0 | 1 | 2 | 3>(0);
  
  useEffect(() => {
    const fetchBlend = async () => {
      setLoading(true);
      // In a real app we'd fetch the blend details from Firestore before joining
      // For now we simulate getting the blend info if we don't have it
      
      const existing = playlists.find(p => p.id === blendId);
      if (existing) {
         setBlendData(existing);
         setLoading(false);
         // Start animation
         startAnimation();
         return;
      }

      // Try to join it
      try {
        if (!firebaseUser) {
          setError('You need to be logged in to join a Blend. Please log in from the Profile menu first.');
          setLoading(false);
          return;
        }

        const joined = await joinBlend(blendId);
        if (joined) {
          setBlendData(joined);
          setLoading(false);
          startAnimation();
        } else {
          setError('Blend not found or could not join.');
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Error joining Blend.');
        setLoading(false);
      }
    };
    
    fetchBlend();
  }, [blendId, firebaseUser]);

  const startAnimation = () => {
    setScene(1);
    
    setTimeout(() => {
      setScene(2);
    }, 2000);
    
    setTimeout(() => {
      setScene(3);
    }, 4500);
  };

  const handleGoToBlend = () => {
    // Remove query param
    const url = new URL(window.location.href);
    url.searchParams.delete('blend');
    window.history.replaceState({}, '', url);
    
    onNavigate({ type: 'playlist', playlistId: blendId });
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-[#F5F2EA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#121212] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !blendData) {
    return (
      <div className="w-full h-full bg-[#121212] flex flex-col items-center justify-center text-white px-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Oops!</h2>
        <p className="text-neutral-400 mb-8">{error}</p>
        <button 
          onClick={() => onNavigate({ type: 'home' })}
          className="bg-white text-black px-8 py-3 rounded-full font-bold"
        >
          Go Home
        </button>
      </div>
    );
  }

  // Animation values
  const sender = blendData.collaborators?.[0] || blendData.blendParticipants?.[0] || { name: 'Creator', initial: 'C' };
  const recipient = { 
    name: profile?.name || 'You', 
    initial: (profile?.name || 'U').charAt(0).toUpperCase(),
    avatar: profile?.avatar 
  };
  
  // Calculate a deterministic taste match based on IDs or names
  const combinedNames = sender.name + recipient.name;
  let hash = 0;
  for (let i = 0; i < combinedNames.length; i++) {
    hash = ((hash << 5) - hash) + combinedNames.charCodeAt(i);
    hash |= 0;
  }
  const matchPercentage = 75 + (Math.abs(hash) % 20); // 75-94%

  return (
    <div className="w-full h-full bg-[#F5F2EA] flex flex-col items-center justify-center text-[#121212] px-6 relative overflow-hidden">
      {/* Top Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onBack || (() => onNavigate({ type: 'home' }))}
          className="p-2.5 rounded-full bg-black/10 hover:bg-black/20 text-black transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      
      {/* SCENE 1 */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-opacity duration-700 ${scene === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 transition-transform duration-1000 ease-out transform translate-y-0 scale-100">
          Your taste<br />match is {matchPercentage}%
        </h1>
        <p className="text-xl md:text-2xl font-medium text-[#4b4b4b]">
          You two are relationship goals.
        </p>
      </div>

      {/* SCENE 2 */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-opacity duration-700 ${scene === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Get ready for a<br />mix as unique as<br />the two of you.
        </h1>
      </div>

      {/* SCENE 3 */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-opacity duration-700 ${scene === 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {recipient.name} + {sender.name}
        </h1>
        <p className="text-[#1DB954] font-bold text-lg mb-12">
          {matchPercentage}% taste match
        </p>
        
        <button
          onClick={handleGoToBlend}
          className="bg-[#121212] text-white px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform active:scale-95 cursor-pointer shadow-lg"
        >
          Go to your Blend
        </button>
      </div>
      
    </div>
  );
};
