import React, { useState } from 'react';
import { ViewState } from '../../types';
import { Instagram, Twitter, Facebook, Youtube, Globe, X } from 'lucide-react';

interface HomeFooterProps {
  onNavigate: (view: ViewState) => void;
}

export const HomeFooter: React.FC<HomeFooterProps> = ({ onNavigate }) => {
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const handleNavigation = (pageId: string) => {
    onNavigate({ type: 'info', pageId });
  };

  const footerLinks = [
    {
      title: 'Company',
      links: [
        { label: 'About', pageId: 'about' },
        { label: 'Jobs / Careers', pageId: 'jobs' },
        { label: 'For the Record / News', pageId: 'for-the-record' },
      ]
    },
    {
      title: 'Community',
      links: [
        { label: 'For Artists', pageId: 'for-artists' },
        { label: 'Developers', pageId: 'developers' },
        { label: 'Advertising', pageId: 'advertising' },
        { label: 'Investors', pageId: 'investors' },
        { label: 'Partners / Vendors', pageId: 'vendors' },
      ]
    },
    {
      title: 'Useful Links',
      links: [
        { label: 'Support', pageId: 'support' },
        { label: 'Get the Mobile App', pageId: 'get-app' },
        { label: 'Music by Country', pageId: 'country' },
        { label: 'Import Your Music', pageId: 'import' },
      ]
    },
    {
      title: 'App Plans',
      links: [
        { label: 'Premium Plan', pageId: 'premium-standard' },
        { label: 'Student Plan', pageId: 'premium-student' },
        { label: 'Free Plan', pageId: 'premium-free' },
      ]
    }
  ];

  const legalLinks = [
    { label: 'Legal Information', pageId: 'legal' },
    { label: 'Safety & Privacy Center', pageId: 'safety' },
    { label: 'Privacy Policy', pageId: 'privacy' },
    { label: 'Cookies Policy', pageId: 'cookies' },
    { label: 'About Ads', pageId: 'ads' },
    { label: 'Accessibility', pageId: 'accessibility' },
  ];

  return (
    <footer className="w-full max-w-7xl mx-auto px-6 py-12 md:px-8 lg:px-10 mt-8 mb-16 relative z-10">
      {/* Top Links Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 mb-12">
        {footerLinks.map((section) => (
          <div key={section.title} className="flex flex-col space-y-4">
            <h3 className="font-bold text-white text-base tracking-wide">
              {section.title}
            </h3>
            <ul className="flex flex-col space-y-3">
              {section.links.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => handleNavigation(link.pageId)}
                    className="text-left text-neutral-400 hover:text-white hover:underline transition-colors text-sm font-medium cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Social Links Section */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8 pb-8 border-b border-white/10">
        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            title="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            title="X (Twitter)"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            title="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            title="YouTube"
          >
            <Youtube className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Legal & Bottom Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {legalLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleNavigation(link.pageId)}
              className="text-xs text-neutral-400 hover:text-white hover:underline transition-colors whitespace-nowrap cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-4 shrink-0">
          <button 
            onClick={() => setIsLanguageModalOpen(true)}
            className="flex items-center gap-2 text-neutral-400 hover:text-white text-xs font-semibold py-2 px-3 border border-neutral-500 hover:border-white rounded-full transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>{selectedLanguage}</span>
          </button>
          <span className="text-xs text-neutral-500">
            © 2026 Spotiz AB. All rights reserved.
          </span>
        </div>
      </div>

      {/* Language Selection Modal */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Choose a language</h3>
              <button 
                onClick={() => setIsLanguageModalOpen(false)}
                className="p-2 -mr-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 max-h-[60vh] overflow-y-auto">
              {['English', 'Español', 'Français', 'Deutsch', 'Italiano', 'Português', '日本語', '한국어', '中文'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setIsLanguageModalOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors cursor-pointer flex justify-between items-center ${selectedLanguage === lang ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-neutral-300 hover:bg-white/5'}`}
                >
                  {lang}
                  {selectedLanguage === lang && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
