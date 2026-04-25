import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AiAdvisor.css';

const AiAdvisor = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    { sender: 'advisor', textKey: 'advisor.welcome' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = inputVal.trim();
    // Optimistically add user message
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputVal('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://civitas-api-d6ox.onrender.com/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userMessage: userMsg })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessages(prev => [...prev, { sender: 'advisor', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'advisor', text: data.message || t('advisor.error'), errorKey: !data.message ? 'advisor.error' : null }]);
      }
    } catch (error) {
      console.error("AI chat error:", error);
      setMessages(prev => [...prev, { sender: 'advisor', textKey: 'advisor.error' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="advisor-container">
      <div className="advisor-header">
        <Bot size={32} className="advisor-icon" />
        <div>
          <h2 className="advisor-title">{t('advisor.title')}</h2>
          <p className="advisor-subtitle">{t('advisor.subtitle')}</p>
        </div>
      </div>
      
      <div className="chat-area" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-wrapper ${msg.sender === 'user' ? 'user' : 'advisor'}`}>
            <div className="message-bubble gradient-glass">
              <span className="message-icon">
                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </span>
              <p>{msg.textKey ? t(msg.textKey) : (msg.errorKey ? t(msg.errorKey) : msg.text)}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper advisor">
            <div className="message-bubble gradient-glass loader-bubble">
               <Loader2 size={18} className="spin-icon" />
               <span>{t('advisor.analyzing')}</span>
            </div>
          </div>
        )}
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          placeholder={t('advisor.placeholder')} 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="send-btn" disabled={isLoading || !inputVal.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default AiAdvisor;
