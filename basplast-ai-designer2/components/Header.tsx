import React from 'react';
import { ARABIC_LABELS } from '../constants';

interface HeaderProps {
  currentView: 'generate' | 'history';
  onNavigate: (view: 'generate' | 'history') => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-basplast-600 rounded-md flex items-center justify-center text-white font-bold text-lg">
            B
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">{ARABIC_LABELS.appTitle}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{ARABIC_LABELS.appSubtitle}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex gap-4">
          <button 
            onClick={() => onNavigate('generate')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'generate' 
                ? 'bg-basplast-50 text-basplast-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {ARABIC_LABELS.navGenerate}
          </button>
          <button 
            onClick={() => onNavigate('history')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentView === 'history' 
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