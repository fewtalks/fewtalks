import React, { useState, useRef, useEffect } from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { LinkedinIcon } from './icons/LinkedinIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface TweetCardProps {
  text: string;
  imageBase64?: string;
}

const TweetCard: React.FC<TweetCardProps> = ({ text, imageBase64 }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string>('');
  const [editedText, setEditedText] = useState(text);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };
  
  const handleDownload = () => {
    if (!imageBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${imageBase64}`;
    link.download = `generated_image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWithImage = async (event: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    event.preventDefault();
    if (!imageBase64) return;

    try {
        const response = await fetch(`data:image/png;base64,${imageBase64}`);
        const blob = await response.blob();
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
        setCopyNotification('Image copied! Paste it in your post.');
        setTimeout(() => setCopyNotification(''), 3000);
        window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.error('Failed to copy image to clipboard:', error);
        setCopyNotification('Could not copy image. Please download and attach it manually.');
        setTimeout(() => setCopyNotification(''), 4000);
    }
  };

  const encodedText = encodeURIComponent(editedText);
  const shareLinks = {
    x: `https://x.com/intent/tweet?text=${encodedText}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=https://fewtalks.app&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`,
  };

  const socialButtons = [
    { name: 'Post to X', icon: XIcon, url: shareLinks.x, hoverColor: 'hover:text-slate-900 dark:hover:text-white' },
    { name: 'Share on WhatsApp', icon: WhatsappIcon, url: shareLinks.whatsapp, hoverColor: 'hover:text-green-500' },
    { name: 'Share on Facebook', icon: FacebookIcon, url: shareLinks.facebook, hoverColor: 'hover:text-blue-500' },
    { name: 'Share on LinkedIn', icon: LinkedinIcon, url: shareLinks.linkedin, hoverColor: 'hover:text-blue-400' },
  ];

  return (
    <div className="bg-white dark:bg-brand-light p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 animate-fade-in">
      {imageBase64 && (
        <div className="mb-4">
          <img src={`data:image/png;base64,${imageBase64}`} alt="Generated content" className="rounded-lg w-full object-contain max-h-72" />
        </div>
      )}
      <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
        {isEditing ? (
            <textarea
                ref={textareaRef}
                value={editedText}
                onChange={handleTextChange}
                onBlur={() => setIsEditing(false)}
                className="w-full bg-transparent resize-none border-none focus:ring-0 p-0 m-0 outline-none block"
                rows={1}
                aria-label="Edit tweet text"
            />
        ) : (
            <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer min-h-[24px] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/50 p-1 -m-1 transition-colors"
                title="Click to edit"
                aria-label="Tweet text, click to edit"
            >
                {editedText}
            </div>
        )}
      </div>

      <div className="text-right text-xs text-slate-400 dark:text-slate-500 mt-2 font-mono">
        {editedText.length} / 280
      </div>

      {copyNotification && (
        <p className="text-right text-xs mt-2 text-brand-accent">{copyNotification}</p>
      )}
      
      <div className="mt-4 flex justify-end items-center gap-2">
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            title={isCopied ? 'Copied!' : 'Copy Text'}
            aria-label={isCopied ? 'Copied to clipboard' : 'Copy tweet text to clipboard'}
        >
            {isCopied ? <CheckIcon /> : <ClipboardIcon />}
        </button>

        {imageBase64 && (
             <button
                onClick={handleDownload}
                className="flex items-center gap-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                title="Download Image"
            >
                <DownloadIcon />
            </button>
        )}

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>

        {socialButtons.map(({ name, icon: Icon, url, hoverColor }) => (
        <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 text-slate-500 dark:text-slate-400 transition-colors ${hoverColor}`}
            title={name}
            aria-label={name}
            onClick={(e) => {
                if (imageBase64) {
                    handleShareWithImage(e, url);
                }
            }}
        >
            <Icon />
        </a>
        ))}
      </div>
    </div>
  );
};

export default TweetCard;
