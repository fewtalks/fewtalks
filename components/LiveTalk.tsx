import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useAuth } from '../hooks/useAuth';
import LoginOverlay from './LoginOverlay';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

// Helper functions from guidelines
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const LiveTalk: React.FC = () => {
    const { user } = useAuth();
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [status, setStatus] = useState('Not connected');
    const [transcription, setTranscription] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    
    const sessionRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');

    const startSession = async () => {
        if (!user) return;
        setStatus('Connecting...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // FIX: Cast window to any to allow access to vendor-prefixed webkitAudioContext
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);

            sessionRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('Connected. Start speaking...');
                        
                        // FIX: Cast window to any to allow access to vendor-prefixed webkitAudioContext
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        const source = audioContextRef.current.createMediaStreamSource(stream);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcription
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputTranscription.current += text;
                        } else if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscription.current += text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscription.current;
                            const fullOutput = currentOutputTranscription.current;
                            setTranscription(prev => [...prev, {role: 'user', text: fullInput}, {role: 'model', text: fullOutput}]);
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                        }
                        
                        // Handle audio playback
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const outputCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                         if (message.serverContent?.interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                            }
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setStatus(`Error: ${e.message}`);
                        stopSession();
                    },
                    onclose: () => {
                        setStatus('Connection closed.');
                        stopSession(false); // Don't try to close again
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });
            setIsSessionActive(true);
        } catch (err) {
            console.error('Failed to start session:', err);
            setStatus('Failed to get microphone access.');
        }
    };

    const stopSession = async (shouldClose = true) => {
        if (shouldClose && sessionRef.current) {
            const session = await sessionRef.current;
            session.close();
        }
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        audioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        
        sessionRef.current = null;
        mediaStreamRef.current = null;
        audioContextRef.current = null;
        scriptProcessorRef.current = null;
        outputAudioContextRef.current = null;
        
        setIsSessionActive(false);
        setStatus('Not connected');
    };

    return (
        <div className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-6 md:p-10 animate-fade-in relative min-h-[70vh] flex flex-col">
            {!user && <LoginOverlay title="Live AI Conversation" description="Sign in to have a real-time voice chat with Gemini." />}
            
            <div className="flex items-center mb-4">
                <MicrophoneIcon className="h-6 w-6" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white ml-2">Live Talk</h2>
            </div>
            
            <div className="flex flex-col items-center justify-center flex-grow">
                <button
                    onClick={isSessionActive ? stopSession : startSession}
                    disabled={!user}
                    className={`relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-300 ${isSessionActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white shadow-lg disabled:bg-slate-400 dark:disabled:bg-slate-600`}
                >
                    <MicrophoneIcon className="h-12 w-12" />
                    {isSessionActive && <span className="absolute inset-0 rounded-full bg-red-500/50 animate-ping"></span>}
                </button>
                <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">{status}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{isSessionActive ? 'Click to stop the session.' : 'Click to start the session.'}</p>
            </div>
            
             <div className="mt-6 h-48 bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-y-auto border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Transcription</h3>
                <div className="space-y-2 text-sm">
                    {transcription.map((t, i) => (
                        <div key={i}>
                            <span className={`font-semibold ${t.role === 'user' ? 'text-brand-primary' : 'text-slate-700 dark:text-slate-300'}`}>{t.role === 'user' ? 'You: ' : 'AI: '}</span>
                            <span className="text-slate-600 dark:text-slate-400">{t.text}</span>
                        </div>
                    ))}
                    {transcription.length === 0 && <p className="text-slate-400 dark:text-slate-500">Live transcription will appear here...</p>}
                </div>
            </div>
        </div>
    );
};

export default LiveTalk;