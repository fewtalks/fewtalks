import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { EyeIcon } from './icons/EyeIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { Tool } from '../App';
import { trackToolSelection } from '../utils/analytics';


interface ToolSelectorProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const contentTools: { name: Tool; icon: React.FC<{className?: string}> }[] = [
  { name: 'Tweets', icon: SparklesIcon },
  { name: 'Images', icon: PhotoIcon },
  { name: 'Videos', icon: VideoCameraIcon },
];

const assistantTools: { name: Tool; icon: React.FC<{className?: string}> }[] = [
  { name: 'Chat', icon: ChatBubbleIcon },
  { name: 'Vision', icon: EyeIcon },
  { name: 'Live', icon: MicrophoneIcon },
]

const ToolButton: React.FC<{
    name: Tool;
    icon: React.FC<{className?: string}>;
    isActive: boolean;
    onClick: () => void;
}> = ({ name, icon: Icon, isActive, onClick }) => {
    const handleClick = () => {
        onClick();
        trackToolSelection(name);
    };
    
    return (
    <button
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ease-in-out touch-manipulation min-h-[44px] flex-1 sm:flex-initial ${
        isActive
            ? 'bg-brand-primary text-white shadow-md'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 active:bg-slate-300 dark:active:bg-slate-700'
        }`}
    >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="whitespace-nowrap">{name}</span>
    </button>
    );
}

const ToolSelector: React.FC<ToolSelectorProps> = ({ activeTool, setActiveTool }) => {
  return (
    <div className="bg-slate-200/70 dark:bg-brand-light/70 rounded-xl shadow-lg p-3 sm:p-4 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-3xl mx-auto">
        <div className="w-full sm:w-auto">
            <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 text-center sm:text-left">Content Generators</h3>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-center sm:justify-start">
                {contentTools.map(({ name, icon }) => (
                    <ToolButton key={name} name={name} icon={icon} isActive={activeTool === name} onClick={() => setActiveTool(name)} />
                ))}
            </div>
        </div>
        <div className="h-px sm:h-8 w-full sm:w-px bg-slate-300 dark:bg-slate-600"></div>
        <div className="w-full sm:w-auto">
            <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2 text-center sm:text-left">AI Assistants</h3>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-center sm:justify-start">
                {assistantTools.map(({ name, icon }) => (
                    <ToolButton key={name} name={name} icon={icon} isActive={activeTool === name} onClick={() => setActiveTool(name)} />
                ))}
            </div>
        </div>
    </div>
  );
};

export default ToolSelector;