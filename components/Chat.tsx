import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { Chat as GenAiChat } from "@google/genai";
import { useAuth } from '../hooks/useAuth';
import LoginOverlay from './LoginOverlay';
import { SparklesIcon } from './icons/SparklesIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const Chat: React.FC = () => {
    const { user } = useAuth();
    const [chat, setChat] = useState<GenAiChat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'You are a friendly and helpful AI assistant named Fewtalks. You can help with content creation, brainstorming, and answering questions.',
                },
            });
            setChat(newChat);
            setMessages([]);
        }
    }, [user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chat) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const responseStream = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '...' }]);

            for await (const chunk of responseStream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, something went wrong. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-6 md:p-10 animate-fade-in relative min-h-[70vh] flex flex-col">
            {!user && <LoginOverlay title="Chat with AI" description="Sign in to start a conversation with your AI assistant." />}
            <div className="flex-grow overflow-y-auto pr-4 -mr-4 mb-4">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 dark:text-slate-500 h-full flex flex-col justify-center items-center">
                        <SparklesIcon className="h-12 w-12 mb-4" />
                        <h2 className="text-xl font-bold">Ask me anything!</h2>
                        <p>I can help you brainstorm ideas, write content, or answer questions.</p>
                    </div>
                )}
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-lg px-4 py-2 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                                {msg.text}
                                {isLoading && msg.role === 'model' && index === messages.length - 1 && <span className="inline-block w-2 h-4 bg-slate-600 dark:bg-slate-300 ml-1 animate-pulse"></span>}
                            </div>
                        </div>
                    ))}
                </div>
                 <div ref={messagesEndRef} />
            </div>
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Type your message..."
                        className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 pr-24 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
                        disabled={isLoading || !user}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim() || !user}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary text-white font-semibold px-4 py-1.5 rounded-md hover:bg-brand-accent disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <LoadingSpinner/> : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;