import React, { useState, useRef, useEffect } from 'react';
import { chatService } from '../services/api';
import stripMarkdown from '../utils/stripMarkdown';

const DiscussQuestionModal = ({ isOpen, onClose, question }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      // Initial message from Kak Z
      const isCorrect = question.isCorrect;
      const initialText = `Hai! Aku Kak Z 👋 Aku udah baca soalnya nih. ${isCorrect ? 'Wah kamu udah jawab benar ya, keren! 🎉' : 'Tenang aja, yuk kita bahas bareng biar kamu paham!'} Ada yang mau kamu tanyakan tentang soal ini?`;
      
      setMessages([
        { 
          role: 'model', 
          text: initialText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      scrollToBottom();
    }
  }, [isOpen, question]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { role: 'user', text: userMessage, time: currentTime }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      // Prepare context for AI
      const questionContext = {
        content: question.content,
        choices: question.choices,
        userAnswer: question.userAnswer || question.chosenChoice?.label,
        isCorrect: question.isCorrect,
        explanation: question.explanation || (question.correctChoice && question.correctChoice.explanation)
      };

      const response = await chatService.discussQuestion(userMessage, questionContext, history);

      if (response.data.success) {
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages([...newMessages, { role: 'model', text: response.data.data.reply, time: replyTime }]);
      }
    } catch (error) {
      console.error('Discussion error:', error);
      const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([...newMessages, { role: 'model', text: 'Aduh, Kak Z lagi sedikit pusing nih. Boleh diulang pertanyaannya? 🙏', time: errorTime }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-[#faf8ff] w-full max-w-2xl h-[80vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-[#c2c6d8] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-[#c2c6d8]/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <img 
                className="w-full h-full object-cover rounded-full border-2 border-[#0050cb]/10" 
                alt="Kak Z Avatar" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAsqbf_KDYhD6F9rgrq4_CKAREtY02eG-4OoAn62g1bnUU4sjfufTpgm0JHNPQw4Bh2v0IPCpJMB-Ga1EdovaWU_-d49yffNN259JGRoG3Gli1eeK4nXykeW8VklOAzOv_JbLk3QqdC5L35gXNySI7rHNrxz_nEE96kCJSVQHSIbL17gtFvhAphaZlD2xTiulhEfcYCQsXl_e1OI6XFzInZd24Q0aByIblmS8S0buT_5uQqK2JcEnECQz1HuKrvu77l0CIyScdgvg"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00c1fd] border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#191b24]">Diskusi dengan Kak Z</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#00c1fd] rounded-full"></div>
                <span className="text-[#006688] text-[12px] font-semibold">Tutor AI Standby</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center text-[#424656] hover:bg-[#ecedfa] rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Question Mini Summary */}
        <div className="bg-[#f2f3ff]/50 px-6 py-3 border-b border-[#c2c6d8]/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#727687]">Sedang Membahas</span>
            <span className="px-2 py-0.5 bg-[#0050cb] text-white text-[9px] font-bold rounded">Soal #{question.questionNumber || question.idx + 1}</span>
          </div>
          <p className="text-[12px] text-[#424656] line-clamp-1 italic">"{question.content}"</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-[#faf8ff]">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'model' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden mt-1 border border-[#c2c6d8]/50 shadow-sm">
                    <img 
                      className="w-full h-full object-cover" 
                      alt="Kak Z" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAvncBoZ7j6blA-hboSsjTE6AYftyv6iH5XCTU45aETLvPXZ69oinWplEyosaciDa3FG9tKwcDHtQMk7beM_BvdWaOL2gm27txU_oSIYoHyrcjNLicbjHwlxKWiExthTSHoOaAt0u649-jOZ60o1oJq1LKIAocmQ6yyecAdmhyg8MPztgoG_-Ofij7W_0z8vWq5jQj3xcRirB-0VcBaHmEEYw5r4iE1jEdAIqTHSbRCC8YB30wjzIr9ET-bAeJ2yCE0Ad1RZhP2ew"
                    />
                  </div>
                )}
                <div className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#0050cb] text-white rounded-tr-none' 
                    : 'bg-white text-[#191b24] border border-[#c2c6d8]/30 rounded-tl-none'
                }`}>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.role === 'model' ? stripMarkdown(msg.text) : msg.text}</p>
                  <span className={`text-[10px] mt-2 block font-medium ${msg.role === 'user' ? 'text-white/70 text-right' : 'text-[#727687]'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ecedfa]"></div>
                <div className="bg-white border border-[#c2c6d8]/30 p-4 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#0050cb]/40 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#0050cb]/40 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-[#0050cb]/40 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-[#c2c6d8]/50">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-[#f2f3ff] border-2 border-transparent focus:border-[#0050cb]/20 focus:bg-white rounded-2xl py-4 pl-6 pr-16 text-[14px] outline-none transition-all shadow-inner" 
              placeholder="Tanya apa saja tentang soal ini..." 
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bg-[#0050cb] text-white w-12 h-12 rounded-xl flex items-center justify-center hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
          <p className="text-center mt-4 text-[10px] text-[#727687] font-bold tracking-widest uppercase opacity-50">Powered by Gemini AI Technology</p>
        </div>
      </div>
    </div>
  );
};

export default DiscussQuestionModal;
