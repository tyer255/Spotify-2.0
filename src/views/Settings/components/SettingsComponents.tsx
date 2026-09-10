import React from 'react';
import { ChevronRight, ArrowLeft, Search } from 'lucide-react';

export const SettingsHeader: React.FC<{
  title: string;
  onBack: () => void;
  onSearch?: () => void;
  showSearch?: boolean;
}> = ({ title, onBack, onSearch, showSearch = false }) => (
  <div className="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-md pb-4 pt-4 mb-4 border-b border-white/5">
    <div className="flex items-center justify-between px-4 md:px-8 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
        aria-label="Go back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
      <h1 className="text-base font-bold text-white tracking-wide">{title}</h1>
      {showSearch ? (
        <button
          onClick={onSearch}
          className="p-2 -mr-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
          aria-label="Search settings"
        >
          <Search className="w-5 h-5" />
        </button>
      ) : (
        <div className="w-9" />
      )}
    </div>
  </div>
);

export const SettingsRow: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
  showChevron?: boolean;
}> = ({ icon, title, subtitle, onClick, showChevron = false }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center justify-between py-3 px-1 hover:bg-white/[0.04] active:bg-white/[0.08] rounded-xl transition-colors text-left group cursor-pointer"
  >
    <div className="flex items-center gap-4 min-w-0 flex-1">
      {icon && (
        <div className="text-white group-hover:text-emerald-400 transition-colors flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1 pr-2">
        <h3 className="text-[15px] font-semibold text-white truncate leading-snug">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[#a7a7a7] mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {showChevron && (
      <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-neutral-300 flex-shrink-0 transition-colors" />
    )}
  </button>
);

export const SettingsToggle: React.FC<{
  title: string;
  subtitle?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}> = ({ title, subtitle, checked, disabled = false, onChange }) => (
  <div className={`flex items-center justify-between py-3.5 px-2 rounded-xl transition-colors ${disabled ? 'opacity-50' : ''}`}>
    <div className="min-w-0 pr-6 flex-1">
      <h3 className="text-sm sm:text-base font-medium text-white">{title}</h3>
      {subtitle && (
        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{subtitle}</p>
      )}
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-12 h-6.5 rounded-full transition-colors relative flex-shrink-0 p-0.5 cursor-pointer ${
        checked ? 'bg-emerald-500' : 'bg-neutral-700'
      } ${disabled ? 'cursor-not-allowed' : ''}`}
      aria-checked={checked}
      role="switch"
    >
      <div
        className={`w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-md ${
          checked ? 'translate-x-5.5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);
