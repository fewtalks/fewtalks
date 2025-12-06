import React, { useState, useEffect, FormEvent } from 'react';
import { generateTweetsFromText, getTopNews, generateImage } from '../services/geminiService';
import { Tweet, TweetHistoryItem, ImageHistoryItem } from '../types';
import TweetCard from './TweetCard';
import { SparklesIcon } from './icons/SparklesIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { SearchIcon } from './icons/SearchIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { useAuth } from '../hooks/useAuth';
import * as historyService from '../services/historyService';
import { FREE_GENERATION_LIMIT } from '../services/historyService';
import { trackContentGeneration } from '../utils/analytics';


interface TweetGeneratorProps {
  onHistoryChange: () => void;
}

type Tone = 'Professional' | 'Casual' | 'Witty';
type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Hindi';
type NewsSearchMode = 'topic' | 'location';
type InputMode = 'text' | 'url';

const tones: Tone[] = ['Professional', 'Casual', 'Witty'];
const languages: Language[] = ['English', 'Spanish', 'French', 'German', 'Hindi'];

const TweetGenerator: React.FC<TweetGeneratorProps> = ({ onHistoryChange }) => {
  const { user, openLoginModal } = useAuth();
  const [inputText, setInputText] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [selectedTone, setSelectedTone] = useState<Tone>('Casual');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('English');
  const [includeImage, setIncludeImage] = useState<boolean>(false);
  const [numTweets, setNumTweets] = useState<number>(3);
  const [includeHashtags, setIncludeHashtags] = useState<boolean>(true);
  const [generatedTweets, setGeneratedTweets] = useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('AI is thinking...');
  const [error, setError] = useState<string | null>(null);
  const [remainingGenerations, setRemainingGenerations] = useState<number>(FREE_GENERATION_LIMIT);


  const [newsHeadlines, setNewsHeadlines] = useState<string[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(true);
  const [newsSearchTerm, setNewsSearchTerm] = useState<string>('');
  const [currentNewsQuery, setCurrentNewsQuery] = useState<string>('Top trending news');
  const [newsSearchMode, setNewsSearchMode] = useState<NewsSearchMode>('topic');
  
  const isLimitReached = user && !user.isPro ? remainingGenerations <= 0 : false;
  const isInputInvalid = inputMode === 'text' ? !inputText.trim() : !urlInput.trim();

  useEffect(() => {
    if (user) {
      const { remaining } = historyService.getUsage(user.email);
      setRemainingGenerations(remaining);
    } else {
      setRemainingGenerations(FREE_GENERATION_LIMIT);
    }
  }, [user]);

  const fetchNews = async (query: string, mode: NewsSearchMode) => {
    setIsNewsLoading(true);
    setError(null);
    if(query === 'Top trending news') {
        setNewsSearchTerm('');
    }
    setCurrentNewsQuery(query);
    try {
      const headlines = await getTopNews(query, mode);
      setNewsHeadlines(headlines);
    } catch (err) {
      console.error("Failed to load news headlines:", err);
      setError(`Failed to fetch headlines for "${query}". Please try again.`);
      setNewsHeadlines([]);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews('Top trending news', 'topic');
  }, []);
  
  const handleGenerate = async () => {
    if (!user) {
        openLoginModal();
        return;
    }
     if (isLimitReached) {
      return;
    }
     if (isInputInvalid) {
        const errorMessage = inputMode === 'text'
            ? 'Please paste some text to generate tweets.'
            : 'Please enter a valid URL to generate tweets.';
        setError(errorMessage);
        return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedTweets([]);

    try {
      const sourceContent = inputMode === 'text' ? inputText : urlInput;
      setLoadingMessage('Crafting content...');
      const { tweets, imagePrompt } = await generateTweetsFromText(
        sourceContent,
        inputMode,
        selectedTone,
        selectedLanguage,
        numTweets,
        includeHashtags
      );

      let imageBase64: string | undefined = undefined;

      if (includeImage && imagePrompt) {
        setLoadingMessage('Generating image...');
        imageBase64 = await generateImage(imagePrompt, 'Digital Art');
        const imageHistoryItem: Omit<ImageHistoryItem, 'id' | 'createdAt'> = {
          type: 'image',
          prompt: imagePrompt,
          style: 'Digital Art',
          imageBase64: imageBase64,
        };
        historyService.addHistoryItem(user.email, imageHistoryItem);
      }
      
      setGeneratedTweets(tweets.map(tweetText => ({ text: tweetText, imageBase64 })));
      
      if (!user.isPro) {
        historyService.incrementUsage(user.email);
        setRemainingGenerations(prev => prev - 1);
      }

      tweets.forEach(tweetText => {
        const historyItem: Omit<TweetHistoryItem, 'id' | 'createdAt'> = {
          type: 'tweet',
          text: tweetText,
        };
        historyService.addHistoryItem(user.email, historyItem);
      });
      trackContentGeneration('tweet', true);
      onHistoryChange();

    } catch (err) {
      console.error(err);
      trackContentGeneration('tweet', false);
      setError('Failed to generate content. The AI may be busy, please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasteExample = () => {
    const exampleText = `Fewtalks - Product Idea & Plan

What is Fewtalks?
A web app that instantly converts your long-form thoughts (blog posts, idea notes, podcast summaries) into 2-3 high-quality tweets using AI.

Target Users
Content creators, founders, solopreneurs who want to post regularly on Twitter/X but lack time or inspiration.

Value Proposition
"Paste it - get viral-ready tweets". Grow both consistency and engagement.

Revenue Model
Free plan: 3 free runs as a trial.
Paid plan: Unlimited generations + advanced features (hashtags, thread drafts, Notion/CSV export, scheduling).`;
    setInputText(exampleText);
    setInputMode('text');
  };

  const handleNewsClick = (headline: string) => {
    setInputText(headline);
    setInputMode('text');
    document.getElementById('tweet-input-textarea')?.focus();
  };

  const handleNewsSearch = (e: FormEvent) => {
    e.preventDefault();
    if (newsSearchTerm.trim()) {
      fetchNews(newsSearchTerm.trim(), newsSearchMode);
    }
  };
  
  const handleClearSearch = () => {
    setNewsSearchTerm('');
    document.querySelector<HTMLInputElement>('input[aria-label="Search news"]')?.focus();
  };

  const handleStartOver = () => {
    setGeneratedTweets([]);
    setInputText('');
    setUrlInput('');
    setError(null);
  };
  
  const renderOutputContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
          <LoadingSpinner />
          <p className="mt-2 font-semibold">{loadingMessage}</p>
          <p className="text-sm">Please wait a moment.</p>
        </div>
      );
    }

    if (generatedTweets.length > 0) {
      return (
        <div className="flex flex-col h-full">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 text-center">Generated Content</h3>
          <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
            {generatedTweets.map((tweet, index) => (
              <TweetCard key={index} text={tweet.text} imageBase64={tweet.imageBase64} />
            ))}
          </div>
          <div className="mt-6 text-center shrink-0">
             <button
                onClick={handleStartOver}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
                &larr; Start Over
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full">
        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setNewsSearchMode('topic')} className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1 ${newsSearchMode === 'topic' ? 'bg-brand-primary/20 text-brand-accent' : 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
                <SparklesIcon className="h-4 w-4" /> Topic
              </button>
              <button onClick={() => setNewsSearchMode('location')} className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1 ${newsSearchMode === 'location' ? 'bg-brand-primary/20 text-brand-accent' : 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>
                <LocationMarkerIcon /> Location
              </button>
          </div>
          <form onSubmit={handleNewsSearch} className="relative flex items-center">
            <input
              type="text"
              value={newsSearchTerm}
              onChange={(e) => setNewsSearchTerm(e.target.value)}
              placeholder={newsSearchMode === 'topic' ? "Search news by topic (e.g., AI)" : "Search news by location (e.g., Paris)"}
              className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-4 py-2 pr-20 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-colors"
              disabled={isNewsLoading}
              aria-label="Search news"
            />
            <div className="absolute right-2 flex items-center">
              {newsSearchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  aria-label="Clear search text"
                >
                  <XCircleIcon />
                </button>
              )}
              <button
                type="submit"
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
                disabled={isNewsLoading || !newsSearchTerm.trim()}
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            </div>
          </form>
          {currentNewsQuery !== 'Top trending news' && (
            <button 
                onClick={() => fetchNews('Top trending news', 'topic')} 
                className="mt-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-700 w-full text-center font-semibold py-2 px-4 rounded-md transition-colors"
            >
                Show Trending News
            </button>
          )}
        </div>

        <div className="flex-grow overflow-hidden flex flex-col">
          {isNewsLoading ? (
            <div className="flex flex-col h-full">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4 mb-3 animate-pulse shrink-0"></div>
              <div className="overflow-y-auto pr-2">
                <ul className="space-y-2">
                  {[...Array(8)].map((_, index) => (
                    <li key={index}>
                      <div className="w-full p-3 rounded-lg bg-slate-200 dark:bg-slate-700/50 animate-pulse">
                        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full mb-2"></div>
                        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-5/6"></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : newsHeadlines.length > 0 ? (
            <>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 shrink-0">
                  Headlines on "{currentNewsQuery}"
              </h3>
              <div className="overflow-y-auto pr-2">
                <ul className="space-y-2">
                  {newsHeadlines.map((headline, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleNewsClick(headline)}
                        className="w-full text-left p-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-brand-accent transition-all duration-200"
                        aria-label={`Use headline: ${headline}`}
                      >
                        {headline}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
             <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-center">
                <p>No headlines found for "{currentNewsQuery}".<br/>Try another search.</p>
              </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-6 md:p-10 relative animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Input Section */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Provide Content</h2>
          
           <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
              <button
                onClick={() => setInputMode('text')}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${inputMode === 'text' ? 'bg-slate-100 dark:bg-slate-800 text-brand-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
              >
                Paste Text
              </button>
              <button
                onClick={() => setInputMode('url')}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${inputMode === 'url' ? 'bg-slate-100 dark:bg-slate-800 text-brand-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
              >
                From URL
              </button>
            </div>

            <div className="relative flex-grow">
                {inputMode === 'text' ? (
                     <>
                        <textarea
                          id="tweet-input-textarea"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Paste your blog post, notes... or pick a headline from the right."
                          className="w-full h-full min-h-[250px] bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 pb-10 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors resize-none"
                          disabled={isLoading}
                        />
                        <div className="absolute bottom-3 right-4 text-sm text-slate-400 dark:text-slate-500 pointer-events-none">
                            {inputText.length} characters
                        </div>
                     </>
                ) : (
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/blog/my-latest-article"
                        className="w-full h-full min-h-[250px] bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
                        disabled={isLoading}
                    />
                )}
          </div>
          
          <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select a Tone:</label>
              <div className="flex gap-2 flex-wrap">
                  {tones.map(tone => (
                      <button
                          key={tone}
                          onClick={() => setSelectedTone(tone)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedTone === tone ? 'bg-brand-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                          disabled={isLoading}
                      >
                          {tone}
                      </button>
                  ))}
              </div>
          </div>
          
          <div className="mt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <GlobeIcon />
                  Select a Language:
              </label>
              <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                  className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-4 py-2 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                  disabled={isLoading}
              >
                  {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
          </div>
          
          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Number of Tweets:</label>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(num => (
                            <button
                                key={num}
                                onClick={() => setNumTweets(num)}
                                disabled={isLoading}
                                className={`w-12 h-10 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${numTweets === num ? 'bg-brand-primary text-white ring-2 ring-brand-accent' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Hashtags Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-primary/50 dark:hover:border-brand-primary/50 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Include relevant hashtags</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Add trending hashtags to your tweets</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => !isLoading && setIncludeHashtags(!includeHashtags)}
                            disabled={isLoading}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                includeHashtags 
                                    ? 'bg-brand-primary' 
                                    : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                            role="switch"
                            aria-checked={includeHashtags}
                            aria-label="Include relevant hashtags"
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    includeHashtags ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    {/* Generated Image Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-primary/50 dark:hover:border-brand-primary/50 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Include a generated image</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Create AI-generated images for your tweets</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => !isLoading && setIncludeImage(!includeImage)}
                            disabled={isLoading}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                includeImage 
                                    ? 'bg-brand-primary' 
                                    : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                            role="switch"
                            aria-checked={includeImage}
                            aria-label="Include a generated image"
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    includeImage ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>
          </div>


          <div className="mt-6 flex flex-col">
            <button
              onClick={handleGenerate}
              disabled={isLoading || isInputInvalid || isLimitReached}
              className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-accent disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-6 w-6" />
                  Generate Content
                </>
              )}
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
            <button
              onClick={handlePasteExample}
              disabled={isLoading}
              className="w-full sm:w-auto text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors py-3 px-4 mx-auto"
            >
              Use Example
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. 💥 Ride Google Trends — Create Viral Magic!</h2>
          <div className="bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-4 flex-grow min-h-[300px] flex flex-col">
            {error && !isNewsLoading && <div className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg mb-4 shrink-0">{error}</div>}
            
            <div className="flex-grow relative">
              {renderOutputContent()}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TweetGenerator;