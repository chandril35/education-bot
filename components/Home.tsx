
import React from 'react';
import { AppView } from '../types';

interface HomeProps {
  onNavigate: (view: AppView) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: 'chat' as AppView,
      title: 'LEARN',
      description: 'Master Class 9 Science concepts through your favorite games.',
      icon: '🎮',
      color: 'bg-blue-600',
    },
    {
      id: 'quiz' as AppView,
      title: 'QUIZ',
      description: 'Rapid-fire challenges to test your gamer-science skills.',
      icon: '⚡',
      color: 'bg-amber-600',
    },
    {
      id: 'voice' as AppView,
      title: 'VOICE',
      description: 'Talk to your AI Gaming Teacher in real-time.',
      icon: '🎙️',
      color: 'bg-purple-600',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onNavigate(card.id)}
          className="game-card flex flex-col p-6 rounded-2xl bg-slate-800/50 border border-slate-700 text-left"
        >
          <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-${card.color.split('-')[1]}-500/20`}>
            {card.icon}
          </div>
          <h2 className="text-xl font-bold font-orbitron mb-2">{card.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
          <div className="mt-auto pt-6 text-sky-400 text-xs font-bold font-orbitron tracking-widest group">
            START MISSION →
          </div>
        </button>
      ))}
      
      <div className="md:col-span-3 mt-4 p-6 rounded-2xl bg-gradient-to-r from-sky-900/40 to-indigo-900/40 border border-sky-800/50">
        <h3 className="text-lg font-bold mb-2">Tutorial Mission: Class 9 Curriculum</h3>
        <p className="text-slate-300 text-sm">
          Covering Motion, Laws of Motion, Gravitation, Work & Energy, Matter in Our Surroundings, Cells, Tissues, and more!
        </p>
      </div>
    </div>
  );
};

export default Home;
