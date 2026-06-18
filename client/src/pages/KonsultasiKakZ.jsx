import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import stripMarkdown from '../utils/stripMarkdown';

const CONSULT_STORAGE_KEY = 'stubia_konsultasi_history';

const KAK_Z_AVATAR = '/mentorkonsultasi.webp';

const getStoredMessages = () => {
  try {
    const stored = sessionStorage.getItem(CONSULT_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const saveMessages = (msgs) => {
  try {
    sessionStorage.setItem(CONSULT_STORAGE_KEY, JSON.stringify(msgs));
  } catch {}
};

const DEFAULT_MESSAGE = {
  role: 'model',
  text: 'Halo! 👋 Aku Bia, konsultan belajarmu di Stubia.\n\nAku bisa bantu kamu untuk:\n• 📚 Rekomendasi strategi belajar UTBK\n• 🏫 Info Perguruan Tinggi Negeri & jurusan\n• 📊 Analisis peluang masuk PTN\n• 💡 Tips & trik persiapan UTBK\n\nSilakan tanya apa saja ya!',
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const QUICK_PROMPTS = [
  { label: 'Strategi Belajar', icon: 'school', message: 'Bia, aku mau minta rekomendasi strategi belajar UTBK yang cocok buat aku' },
  { label: 'Info PTN & Jurusan', icon: 'apartment', message: 'Bia, aku mau tanya info tentang Perguruan Tinggi Negeri dan jurusannya' },
  { label: 'Peluang Masuk PTN', icon: 'analytics', message: 'Bia, aku mau analisis peluang masuk PTN berdasarkan skor tryout aku' },
  { label: 'Tips & Trik UTBK', icon: 'lightbulb', message: 'Bia, aku butuh tips dan trik untuk mengerjakan soal UTBK' },
];

const KonsultasiKakZ = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(() => {
    const stored = getStoredMessages();
    return stored && stored.length > 0 ? stored : [DEFAULT_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 1 || messages[0]?.text !== DEFAULT_MESSAGE.text) {
      saveMessages(messages);
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    const userMessage = text.trim();
    setInput('');

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { role: 'user', text: userMessage, time: currentTime }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = messages.slice(1).map(msg => ({ role: msg.role, text: msg.text }));
      const response = await api.post('/chat/konsultasi', { message: userMessage, history });
      if (response.data.success) {
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages([...newMessages, { role: 'model', text: response.data.data.reply, time: replyTime }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([...newMessages, { role: 'model', text: 'Maaf ya, Bia lagi ada gangguan teknis nih. Coba lagi nanti ya! 🙏', time: errorTime }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClearChat = () => {
    setMessages([DEFAULT_MESSAGE]);
    sessionStorage.removeItem(CONSULT_STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#e0e2f0] shadow-sm">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-9" />
            </Link>
            <div className="hidden sm:block h-6 w-px bg-[#e0e2f0]"></div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="relative w-8 h-8">
                <img className="w-full h-full object-cover rounded-full border border-[#c2c6d8]" alt="Bia" src={KAK_Z_AVATAR} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22c55e] border-2 border-[#faf8ff] rounded-full"></span>
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#191b24] leading-tight">Bia</p>
                <p className="text-[10px] font-semibold text-[#22c55e] uppercase tracking-wider">Online</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#727687] hover:bg-[#ecedfa] transition-colors"
              title="Hapus riwayat chat"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              <span className="hidden sm:inline">Hapus Chat</span>
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#424656] hover:bg-[#ecedfa] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 pt-[76px] sm:pt-[84px] pb-[140px] sm:pb-[120px]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6">

          {/* System Badge */}
          <div className="flex justify-center py-6">
            <span className="bg-[#e8eeff] text-[#0050cb] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
              Konsultasi Belajar & PTN
            </span>
          </div>

          {/* Messages */}
          <div className="space-y-6">
            {messages.map((msg, idx) => {
              if (msg.role === 'user') {
                return (
                  <div key={idx} className="flex justify-end">
                    <div className="max-w-[80%] sm:max-w-[65%]">
                      <div className="bg-[#0050cb] text-white px-5 py-4 rounded-2xl rounded-tr-md shadow-sm">
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <p className="text-[11px] text-[#727687] mt-1.5 text-right font-medium">{msg.time}</p>
                    </div>
                  </div>
                );
              }
              return (
                <div key={idx} className="flex justify-start items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-[#e0e2f0] mt-1 hidden sm:block">
                    <img className="w-full h-full object-cover" alt="Bia" src={KAK_Z_AVATAR} />
                  </div>
                  <div className="max-w-[85%] sm:max-w-[70%]">
                    <div className="bg-white text-[#191b24] px-5 py-4 rounded-2xl rounded-tl-md border border-[#e0e2f0] shadow-sm">
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{stripMarkdown(msg.text)}</p>
                    </div>
                    <p className="text-[11px] text-[#727687] mt-1.5 font-medium">Bia · {msg.time}</p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-[#e0e2f0] hidden sm:block">
                  <img className="w-full h-full object-cover" alt="Bia" src={KAK_Z_AVATAR} />
                </div>
                <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-md border border-[#e0e2f0] shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-[#0050cb] rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-[#0050cb] rounded-full animate-bounce [animation-delay:0.15s]"></span>
                    <span className="w-2 h-2 bg-[#0050cb] rounded-full animate-bounce [animation-delay:0.3s]"></span>
                    <span className="ml-2 text-[13px] text-[#727687]">Bia sedang mengetik...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap gap-2 items-center justify-center w-full px-4">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(prompt.message)}
                disabled={isLoading}
                className="group w-full max-w-[260px] sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full border border-[#e0e2f0] hover:border-[#0050cb] hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px] sm:text-[18px] text-[#0050cb]">{prompt.icon}</span>
                <span className="text-[11px] sm:text-[13px] font-semibold text-[#424656]">{prompt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#faf8ff]/95 backdrop-blur-md border-t border-[#e0e2f0] z-40">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="flex-1 bg-white rounded-2xl border border-[#e0e2f0] focus-within:border-[#0050cb] focus-within:ring-2 focus-within:ring-[#0050cb]/10 transition-all shadow-sm">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-[#191b24] placeholder:text-[#727687] py-3.5 px-4 outline-none resize-none"
                placeholder="Tanya Bia tentang strategi belajar, PTN, jurusan..."
                disabled={isLoading}
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-[#0050cb] text-white rounded-xl flex items-center justify-center hover:bg-[#003da6] active:scale-95 transition-all disabled:opacity-40 disabled:bg-[#c2c6d8] shadow-sm shrink-0"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
          <p className="text-center mt-2 text-[10px] text-[#727687] font-semibold uppercase tracking-wider">Powered by Stubia AI · Riwayat tersimpan selama sesi</p>
        </div>
      </div>
    </div>
  );
};

export default KonsultasiKakZ;
