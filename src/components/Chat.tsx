'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Trash2, Upload } from 'lucide-react';
import DOMPurify from 'dompurify';
import { ChatMessage, ChatHistory } from '@/lib/types';
import { GeminiChatClient } from '@/lib/geminiClient';
import { TopicKey } from '@/lib/topicConfig';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTechTree } from '@/hooks/useTechTree';

interface ChatProps {
  topic: TopicKey; // NEW: Accept topic prop
}

const Chat: React.FC<ChatProps> = ({ topic }) => {
  const { techTree } = useTechTree(topic); // Use topic to fetch correct tree
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [geminiClient, setGeminiClient] = useState<GeminiChatClient | null>(
    null,
  );
  const [requestCount, setRequestCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rate limiting configuration
  const MAX_REQUESTS_PER_HOUR = 20;
  const MIN_REQUEST_INTERVAL = 3000;

  // Initialize Gemini client
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      setGeminiClient(new GeminiChatClient(apiKey));
    } else {
      console.error('NEXT_PUBLIC_GEMINI_API_KEY is not set');
    }
  }, []);

  // Load chat history and rate limiting data from localStorage on mount
  useEffect(() => {
    try {
      // Use topic-specific storage key
      const storageKey = `tech-tree-chat-history-${topic}`;
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        const history: ChatHistory = JSON.parse(savedHistory);
        setMessages(history.messages);

        // Restore scroll position after messages are loaded
        setTimeout(() => {
          const savedScrollPosition = localStorage.getItem(
            `tech-tree-chat-scroll-${topic}`,
          );
          if (savedScrollPosition && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = parseInt(
              savedScrollPosition,
              10,
            );
          }
        }, 100);
      }

      // Load rate limiting data (shared across topics)
      const savedRequestCount = localStorage.getItem('tech-tree-request-count');
      const savedLastRequestTime = localStorage.getItem(
        'tech-tree-last-request-time',
      );

      if (savedRequestCount) {
        setRequestCount(parseInt(savedRequestCount, 10));
      }
      if (savedLastRequestTime) {
        setLastRequestTime(parseInt(savedLastRequestTime, 10));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [topic]); // Reload when topic changes

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      const history: ChatHistory = {
        messages,
        lastUpdated: Date.now(),
      };
      try {
        // Use topic-specific storage key
        const storageKey = `tech-tree-chat-history-${topic}`;
        localStorage.setItem(storageKey, JSON.stringify(history));
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  }, [messages, topic]);

  // Save rate limiting data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tech-tree-request-count', requestCount.toString());
      localStorage.setItem(
        'tech-tree-last-request-time',
        lastRequestTime.toString(),
      );
    } catch (error) {
      console.error('Error saving rate limiting data:', error);
    }
  }, [requestCount, lastRequestTime]);

  // Auto-scroll to bottom only when user sends a message
  useEffect(() => {
    // Only scroll if the last message is from the user or if it's the first message
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === 'user') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Reset counter if more than 1 hour has passed
    if (lastRequestTime < oneHourAgo) {
      setRequestCount(0);
      setLastRequestTime(now);
      return true;
    }

    // Check hourly limit
    if (requestCount >= MAX_REQUESTS_PER_HOUR) {
      setRateLimitExceeded(true);
      return false;
    }

    // Check minimum interval between requests
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        alert('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && !file) return;
    if (!geminiClient) {
        const errorMsg: ChatMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: 'Error: Gemini API key not configured.',
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
    }

    // Check rate limits
    if (!checkRateLimit()) {
      if (rateLimitExceeded) {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Rate limit exceeded. You can make up to ${MAX_REQUESTS_PER_HOUR} requests per hour. Please try again later.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Please wait at least ${
            MIN_REQUEST_INTERVAL / 1000
          } seconds between requests.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim() + (file ? ` [File: ${file.name}]` : ''),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setUploadStatus(file ? 'Processing PDF document...' : '');
    setRequestCount((prev) => prev + 1);
    setLastRequestTime(Date.now());
    setRateLimitExceeded(false);

    try {
      // Pass topic to sendMessage
      const response = await geminiClient.sendMessage(
        userMessage.content,
        techTree || { nodes: [], edges: [] },
        messages,
        topic, // NEW: Pass topic parameter
        file || undefined,
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: error instanceof Error 
          ? `Error: ${error.message}` 
          : 'Sorry, there was an error processing your request. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setUploadStatus('');
      setFile(null);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    const storageKey = `tech-tree-chat-history-${topic}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`tech-tree-chat-scroll-${topic}`);
  };

  const saveScrollPosition = () => {
    if (messagesContainerRef.current) {
      localStorage.setItem(
        `tech-tree-chat-scroll-${topic}`,
        messagesContainerRef.current.scrollTop.toString(),
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    // Focus the textarea after setting the input
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Tech Tree Chat</CardTitle>
        <div className="flex items-center space-x-2">
          {rateLimitExceeded && (
            <Badge variant="destructive" className="text-xs">
              Rate Limited
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {requestCount}/{MAX_REQUESTS_PER_HOUR} requests per hour
          </Badge>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
              title="Clear Chat History"
            >
              <Trash2 size={18} />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={saveScrollPosition}
      >
        {messages.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 mt-8">
              <p className="text-lg mb-4">Ask anything about the Tech Tree:</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    handleSuggestedQuestion('What is this Tech Tree about?')
                  }
                >
                  Explanation of Tech Tree
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    handleSuggestedQuestion(
                      'What are the enabling technologies with the highest impact?',
                    )
                  }
                >
                  Highest Impact
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    handleSuggestedQuestion(
                      'Which technologies have the highest TRL?',
                    )
                  }
                >
                  Highest TRL Technologies
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    handleSuggestedQuestion(
                      'What are the most promising investments?',
                    )
                  }
                >
                  Investment Opportunities
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <Card
                className={`max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-slate-600 text-white border-slate-600'
                    : 'bg-gray-100 text-gray-900 border'
                }`}
              >
                <CardContent
                  className={`p-4 ${
                    message.type === 'user' ? 'p-3' : 'p-4 pl-6'
                  }`}
                >
                  <div className="break-words">
                    {message.type === 'assistant' ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            // Remove ```html and ``` markers from the response
                            message.content
                              .replace(/^```html\s*/i, '')
                              .replace(/```[\s\n]*$/, ''),
                            {
                              ALLOWED_TAGS: [
                                'h2',
                                'h3',
                                'h4',
                                'p',
                                'ul',
                                'ol',
                                'li',
                                'strong',
                                'em',
                                'table',
                                'thead',
                                'tbody',
                                'tr',
                                'td',
                                'th',
                                'code',
                                'pre',
                                'br',
                                'a',
                              ],
                              ALLOWED_ATTR: ['class', 'href', 'target', 'rel'],
                            },
                          ),
                        }}
                        className="prose prose-sm max-w-none [&_table]:overflow-x-auto [&_table]:block [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2 [&_td]:whitespace-nowrap [&_th]:border [&_th]:border-gray-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-50 [&_th]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-3 [&_ol]:text-gray-700 [&_li]:mb-1 [&_a]:text-blue-600 [&_a]:hover:underline"
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-xs mt-2 ${
                      message.type === 'user'
                        ? 'text-slate-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <Card className="bg-gray-100 border">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 size={16} className="animate-spin text-gray-500" />
                  <span className="text-gray-500">
                    {uploadStatus || 'Thinking...'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        {file && (
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <Upload size={14} />
            <span className="flex-1">{file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
              className="h-6 px-2"
            >
              Remove
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or upload a PDF for analysis..."
              className="w-full resize-none pr-24 max-h-32"
              rows={1}
              disabled={isLoading || rateLimitExceeded}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <label htmlFor="file-upload-chat">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="p-1 h-8 w-8 cursor-pointer"
                  disabled={isLoading}
                  onClick={() => document.getElementById('file-upload-chat')?.click()}
                >
                  <Upload size={18} />
                </Button>
              </label>
              <input
                id="file-upload-chat"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="submit"
                size="sm"
                disabled={(!input.trim() && !file) || isLoading || !geminiClient || rateLimitExceeded}
                className="p-1 h-8 w-8"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line. PDF files up to 10MB supported.
        </p>
      </div>
    </div>
  );
};

export default Chat;