import React, { useState } from 'react';
import { HistoryItem, HistoryItemType, TweetHistoryItem, ImageHistoryItem, VideoHistoryItem } from '../types';
import TweetCard from './TweetCard';
import { DownloadIcon } from './icons/DownloadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useAuth } from '../hooks/useAuth';
import * as historyService from '../services/historyService';

interface HistoryPanelProps {
  historyItems: HistoryItem[];
  onHistoryChange: () => void;
}

type FilterType = 'all' | HistoryItemType;

const HistoryPanel: React.FC<HistoryPanelProps> = ({ historyItems, onHistoryChange }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<FilterType>('all');

  const handleClearHistory = (type: FilterType) => {
    if (!user) return;
    if (window.confirm(`Are you sure you want to clear all ${type === 'all' ? '' : type} history? This cannot be undone.`)) {
      historyService.clearHistory(user.email, type === 'all' ? undefined : type);
      onHistoryChange();
    }
  };

  const filteredItems = historyItems.filter(item => activeTab === 'all' || item.type === activeTab);

  const renderItem = (item: HistoryItem) => {
    switch (item.type) {
      case 'tweet':
        const tweetItem = item as TweetHistoryItem;
        return <TweetCard key={item.id} text={tweetItem.text} />;
      case 'image':
        const imageItem = item as ImageHistoryItem;
        return (
          <div key={item.id} className="bg-white dark:bg-brand-light p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
            <img src={`data:image/png;base64,${imageItem.imageBase64}`} alt={imageItem.prompt} className="w-full md:w-32 h-32 object-cover rounded-md" />
            <div className="flex-grow">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2"><strong>Prompt:</strong> {imageItem.prompt}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-4"><strong>Style:</strong> {imageItem.style}</p>
              <a 
                href={`data:image/png;base64,${imageItem.imageBase64}`} 
                download={`${imageItem.prompt.slice(0, 15)}.png`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-primary transition-colors bg-slate-200 dark:bg-slate-700 px-3 py-2 rounded-md"
              >
                <DownloadIcon />
                Download
              </a>
            </div>
          </div>
        );
       case 'video':
        const videoItem = item as VideoHistoryItem;
        return (
          <div key={item.id} className="bg-white dark:bg-brand-light p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
            <video src={videoItem.videoUrl} controls className="w-full md:w-48 h-auto object-cover rounded-md bg-black" />
            <div className="flex-grow">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2"><strong>Prompt:</strong> {videoItem.prompt}</p>
              <a 
                href={videoItem.videoUrl} 
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-primary transition-colors bg-slate-200 dark:bg-slate-700 px-3 py-2 rounded-md"
              >
                <DownloadIcon />
                Download Video
              </a>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const tabs: { name: string, type: FilterType }[] = [
    { name: 'All', type: 'all' },
    { name: 'Tweets', type: 'tweet' },
    { name: 'Images', type: 'image' },
    { name: 'Videos', type: 'video' },
  ];

  return (
    <div className="bg-white/50 dark:bg-brand-light/50 rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Creation History</h2>
      <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`${
                activeTab === tab.type
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      
      {filteredItems.length > 0 && (
         <div className="text-right mb-4">
            <button onClick={() => handleClearHistory(activeTab)} className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors ml-auto bg-red-100 dark:bg-red-900/50 px-3 py-1.5 rounded-md">
                <TrashIcon />
                Clear {activeTab !== 'all' && activeTab} history
            </button>
         </div>
      )}

      {filteredItems.length > 0 ? (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredItems.map(renderItem)}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="font-semibold">No {activeTab !== 'all' && activeTab} history yet.</p>
          <p className="text-sm">Creations will appear here after you generate them.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;