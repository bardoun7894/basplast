import React, { useState } from 'react';
import Header from './components/Header';
import GeneratorView from './components/GeneratorView';
import HistoryView from './components/HistoryView';
import { DesignRequest } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'generate' | 'history'>('generate');
  const [history, setHistory] = useState<DesignRequest[]>([]);

  const handleGenerateComplete = (newRequest: DesignRequest) => {
    setHistory(prev => [...prev, newRequest]);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-right" dir="rtl">
      <Header currentView={currentView} onNavigate={setCurrentView} />
      
      <main>
        {currentView === 'generate' && (
          <GeneratorView onGenerateComplete={handleGenerateComplete} />
        )}
        
        {currentView === 'history' && (
          <HistoryView history={history} />
        )}
      </main>
    </div>
  );
}

export default App;