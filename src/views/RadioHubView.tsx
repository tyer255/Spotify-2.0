import React, { useMemo } from 'react';
import { ViewState } from '../types';
import { StationCard } from '../components/Common/StationCard';
import { defaultRecommendedStations } from '../utils/personalizedRecommendations';
import { Radio } from 'lucide-react';

interface RadioHubViewProps {
  onNavigate: (view: ViewState) => void;
}

export const RadioHubView: React.FC<RadioHubViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 overflow-y-auto w-full h-full">
      {/* Premium Header Decoration */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden shrink-0 bg-neutral-900 border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-900/40 via-neutral-900 to-neutral-950 mix-blend-overlay"></div>
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Radio className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-sm font-black tracking-widest text-emerald-400 uppercase">Radio Hub</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg mb-2">
            Non-stop music.
          </h1>
          <p className="text-neutral-300 text-lg sm:text-xl font-medium max-w-2xl opacity-90">
            Endless personalized stations based on your favorite artists and songs.
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-12">
        {/* Recommended Stations section */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Popular Stations</h2>
              <p className="text-sm text-neutral-400 mt-1">
                Curated stations featuring top artists
              </p>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x" style={{ maskImage: 'linear-gradient(to right, black 80%, transparent 100%)' }}>
            {defaultRecommendedStations.map(station => (
              <div key={station.id} className="snap-start shrink-0">
                <StationCard station={station} onNavigate={onNavigate} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
