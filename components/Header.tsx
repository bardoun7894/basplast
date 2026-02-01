import React, { useState, useEffect } from 'react';
import { ARABIC_LABELS } from '../constants';

interface HeaderProps {
  currentView: 'generate' | 'history' | 'ad-studio';
  onNavigate: (view: 'generate' | 'history' | 'ad-studio') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [credits, setCredits] = useState<number | null>(null);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      const data = await res.json();
      setCredits(data.credits);
    } catch (e) {
      console.error("Failed to fetch credits:", e);
    }
  };

  useEffect(() => {
    fetchCredits();
    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Bas Atelier Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">{ARABIC_LABELS.appTitle}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{ARABIC_LABELS.appSubtitle}</p>
          </div>
        </div>

        {/* Credits Display */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full px-4 py-1.5">
          <span className="text-amber-600 text-lg">💰</span>
          <div className="text-right">
            <span className="text-xs text-amber-600 font-medium">الرصيد</span>
            <p className="text-sm font-bold text-amber-700">
              {credits !== null ? credits.toLocaleString() : '...'}
              <span className="text-xs font-normal mr-1">credits</span>
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex gap-4">
          <button
            onClick={() => onNavigate('generate')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'generate'
              ? 'bg-basplast-50 text-basplast-700'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {ARABIC_LABELS.navGenerate}
          </button>

          <button
            onClick={() => onNavigate('history')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'history'
              ? 'bg-basplast-50 text-basplast-700'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {ARABIC_LABELS.navHistory}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;