
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types';

interface ChatProps {
  onBack: () => void;
}

const Chat: React.FC<ChatProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Ready for your science mission? I'm your GameSci mentor. Ask me about any Class 9 Science concept, and I'll explain it using video games! Want to know how Minecraft relates to Atoms? Or how Mario handles Inertia?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages, userMsg].map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: "You are GameSci Bot, a fun teacher who explains Class 9 Science concepts ONLY using popular video games (Minecraft, Mario, Fortnite, Zelda, Portal, Halo, etc.). Be educational but high-energy. Focus on NCERT concepts: Matter, Atoms, Molecules, Motion, Forces, Gravitation, Energy, Sound, Cells, Tissues, Natural Resources. Use gamer lingo appropriately.",
        },
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "Sorry, I lagged out. Try again?",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto space-y-4"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/20'
                  : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-md'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-700 animate-pulse text-sky-400">
              Generating Level Data...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-800/50 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about Motion, Cells, Energy..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 px-4 py-2 rounded-lg font-orbitron font-bold text-sm transition-colors"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
