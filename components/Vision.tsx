import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import LoginOverlay from './LoginOverlay';
import { EyeIcon } from './icons/EyeIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

const Vision: React.FC = () => {
    const { user } = useAuth();
    const [image, setImage] = useState<{ base64: string; mimeType: string; file: File } | null>(null);
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setImage({ base64: base64String, mimeType: file.type, file });
                setResponse('');
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAnalyze = async () => {
        if (!image || !prompt.trim()) {
            setError('Please upload an image and enter a prompt.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setResponse('');
        try {
            const result = await analyzeImage(prompt, image.base64, image.mimeType);
            setResponse(result);
        } catch (err) {
            setError('Failed to analyze the image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-6 md:p-10 animate-fade-in relative min-h-[70vh] flex flex-col">
            {!user && <LoginOverlay title="AI Vision Analyzer" description="Sign in to upload an image and ask Gemini questions about it." />}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 h-full">
                {/* Input Section */}
                <div className="flex flex-col">
                    <div className="flex items-center mb-4">
                        <EyeIcon className="h-6 w-6" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white ml-2">Vision Analyzer</h2>
                    </div>
                    
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-900/25 dark:border-slate-100/25 px-6 py-10 flex-grow">
                        <div className="text-center w-full">
                             {image ? (
                                <div className="relative group">
                                    <img src={URL.createObjectURL(image.file)} alt="Upload preview" className="mx-auto h-48 w-auto object-contain rounded-md" />
                                     <label htmlFor="file-upload" className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        Change Image
                                    </label>
                                </div>
                            ) : (
                                <>
                                    <PhotoIcon />
                                    <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-primary hover:text-brand-accent">
                                            <span>Upload an image</span>
                                        </label>
                                    </div>
                                    <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">PNG, JPG, WEBP</p>
                                </>
                            )}
                             <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" disabled={!user}/>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label htmlFor="vision-prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What do you want to know?</label>
                        <textarea
                            id="vision-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., What is in this image? or Write a product description for this item."
                            className="w-full h-24 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors resize-none"
                            disabled={!user || isLoading}
                        />
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !image || !prompt.trim() || !user}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-accent disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? <><LoadingSpinner /> Analyzing...</> : 'Analyze Image'}
                    </button>
                </div>
                {/* Output Section */}
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">AI Response</h2>
                     <div className="bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 flex-grow">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                                <LoadingSpinner />
                                <p className="ml-2 font-semibold">Thinking...</p>
                            </div>
                        )}
                        {error && <div className="text-red-500">{error}</div>}
                        {response && !isLoading && (
                            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{response}</p>
                        )}
                        {!isLoading && !response && !error && (
                             <div className="text-center text-slate-400 dark:text-slate-500 flex items-center justify-center h-full">
                                <p>The analysis will appear here.</p>
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Vision;
