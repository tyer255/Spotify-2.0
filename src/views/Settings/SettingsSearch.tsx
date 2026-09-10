import React from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { SettingsPage } from './types';
import { SettingsRow } from './components/SettingsComponents';

const SETTINGS_MAP = [
 { id: 'account', title: 'Account', subtitle: 'Username, Email, Profile', keywords: ['profile', 'name', 'avatar', 'close', 'delete', 'username', 'email'] },
 { id: 'content-display', title: 'Content and display', subtitle: 'Canvas, Theme', keywords: ['visuals', 'video', 'canvas', 'theme', 'dark', 'light', 'language'] },
 { id: 'privacy', title: 'Privacy and social', subtitle: 'Private session', keywords: ['private', 'social', 'listening', 'activity'] },
 { id: 'playback', title: 'Playback', subtitle: 'Gapless playback, Autoplay', keywords: ['gapless', 'autoplay', 'crossfade', 'normalize', 'volume'] },
 { id: 'notifications', title: 'Notifications', subtitle: 'Push, Email', keywords: ['push', 'email', 'messages', 'updates'] },
 { id: 'apps-devices', title: 'Apps and devices', subtitle: 'Current device', keywords: ['device', 'browser', 'session', 'connect'] },
 { id: 'data-saving', title: 'Data-saving and offline', subtitle: 'Data Saver, Storage', keywords: ['data saver', 'offline', 'cellular', 'cache', 'storage', 'download', 'clear'] },
 { id: 'media-quality', title: 'Media quality', subtitle: 'Streaming quality', keywords: ['wifi', 'streaming', 'quality', 'audio', 'bitrate', 'high', 'normal'] },
 { id: 'advertisements', title: 'Advertisements', subtitle: 'Ad preferences', keywords: ['ads', 'tailored', 'premium'] },
 { id: 'hide-songs', title: 'Hide Songs', subtitle: 'Hidden tracks', keywords: ['hide', 'unhide', 'hidden', 'songs', 'tracks'] },
 { id: 'about', title: 'About and support', subtitle: 'Version, Privacy', keywords: ['version', 'privacy', 'policy', 'terms', 'support', 'help', 'contact'] }
];

export const SettingsSearch: React.FC<{
 query: string;
 setQuery: (q: string) => void;
 onClose: () => void;
 onNavigate: (page: SettingsPage) => void;
}> = ({ query, setQuery, onClose, onNavigate }) => {
 const normalizedQuery = query.toLowerCase().trim();
 
 const results = SETTINGS_MAP.filter(item => 
  item.title.toLowerCase().includes(normalizedQuery) ||
  item.subtitle.toLowerCase().includes(normalizedQuery) ||
  item.keywords.some(k => k.includes(normalizedQuery))
 );

 return (
  <div className=" h-full flex flex-col bg-neutral-900">
   <div className="sticky top-0 z-10 bg-neutral-900 pb-4 pt-4 mb-2 border-b border-white/5">
    <div className="flex items-center gap-3 px-4 md:px-8 max-w-3xl mx-auto">
     <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white">
      <ArrowLeft className="w-6 h-6" />
     </button>
     <div className="flex-1 relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
       <Search className="w-5 h-5" />
      </div>
      <input
       type="text"
       autoFocus
       value={query}
       onChange={(e) => setQuery(e.target.value)}
       placeholder="Search settings"
       className="w-full bg-white/10 text-white rounded-full py-2.5 pl-10 pr-10 outline-none focus:ring-2 focus:ring-white/20 text-sm font-semibold placeholder:font-normal"
      />
      {query && (
       <button 
        onClick={() => setQuery('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
       >
        <X className="w-5 h-5" />
       </button>
      )}
     </div>
    </div>
   </div>
   
   <div className="px-4 md:px-8 max-w-3xl mx-auto w-full pt-4 space-y-1 flex-1">
    {results.length > 0 ? (
     results.map(item => (
      <SettingsRow
       key={item.id}
       title={item.title}
       subtitle={item.subtitle}
       onClick={() => onNavigate(item.id as SettingsPage)}
      />
     ))
    ) : (
     <div className="text-center py-12 text-neutral-400">
      <p>No results found for"{query}"</p>
     </div>
    )}
   </div>
  </div>
 );
};
