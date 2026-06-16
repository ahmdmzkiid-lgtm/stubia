import React, { useState } from 'react';
import ChatModal from './ChatModal';

const ChatWidget = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {!isChatOpen && (
        <button 
          data-chat-fab
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 bg-[#0050cb] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 ring-4 ring-[#dae1ff]/30"
        >
          <span className="material-symbols-outlined">chat_bubble</span>
        </button>
      )}
      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default ChatWidget;
