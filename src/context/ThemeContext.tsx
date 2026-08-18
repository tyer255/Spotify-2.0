import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSettings } from '../types';

interface ThemeContextType {
  theme: 'dark' | 'light';
  accentColor: string;
  setTheme: (theme: 'dark' | 'light') => void;
  setAccentColor: (color: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_ACCENTS = [
  { name: 'Spotify Green', hex: '#1DB954' },
  { name: 'Electric Cyan', hex: '#06B6D4' },
  { name: 'Neon Purple', hex: '#8B5CF6' },
  { name: 'Sunset Orange', hex: '#F97316' },
  { name: 'Rose Red', hex: '#E11D48' },
  { name: 'Amber Gold', hex: '#F59E0B' },
];

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialSettings?: Partial<UserSettings> }> = ({
  children,
  initialSettings,
}) => {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [accentColor, setAccentColorState] = useState<string>('#1DB954');

  useEffect(() => {
    // Load from localStorage or initial settings
    const savedTheme = localStorage.getItem('spotify_theme') as 'dark' | 'light' | null;
    const savedAccent = localStorage.getItem('spotify_accent');

    if (savedTheme) {
      setThemeState(savedTheme);
    } else if (initialSettings?.theme && initialSettings.theme !== 'system') {
      setThemeState(initialSettings.theme);
    }

    if (savedAccent) {
      setAccentColorState(savedAccent);
    } else if (initialSettings?.accentColor) {
      setAccentColorState(initialSettings.accentColor);
    }
  }, [initialSettings]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    root.style.setProperty('--accent-color', accentColor);
    localStorage.setItem('spotify_theme', theme);
    localStorage.setItem('spotify_accent', accentColor);
  }, [theme, accentColor]);

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
