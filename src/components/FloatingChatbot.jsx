import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase';
import { ref, get } from 'firebase/database';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { ALGOCORE_BASE_URL } from '../views/api';

const FloatingChatbot = ({ contextCode, isCompiler }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi there! I am your learning assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);
    const messagesEndRef = useRef(null);
    const [isIdle, setIsIdle] = useState(false);
    const idleTimer = useRef(null);

    const handleMouseEnter = () => {
        setIsIdle(false);
        if (idleTimer.current) clearTimeout(idleTimer.current);
    };

    const handleMouseLeave = () => {
        if (isCompiler && !isOpen) {
            idleTimer.current = setTimeout(() => setIsIdle(true), 5000);
        }
    };

    useEffect(() => {
        if (isCompiler && !isOpen) {
            idleTimer.current = setTimeout(() => setIsIdle(true), 5000);
        } else {
            setIsIdle(false);
            if (idleTimer.current) clearTimeout(idleTimer.current);
        }
        return () => {
            if (idleTimer.current) clearTimeout(idleTimer.current);
        };
    }, [isCompiler, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        const fetchSettings = async () => {
            if (user?.uid) {
                try {
                    const snap = await get(ref(database, `users/${user.uid}/profile/settings/chatbotEnabled`));
                    if (snap.exists()) {
                        setIsEnabled(snap.val() !== false);
                    }
                } catch (e) {
                    console.error("Failed to load chatbot setting", e);
                }
            } else {
                setIsEnabled(true);
            }
        };
        fetchSettings();
    }, [user]);

    if (!isEnabled) return null;

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        // Calculate message count to determine constraints
        const messageCount = messages.length;
        let systemConstraint = "";
        
        if (messageCount < 20) {
            systemConstraint = "SYSTEM INSTRUCTION: You are a learning assistant. DO NOT PROVIDE ANY CODE SNIPPETS. Give only textual explanations, conceptual hints, and guidance. If the user asks for code, explain that you can only provide text hints for now.";
        } else {
            systemConstraint = "SYSTEM INSTRUCTION: You are a learning assistant. DO NOT PROVIDE RUNNABLE CODE. Provide ONLY pseudocode to explain logic. Do not write full implementations in any specific programming language.";
        }

        // Augment API payload with context code and system constraints
        let apiMessages = [
            { role: 'system', content: systemConstraint },
            ...newMessages
        ];

        if (contextCode && typeof contextCode === 'string' && contextCode.trim().length > 0) {
            const augmentedLastMessage = {
                role: 'user',
                content: `${input.trim()}\n\n[Context - Current Editor Code:\n\`\`\`\n${contextCode}\n\`\`\`]\n\n(Remember: ${messageCount < 20 ? "TEXT ONLY, NO CODE" : "PSEUDOCODE ONLY"})`
            };
            apiMessages = [
                { role: 'system', content: systemConstraint },
                ...messages, 
                augmentedLastMessage
            ];
        }

        try {
            const response = await axios.post(`${ALGOCORE_BASE_URL}chat`, {
                messages: apiMessages
            });

            setMessages([...newMessages, {
                role: 'assistant',
                content: response.data.reply || response.data.response || response.data.message || response.data.content || "I didn't quite get that."
            }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 transition-opacity duration-500 hover:opacity-100 ${isIdle ? 'opacity-10' : 'opacity-100'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Chatbot Window */}
            {isOpen && (
                <div className={`absolute bottom-20 right-0 w-80 sm:w-96 h-[500px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${theme === 'dark'
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}>
                    {/* Header */}
                    <div className={`p-4 flex items-center justify-between shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-600'
                        }`}>
                        <div className="flex items-center space-x-2">
                            <Bot className={`${theme === 'dark' ? 'text-blue-400' : 'text-white'}`} size={24} />
                            <h3 className="font-semibold text-white">Learning Assistant</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={`p-1 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-blue-700 text-white'
                                }`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                        }`}>
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex items-start space-x-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                                    }`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : theme === 'dark' ? 'bg-gray-800 text-blue-400' : 'bg-white shadow text-blue-600'
                                        }`}>
                                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl text-sm overflow-x-auto ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : theme === 'dark'
                                            ? 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700 prose dark:prose-invert max-w-none'
                                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200 shadow-sm prose max-w-none'
                                        }`}>
                                        {msg.role === 'user' ? (
                                            <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                                        ) : (
                                            <ReactMarkdown
                                                components={{
                                                    pre: ({ node, ...props }) => (
                                                        <div className="overflow-x-auto bg-gray-900 text-gray-100 rounded p-2 my-2 w-full">
                                                            <pre {...props} />
                                                        </div>
                                                    ),
                                                    code: ({ node, inline, ...props }) => (
                                                        inline
                                                            ? <code className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100 text-blue-600'} rounded px-1`} {...props} />
                                                            : <code {...props} />
                                                    )
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className={`flex items-start space-x-2`}>
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 text-blue-400' : 'bg-white shadow text-blue-600'
                                        }`}>
                                        <Bot size={16} />
                                    </div>
                                    <div className={`px-4 py-3 rounded-2xl rounded-tl-none border ${theme === 'dark'
                                        ? 'bg-gray-800 border-gray-700'
                                        : 'bg-white border-gray-200 shadow-sm'
                                        }`}>
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className={`w-full pr-12 pl-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${theme === 'dark'
                                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
                                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                                    }`}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className={`absolute right-2 p-2 rounded-lg text-white transition-colors disabled:opacity-50 ${input.trim() && !isLoading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
                                    }`}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-300 focus:outline-none ${theme === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </button>
        </div>
    );
};

export default FloatingChatbot;
