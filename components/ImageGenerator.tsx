import React, { useState, useEffect } from 'react';
import { generateImage } from '../services/geminiService';
import { PhotoIcon } from './icons/PhotoIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { useAuth } from '../hooks/useAuth';
import * as historyService from '../services/historyService';
import { ImageHistoryItem } from '../types';
import { FREE_GENERATION_LIMIT } from '../services/historyService';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { trackContentGeneration } from '../utils/analytics';

interface ImageGeneratorProps {
    onHistoryChange: () => void;
}

type ImageStyle = 'Character Art' | 'Anime/Manga' | 'Photorealistic' | 'Digital Art' | 'Cartoon';
const styles: ImageStyle[] = ['Character Art', 'Anime/Manga', 'Photorealistic', 'Digital Art', 'Cartoon'];

const examplePrompts = [
    'A majestic blue dragon flying through a cyberpunk city',
    'An enchanted forest with glowing mushrooms and whimsical creatures',
    'A photorealistic portrait of an astronaut on Mars',
    'A cartoon-style image of a happy robot serving coffee',
    'Concept art for a futuristic flying car',
    'A tranquil Japanese garden in the style of a watercolor painting',
];

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onHistoryChange }) => {
    const { user, openLoginModal } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('Character Art');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [remainingGenerations, setRemainingGenerations] = useState<number>(FREE_GENERATION_LIMIT);
    
    const isLimitReached = user && !user.isPro ? remainingGenerations <= 0 : false;

    useEffect(() => {
        if (user) {
            const { remaining } = historyService.getUsage(user.email);
            setRemainingGenerations(remaining);
        } else {
            setRemainingGenerations(FREE_GENERATION_LIMIT);
        }
    }, [user]);

    const handleGenerate = async () => {
        if (!user) {
            openLoginModal();
            return;
        }
        if (isLimitReached) {
            return;
        }
        if (!prompt.trim()) {
            setError('Please enter a description for the image.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setGeneratedImage(null);

        try {
            const imageBase64 = await generateImage(prompt, selectedStyle);
            setGeneratedImage(imageBase64);
            
            if (!user.isPro) {
                historyService.incrementUsage(user.email);
                setRemainingGenerations(prev => prev - 1);
            }

            const historyItem: Omit<ImageHistoryItem, 'id' | 'createdAt'> = {
                type: 'image',
                prompt: prompt,
                style: selectedStyle,
                imageBase64: imageBase64,
            };
            historyService.addHistoryItem(user.email, historyItem);
            trackContentGeneration('image', true);
            onHistoryChange();

        } catch (err) {
            console.error(err);
            trackContentGeneration('image', false);
            setError('Failed to generate the image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartOver = () => {
        setPrompt('');
        setGeneratedImage(null);
        setError(null);
    };
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${generatedImage}`;
        link.download = `${prompt.slice(0, 20).replace(/\s+/g, '_')}_${selectedStyle.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
    <div className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-6 md:p-10 animate-fade-in relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Input Section */}
            <div>
                <div className="flex items-center mb-4">
                    <PhotoIcon />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white ml-2">AI Image Generator</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Describe the image you want to create. Powered by <span className="font-semibold text-brand-accent">Imagen 4</span>.</p>
                
                <label htmlFor="image-prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Description:</label>
                <textarea
                    id="image-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A majestic blue dragon flying through a cyberpunk city during a neon-lit rainstorm"
                    className="w-full h-32 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors resize-none"
                    disabled={isLoading}
                />

                <div className="mt-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        <LightBulbIcon />
                        Need inspiration? Try one of these:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {examplePrompts.map((p) => (
                        <button
                            key={p}
                            onClick={() => setPrompt(p)}
                            disabled={isLoading}
                            className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {p}
                        </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select a Style:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {styles.map(style => (
                            <button
                                key={style}
                                onClick={() => setSelectedStyle(style)}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-center ${selectedStyle === style ? 'bg-brand-primary text-white ring-2 ring-brand-accent' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                disabled={isLoading}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="mt-8">
                     <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Image Editing:</p>
                     <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                         <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered image editing is coming soon!</p>
                     </div>
                 </div>

                <div className="mt-8 flex flex-col">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt || isLimitReached}
                        className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-accent disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                    >
                        {isLoading ? <><LoadingSpinner /> Generating Image...</> : <><SparklesIcon className="h-6 w-6" /> Generate Image</>}
                    </button>
                    {user && !user.isPro && !isLimitReached && (
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
                            You have <span className="font-bold text-brand-accent">{remainingGenerations}</span> free generations remaining.
                        </p>
                    )}
                    {user && user.isPro && (
                        <p className="text-center text-sm text-green-500 dark:text-green-400 mt-3 flex items-center justify-center gap-1">
                            <SparklesIcon className="h-4 w-4" /> Pro Plan Active
                        </p>
                    )}
                    {isLimitReached && (
                        <div className="mt-4 text-center p-4 bg-amber-100 dark:bg-yellow-900/30 rounded-lg border border-amber-300 dark:border-yellow-700">
                            <h4 className="font-bold text-amber-700 dark:text-yellow-300">Free Limit Reached</h4>
                            <p className="text-sm text-amber-600 dark:text-yellow-400 mt-1">You've used all your free generations.</p>
                            <a href="#pricing" className="mt-3 inline-block bg-brand-primary text-white font-bold px-4 py-1.5 rounded-md text-sm hover:bg-brand-accent">
                                Upgrade to Pro
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Output Section */}
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Generated Image</h2>
                <div className="bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 flex-grow min-h-[300px] flex items-center justify-center">
                    {error && <div className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</div>}
                    {isLoading && !error && (
                        <div className="text-center text-slate-500 dark:text-slate-400">
                            <LoadingSpinner />
                            <p className="mt-2 font-semibold">Creating your masterpiece...</p>
                        </div>
                    )}
                    {generatedImage && !isLoading && (
                        <div className="w-full animate-fade-in">
                            <img src={`data:image/png;base64,${generatedImage}`} alt={prompt} className="rounded-lg w-full object-contain max-h-96" />
                            <div className="mt-4 flex items-center justify-center gap-4">
                                <button onClick={handleDownload} className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                                    <DownloadIcon />
                                    Download
                                </button>
                                <button onClick={handleStartOver} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold px-4 py-2 rounded-lg transition-colors">
                                    Start Over
                                </button>
                            </div>
                        </div>
                    )}
                    {!isLoading && !generatedImage && !error && (
                        <div className="text-center text-slate-400 dark:text-slate-500">
                            <div className="flex justify-center text-slate-400 dark:text-slate-600"><PhotoIcon /></div>
                            <p className="mt-2">Your image will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
    );
};

export default ImageGenerator;