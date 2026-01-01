
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/audio';

interface VoiceAssistantProps {
  onBack: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const cleanup = async () => {
    // 1. Close session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.debug('Session close error');
      }
      sessionRef.current = null;
    }
    
    // 2. Stop and clear audio nodes
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    sourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    sourcesRef.current.clear();
    
    // 3. Close audio contexts
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        await audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      try {
        await outputAudioContextRef.current.close();
      } catch (e) {}
      outputAudioContextRef.current = null;
    }
    
    setIsActive(false);
    setStatus('idle');
  };

  const startAssistant = async () => {
    setStatus('connecting');
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Crucial: resume context for browser policies
      await inputCtx.resume();
      await outputCtx.resume();
      
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // CRITICAL: Solely rely on sessionPromise and do not check isActive here
              // to avoid stale closure issues. The scriptProcessor is disconnected on cleanup.
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('speaking');
              const ctx = outputAudioContextRef.current;
              if (!ctx || ctx.state === 'closed') return;

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (e) => {
            console.error('Session error', e);
            setError('Connection error occurred.');
            cleanup();
          },
          onclose: () => {
            setStatus('idle');
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are the GameSci Voice Mentor. You speak to students about Class 9 Science. ALWAYS use video game analogies. Keep responses relatively concise as this is a voice conversation. Be encouraging and energetic.',
        }
      });

      sessionRef.current = await sessionPromise;
      setIsActive(true);
    } catch (err) {
      console.error(err);
      setError('Could not access microphone or connect to AI.');
      setStatus('idle');
      cleanup();
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-slate-900 rounded-2xl border border-slate-700 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-orbitron mb-2">VOICE COMMS</h2>
        <p className="text-slate-400 text-sm">Real-time Science Tutoring over Radio</p>
      </div>

      <div className="relative flex items-center justify-center w-64 h-64">
        <div className={`absolute inset-0 rounded-full bg-sky-500/20 animate-ping ${status === 'speaking' ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute inset-4 rounded-full border-4 border-dashed border-sky-400/30 ${isActive ? 'animate-spin-slow' : ''}`}></div>
        
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-all duration-500 ${
          status === 'speaking' ? 'bg-sky-500 scale-110 shadow-sky-500/40' : 
          status === 'listening' ? 'bg-indigo-600 shadow-indigo-600/40' : 
          'bg-slate-800'
        }`}>
          {status === 'speaking' ? '🗣️' : status === 'listening' ? '👂' : '🎙️'}
        </div>
      </div>

      <div className="text-center h-12">
        {error ? (
          <p className="text-red-400 font-bold">{error}</p>
        ) : (
          <p className="text-sky-400 font-orbitron text-sm tracking-widest animate-pulse">
            {status === 'connecting' ? 'ESTABLISHING LINK...' : 
             status === 'listening' ? 'SYSTEMS READY - SPEAK NOW' :
             status === 'speaking' ? 'RECEIVING LEVEL INTEL...' :
             'RADIO SILENT'}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        {!isActive ? (
          <button
            onClick={startAssistant}
            className="px-8 py-4 bg-sky-600 hover:bg-sky-500 rounded-full font-bold font-orbitron text-lg shadow-lg shadow-sky-600/30 transition-all hover:scale-105"
          >
            INITIALIZE LINK
          </button>
        ) : (
          <button
            onClick={cleanup}
            className="px-8 py-4 bg-red-600 hover:bg-red-500 rounded-full font-bold font-orbitron text-lg shadow-lg shadow-red-600/30 transition-all"
          >
            CUT COMMS
          </button>
        )}
        
        <p className="text-slate-500 text-xs text-center max-w-xs">
          Tip: Ask "How does Matter change state like in Minecraft?" or "Explain Gravity like I'm in Super Mario Galaxy."
        </p>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VoiceAssistant;
