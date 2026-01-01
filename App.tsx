
import React, { useState } from 'react';
import { AppView } from './types';
import Home from './components/Home';
import Chat from './components/Chat';
import Quiz from './components/Quiz';
import VoiceAssistant from './components/VoiceAssistant';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={setCurrentView} />;
      case 'chat':
        return <Chat onBack={() => setCurrentView('home')} />;
      case 'quiz':
        return <Quiz onBack={() => setCurrentView('home')} />;
      case 'voice':
        return <VoiceAssistant onBack={() => setCurrentView('home')} />;
      default:
        return <Home onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-sky-400 tracking-wider">GAMESCI BOT</h1>
          <p className="text-slate-400 text-sm">Class 9 Science: Level Up Your Brain</p>
        </div>
        {currentView !== 'home' && (
          <button 
            onClick={() => setCurrentView('home')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors border border-slate-700"
          >
            Exit Game
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {renderView()}
      </main>

      <footer className="mt-8 py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        © 2024 GameSci Education • Built for Gamers & Students
      </footer>
    </div>
  );
};

export default App;
