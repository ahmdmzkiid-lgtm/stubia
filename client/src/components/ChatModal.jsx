
import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import stripMarkdown from '../utils/stripMarkdown';

const CHAT_STORAGE_KEY = 'stubia_chat_history';
const CHAT_TTL_DAYS = 3;

const getStoredMessages = () => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return null;
    const { messages, timestamp } = JSON.parse(stored);
    const now = Date.now();
    const expiry = CHAT_TTL_DAYS * 24 * 60 * 60 * 1000;
    if (now - timestamp > expiry) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return null;
    }
    return messages;
  } catch {
    return null;
  }
};

const saveMessages = (messages) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
      messages,
      timestamp: Date.now()
    }));
  } catch {}
};

const DEFAULT_MESSAGE = { 
  role: 'model', 
  text: 'Halo! 👋 Aku Stu, asisten belajarmu. Ada yang bisa Stu bantu hari ini?',
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const ChatModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState(() => {
    const stored = getStoredMessages();
    return stored && stored.length > 0 ? stored : [DEFAULT_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (messages.length > 1 || messages[0]?.text !== DEFAULT_MESSAGE.text) {
      saveMessages(messages);
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { role: 'user', text: userMessage, time: currentTime }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = messages.slice(1).map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await api.post('/chat', {
        message: userMessage,
        history
      });

      if (response.data.success) {
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages([...newMessages, { role: 'model', text: response.data.data.reply, time: replyTime }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([...newMessages, { role: 'model', text: 'Maaf ya, Stu lagi ada gangguan teknis nih. Coba lagi nanti ya! 🙏', time: errorTime }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-[95vw] sm:w-[380px] bg-[#faf8ff] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-[#c2c6d8] z-[999] animate-fade-in" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div className="flex-none bg-[#faf8ff] px-5 py-4 flex items-center justify-between border-b border-[#c2c6d8]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <img 
              className="w-full h-full object-cover rounded-full border border-[#c2c6d8]" 
              alt="Stu Avatar" 
              src="/customerservice.webp"
            />
            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#22c55e] border-2 border-[#faf8ff] rounded-full"></span>
          </div>
          <div>
            <h2 className="text-[16px] font-bold leading-tight text-[#191b24]">Stu - Stubia Tutor</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[#006688] text-[10px] font-bold uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#424656] hover:bg-[#f2f3ff] rounded-full transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#faf8ff]">
        {/* System Message */}
        <div className="flex justify-center pb-2">
          <span className="bg-[#f2f3ff] text-[#0050cb] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
            Diskusi aktif dengan Stu
          </span>
        </div>

        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={idx} className="flex justify-end">
                <div className="max-w-[85%] bg-[#0050cb] text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-sm">
                  <p className="text-[14px] leading-[22px] whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-[10px] opacity-70 mt-1.5 text-right font-medium">{msg.time}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={idx} className="flex justify-start items-start gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-[#c2c6d8]/30 mt-0.5">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Stu Avatar" 
                  src="/customerservice.webp"
                />
              </div>
              <div className="max-w-[80%] bg-white text-[#191b24] px-4 py-3 rounded-2xl rounded-tl-none border border-[#c2c6d8]/30 shadow-sm">
                <p className="text-[14px] leading-[22px] whitespace-pre-wrap">{stripMarkdown(msg.text)}</p>
                <p className="text-[10px] text-[#727687] mt-1.5 font-medium">{msg.time}</p>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse"></div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-[#c2c6d8]/30 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#0050cb] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#0050cb] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-[#0050cb] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="flex-none p-4 bg-white border-t border-[#c2c6d8]">
        <form onSubmit={handleSend} className="flex items-center gap-2 bg-[#f2f3ff] rounded-xl px-3 py-2 border border-transparent focus-within:border-[#0050cb]/30 transition-all">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] text-[#191b24] placeholder:text-[#727687] py-1 outline-none" 
            placeholder="Tanya soal UTBK ke Stu..." 
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-[#0050cb] text-white rounded-lg flex items-center justify-center hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </form>
        <p className="text-center mt-3 text-[10px] text-[#727687] font-bold uppercase tracking-widest">Powered by Stubia AI Assistant</p>
      </div>
    </div>
  );
};

export default ChatModal;
