import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GeneratorView from './components/GeneratorView';
import HistoryView from './components/HistoryView';
import { DesignRequest } from './types';

import AdGeneratorView from './components/AdGeneratorView';

function App() {
  const [currentView, setCurrentView] = useState<'generate' | 'history' | 'ad-studio'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('view') as 'generate' | 'history' | 'ad-studio') || 'generate';
  });

  const [history, setHistory] = useState<DesignRequest[]>([]);

  // Update URL when view changes to keep state sync (optional but nice)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentView === 'generate') url.searchParams.delete('view');
    else url.searchParams.set('view', currentView);
    window.history.pushState({}, '', url);
  }, [currentView]);

  const handleGenerateComplete = (newRequest: DesignRequest) => {
    setHistory(prev => [...prev, newRequest]);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-right" dir="rtl">
      {currentView !== 'ad-studio' && (
        <Header currentView={currentView as 'generate' | 'history'} onNavigate={(v) => setCurrentView(v)} />
      )}

      <main>
        {currentView === 'generate' && (
          <GeneratorView onGenerateComplete={handleGenerateComplete} />
        )}

        {currentView === 'history' && (
          <HistoryView history={history} />
        )}

        {currentView === 'ad-studio' && (
          <AdGeneratorView
            onGenerateComplete={handleGenerateComplete}
            onBack={() => setCurrentView('history')}
          />
        )}
      </main>
    </div>
  );
}

export default App;