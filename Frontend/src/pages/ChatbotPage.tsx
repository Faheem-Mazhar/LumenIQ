import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Send, Sparkles, Calendar, Image as ImageIcon, TrendingUp } from 'lucide-react';
import { MOCK_CHATBOT_GREETING, MOCK_CHATBOT_RESPONSES } from '../mockData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: MOCK_CHATBOT_GREETING,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = MOCK_CHATBOT_RESPONSES;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { icon: Sparkles, label: 'Generate Caption', color: 'text-purple-500' },
    { icon: Calendar, label: 'Schedule Post', color: 'text-blue-500' },
    { icon: ImageIcon, label: 'Find Images', color: 'text-green-500' },
    { icon: TrendingUp, label: 'Content Ideas', color: 'text-orange-500' }
  ];

  return (
    <div className="relative text-slate-900 font-switzer">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-slate-200/50 blur-3xl" />
      </div>
      <div className="mx-auto flex min-h-[calc(100vh-220px)] max-w-[96rem] flex-col gap-6 px-4 pb-16 pt-10">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-outfit text-slate-900">AI Assistant</h2>
          <p className="text-slate-600">Your intelligent social media management companion</p>
        </div>

        {/* Chat Container */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-6 p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'gradient-blue-primary text-white'
                      : 'border border-slate-200/70 bg-white text-slate-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className={`mt-2 text-xs ${
                    message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="border-t border-slate-200/70 p-4">
              <p className="mb-3 text-sm text-slate-500">Quick actions:</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => setInput(action.label)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50"
                  >
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm text-slate-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-slate-200/70 bg-white/80 p-4">
            <div className="flex gap-3">
              <Textarea
                placeholder="Ask me anything about your social media content..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[60px] max-h-[120px] resize-none border-slate-200/70 bg-white"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="gradient-blue-primary text-white hover:opacity-90 h-[60px] px-6"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Press Enter to send, Shift + Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
