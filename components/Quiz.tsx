
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { QuizQuestion, QuizState } from '../types';

interface QuizProps {
  onBack: () => void;
}

const Quiz: React.FC<QuizProps> = ({ onBack }) => {
  const [state, setState] = useState<QuizState>({
    questions: [],
    currentIndex: -1,
    score: 0,
    isFinished: false,
    timeLeft: 10,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate 5 multiple choice questions for Class 9 Science. Use video games for the scenarios. Difficulty: Medium. Return valid JSON.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER, description: "Index of correct option 0-3" },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });
      const data = JSON.parse(response.text || "[]") as QuizQuestion[];
      setState(s => ({ ...s, questions: data, currentIndex: 0, timeLeft: 10 }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    let timer: number;
    if (state.currentIndex >= 0 && !state.isFinished && state.timeLeft > 0) {
      timer = window.setInterval(() => {
        setState(s => {
          if (s.timeLeft <= 1) {
            handleNextQuestion();
            return { ...s, timeLeft: 0 };
          }
          return { ...s, timeLeft: s.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.currentIndex, state.isFinished, state.timeLeft]);

  const handleNextQuestion = () => {
    setState(s => {
      const nextIndex = s.currentIndex + 1;
      if (nextIndex >= s.questions.length) {
        return { ...s, isFinished: true };
      }
      return { ...s, currentIndex: nextIndex, timeLeft: 10 };
    });
    setSelectedOption(null);
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(index);
    const isCorrect = index === state.questions[state.currentIndex].correctAnswer;
    
    if (isCorrect) {
      setState(s => ({ ...s, score: s.score + 1 }));
    }

    setTimeout(handleNextQuestion, 1500);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="font-orbitron text-sky-400">LOADING LEVEL DATA...</div>
      </div>
    );
  }

  if (state.isFinished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl border border-slate-700 text-center animate-in zoom-in duration-300">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold font-orbitron text-white mb-2">MISSION COMPLETE</h2>
        <p className="text-xl text-slate-400 mb-6">You scored {state.score} / {state.questions.length}</p>
        <div className="text-sm text-sky-400 font-bold mb-8 italic">
          {state.score === state.questions.length ? "GODLIKE PERFORMANCE!" : "KEEP GRINDING, SCIENTIST!"}
        </div>
        <div className="flex gap-4">
          <button 
            onClick={fetchQuestions}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold font-orbitron transition-all"
          >
            PLAY AGAIN
          </button>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold font-orbitron transition-all border border-slate-700"
          >
            LOBBY
          </button>
        </div>
      </div>
    );
  }

  const currentQ = state.questions[state.currentIndex];

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-xs font-bold text-slate-500 font-orbitron uppercase tracking-widest">Question {state.currentIndex + 1}/{state.questions.length}</span>
          <h2 className="text-xl font-bold text-white mt-1">{currentQ.question}</h2>
        </div>
        <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold font-orbitron ${state.timeLeft < 4 ? 'border-red-500 text-red-500 animate-pulse' : 'border-sky-500 text-sky-500'}`}>
          {state.timeLeft}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {currentQ.options.map((opt, idx) => {
          let style = "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750 hover:border-sky-500";
          if (selectedOption !== null) {
            if (idx === currentQ.correctAnswer) {
              style = "bg-green-900/50 border-green-500 text-green-200";
            } else if (idx === selectedOption) {
              style = "bg-red-900/50 border-red-500 text-red-200";
            } else {
              style = "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
            }
          }

          return (
            <button
              key={idx}
              disabled={selectedOption !== null}
              onClick={() => handleAnswer(idx)}
              className={`p-4 rounded-xl border-2 text-left transition-all font-medium ${style}`}
            >
              <span className="mr-3 text-sky-500 font-orbitron">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {selectedOption !== null && (
        <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-sm italic text-slate-300 animate-in fade-in slide-in-from-bottom-2">
          <span className="font-bold text-sky-400 not-italic mr-2">Nerd Check:</span>
          {currentQ.explanation}
        </div>
      )}

      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-sky-500 h-full transition-all duration-1000"
          style={{ width: `${(state.timeLeft / 10) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Quiz;
