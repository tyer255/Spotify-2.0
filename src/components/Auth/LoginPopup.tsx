import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { ViewState } from '../../types';

interface LoginPopupProps {
  onNavigate: (view: ViewState) => void;
}

export const LoginPopup: React.FC<LoginPopupProps> = ({ onNavigate }) => {
  const { firebaseUser, loading } = useUser();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if not loading and user is not authenticated
    if (!loading && !firebaseUser) {
      const hasShown = sessionStorage.getItem('spotify_login_popup_shown');
      if (!hasShown) {
        // Small delay to make it feel natural
        const timer = setTimeout(() => {
          setIsVisible(true);
          sessionStorage.setItem('spotify_login_popup_shown', 'true');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, firebaseUser]);

  if (!isVisible || firebaseUser) return null;

  const handleAction = () => {
    setIsVisible(false);
    onNavigate({ type: 'profile' });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative w-full max-w-md p-8 bg-zinc-900/60 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_16px_64px_rgba(0,0,0,0.8)] transform transition-all animate-in zoom-in-95 duration-500">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-5 right-5 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center mt-2">
          {/* Centered Spotiz Logo matching reference */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-[0_0_32px_rgba(255,255,255,0.15)] flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="w-16 h-16 block"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Official White Circle */}
              <circle cx="12" cy="12" r="12" fill="#FFFFFF" />
              {/* 3 Perfectly Centered Soundwave Acoustic Arcs */}
              <path
                d="M17.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
                fill="#000000"
              />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Start listening with Spotiz Premium 2.0</h2>
          <p className="text-sm text-zinc-300/80 mb-8 max-w-[280px]">
            Sign up or log in to save your favorite songs, create playlists, and more.
          </p>
          
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleAction}
              className="w-full bg-[#1ed760] text-black font-bold py-3.5 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              Sign Up
            </button>
            <button
              onClick={handleAction}
              className="w-full bg-white/5 border border-white/20 text-white font-bold py-3.5 rounded-full hover:bg-white/10 hover:border-white/40 active:scale-[0.98] transition-all backdrop-blur-md"
            >
              Continue with Google
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-6 font-medium">
            You will be redirected to the authentication page.
          </p>
        </div>
      </div>
    </div>
  );
};
