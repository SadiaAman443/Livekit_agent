import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, PhoneCall } from 'lucide-react';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! I am your AI Receptionist. How can I help you today?', isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, isBot: false }]);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/api/chat', { message: userMsg });
      setMessages(prev => [...prev, { id: Date.now().toString(), text: response.data.response, isBot: true }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Sorry, I encountered an error connecting to the AI.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex space-x-6">
      {/* Left Pane: History Placeholder */}
      <div className="w-1/3 crm-card hidden lg:flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50">
          <h3 className="font-semibold text-slate-800">Recent Conversations</h3>
        </div>
        <div className="p-2 overflow-y-auto flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border-b border-border last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">Visitor {i}</span>
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">I would like to know about...</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Chat Window */}
      <div className="flex-1 crm-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-slate-50 flex items-center">
             <PhoneCall className="w-5 h-5 text-primary mr-2" />
             <h3 className="font-semibold text-slate-800">Live Simulator</h3>
          </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.isBot ? "justify-start" : "justify-end")}>
              <div className={cn("flex max-w-[85%] space-x-3", msg.isBot ? "flex-row" : "flex-row-reverse space-x-reverse")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1", 
                  msg.isBot ? "bg-primary text-white" : "bg-blue-100 text-primary"
                )}>
                  {msg.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "px-4 py-3 rounded-2xl shadow-sm",
                  msg.isBot ? "bg-white border border-border text-slate-700 rounded-tl-none" : "bg-primary text-white rounded-tr-none"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-border text-slate-500 rounded-tl-none flex items-center space-x-1 h-11">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-border">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="crm-input flex-1 bg-slate-50"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-primary text-white p-2.5 rounded-md hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
