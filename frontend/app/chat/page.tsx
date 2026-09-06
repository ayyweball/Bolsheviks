'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { useAppStore } from '@/lib/store';
import { Bot, Send, User, Sparkles, Loader2, Lightbulb } from 'lucide-react';

export default function ChatPage() {
  const { t, language } = useLanguage();
  const { user } = useAppStore();

  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: language === 'hi'
        ? `नमस्ते ${user?.name || 'उद्यमी'}! मैं आपका UnnatE AI व्यावसायिक सलाहकार हूँ। आप मुझसे अपने बिज़नेस प्लान, MUDRA ऋण आवेदन प्रक्रिया या सरकारी सब्सिडी के बारे में कुछ भी पूछ सकते हैं।`
        : `Hello ${user?.name || 'Entrepreneur'}! I am your UnnatE AI business advisor. Ask me anything about your business feasibility, MUDRA loan application steps, or government scheme eligibility.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleSend = async (textToSend?: string) => {
    const msg = textToSend || input;
    if (!msg.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: msg }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversationId
        }),
      });

      const data = await res.json();
      if (data.chatId) setConversationId(data.chatId);
      if (data.message) {
        setMessages([...newMsgs, { role: 'assistant', content: data.message }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = language === 'hi' ? [
    'MUDRA लोन के लिए कौन से दस्तावेज़ चाहिए?',
    'डेयरी फार्म के लिए सरकारी सब्सिडी कैसे मिलेगी?',
    '5 लाख रुपये के लोन की मासिक EMI कितनी होगी?'
  ] : [
    'What documents are needed for a MUDRA loan?',
    'How do I get a government subsidy for dairy farming?',
    'What will be the monthly EMI for a ₹5 Lakh loan?'
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />

        <main className="flex-1 p-6 flex flex-col h-[calc(100vh-4rem)]">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold text-slate-900">{t('nav.aiAdvisor')} Assistant</h1>
                  <p className="text-[11px] text-slate-500">Hyper-Local Rural Business Advisory • Powered by Claude Sonnet & Haiku</p>
                </div>
              </div>
            </div>

            {/* Messages Scroll Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 max-w-2xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 mr-auto">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3 bg-slate-100 rounded-2xl text-xs text-slate-500 font-semibold animate-pulse">
                    Advisor thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(qp)}
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors flex items-center gap-1.5"
                >
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  <span>{qp}</span>
                </button>
              ))}
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="p-4 border-t border-slate-200 flex gap-2"
            >
              <input
                type="text"
                placeholder={language === 'hi' ? 'अपना प्रश्न यहाँ लिखें...' : 'Ask your business query here...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>
        </main>
      </div>
    </div>
  );
}
