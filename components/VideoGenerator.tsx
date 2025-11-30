import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { useAuth } from '../hooks/useAuth';
import { FREE_GENERATION_LIMIT } from '../services/historyService';
import * as historyService from '../services/historyService';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { VideoHistoryItem } from '../types';
import { trackContentGeneration } from '../utils/analytics';

interface VideoGeneratorProps {
  onHistoryChange: () => void;
}

const loadingMessages = [
  "Warming up the virtual cameras...",
  "Directing the digital actors...",
  "Rendering the first few frames...",
  "Adding special effects...",
  "Finalizing the soundtrack...",
  "This is taking a bit longer than usual, but good things take time!",
  "Almost there, just polishing the final cut...",
];

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onHistoryChange }) => {
  const { user, openLoginModal } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<{ base64: string; mimeType: string; file: File } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [apiKeySelected, setApiKeySelected] = useState(false);

  const [remainingGenerations, setRemainingGenerations] = useState<number>(FREE_GENERATION_LIMIT);
  const isLimitReached = user && !user.isPro ? remainingGenerations <= 0 : false;
  const loadingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) {
      const { remaining } = historyService.getUsage(user.email);
      setRemainingGenerations(remaining);
    } else {
      setRemainingGenerations(FREE_GENERATION_LIMIT);
    }
  }, [user]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true); // Assume success to improve UX
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = (reader.result as string).split(',')[1];
              setImage({ base64: base64String, mimeType: file.type, file });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGenerate = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (isLimitReached) return;
    if (!prompt.trim() && !image) {
      setError('Please enter a prompt or upload an image.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedVideoUrl(null);
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    loadingIntervalRef.current = window.setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
    }, 7000);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio,
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
          operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch (opError: any) {
           if (opError.message.includes("Requested entity was not found")) {
              setApiKeySelected(false);
              throw new Error("Your API key is invalid or not found. Please re-select your key and try again.");
           }
           throw opError;
        }
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        setGeneratedVideoUrl(videoUrl);

        if (!user.isPro) {
            historyService.incrementUsage(user.email);
            setRemainingGenerations(prev => prev - 1);
        }

        const historyItem: Omit<VideoHistoryItem, 'id' | 'createdAt'> = {
            type: 'video',
            prompt: prompt,
            videoUrl: videoUrl,
        };
        historyService.addHistoryItem(user.email, historyItem);
        trackContentGeneration('video', true);
        onHistoryChange();
      } else {
        throw new Error("Video generation completed but no video URL was found.");
      }

    } catch (err: any) {
      console.error(err);
      trackContentGeneration('video', false);
      setError(err.message || 'Failed to generate video. The AI may be busy, please try again.');
    } finally {
      setIsLoading(false);
      if(loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    }
  };

  if (!apiKeySelected) {
    return (
      <div className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-6 md:p-10 animate-fade-in text-center">
        <VideoCameraIcon />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">Action Required</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
          The Veo video generation model requires you to select your own API key. This is a one-time setup.
        </p>
        <button
          onClick={handleSelectKey}
          className="mt-6 inline-block bg-brand-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-accent transition-transform transform hover:scale-105"
        >
          Select API Key
        </button>
         <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
            For more information on billing, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">ai.google.dev/gemini-api/docs/billing</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-6 md:p-10 animate-fade-in relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
                 <div className="flex items-center mb-4">
                    <VideoCameraIcon />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white ml-2">AI Video Generator</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Create dynamic videos from text or an image. Powered by <span className="font-semibold text-brand-accent">Veo</span>.</p>
                
                <label htmlFor="video-prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Prompt:</label>
                <textarea
                    id="video-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A cinematic shot of a futuristic city at night"
                    className="w-full h-24 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors resize-none"
                    disabled={isLoading}
                />
                
                <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Starting Image (Optional):</label>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-900/25 dark:border-slate-100/25 px-6 py-10">
                        <div className="text-center">
                            {image ? (
                                <div className="relative">
                                    <img src={URL.createObjectURL(image.file)} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
                                    <button onClick={() => setImage(null)} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 text-xs">X</button>
                                </div>
                            ) : (
                                <PhotoIcon />
                            )}
                            <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-primary hover:text-brand-accent">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">PNG, JPG up to 10MB</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Aspect Ratio:</label>
                    <div className="flex gap-2">
                        <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aspectRatio === '16:9' ? 'bg-brand-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>Landscape (16:9)</button>
                        <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${aspectRatio === '9:16' ? 'bg-brand-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>Portrait (9:16)</button>
                    </div>
                </div>
                
                <div className="mt-8 flex flex-col">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || (!prompt && !image) || isLimitReached}
                        className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-accent disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? <><LoadingSpinner /> Generating Video...</> : <><SparklesIcon className="h-6 w-6" /> Generate Video</>}
                    </button>
                </div>
            </div>
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Generated Video</h2>
                 <div className="bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 flex-grow min-h-[300px] flex items-center justify-center">
                    {error && <div className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</div>}
                    {isLoading && !error && (
                        <div className="text-center text-slate-500 dark:text-slate-400">
                            <LoadingSpinner />
                            <p className="mt-2 font-semibold">{loadingMessage}</p>
                            <p className="text-sm">Video generation can take a few minutes.</p>
                        </div>
                    )}
                    {generatedVideoUrl && !isLoading && (
                        <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-lg" />
                    )}
                    {!isLoading && !generatedVideoUrl && !error && (
                         <div className="text-center text-slate-400 dark:text-slate-500">
                            <div className="flex justify-center text-slate-400 dark:text-slate-600"><VideoCameraIcon /></div>
                            <p className="mt-2">Your video will appear here.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default VideoGenerator;