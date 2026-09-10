import { create } from 'zustand';

interface PlayerProgressState {
  position: number;
  duration: number;
  bufferedPosition: number;
  activeLyricIndex: number;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  setBufferedPosition: (pos: number) => void;
  setActiveLyricIndex: (index: number) => void;
}

export const usePlayerProgressStore = create<PlayerProgressState>((set) => ({
  position: 0,
  duration: 0,
  bufferedPosition: 0,
  activeLyricIndex: -1,
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setBufferedPosition: (bufferedPosition) => set({ bufferedPosition }),
  setActiveLyricIndex: (activeLyricIndex) => set({ activeLyricIndex }),
}));
