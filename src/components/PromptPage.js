import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import SavingsDashboard from './SavingsDashboard';

function PromptPage({ sidebarOpen, onToggleSidebar, savings, activeChat, chatMessages = [], onSendMessage, onAddChat }) {
  const [messages, setMessages] = useState(chatMessages);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // sync with messages coming from parent listener
  useEffect(() => {
    setMessages(chatMessages);
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    try {
      // parent returns a promise that resolves once the backend has been notified
      await onSendMessage(inputValue);
      setInputValue('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="prompt-page">
      {/* Header */}
      <div className="prompt-header">
        <div className="header-left">
          <button
            className="menu-toggle"
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
          >
            <Menu size={24} />
          </button>
          <h1 className="page-title">ToggleAI Proxy</h1>
        </div>
        <SavingsDashboard savings={savings} />
      </div>

      {/* Chat Container */}
      <div className="chat-container">
        {/* Messages */}
        <div className="messages-list">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="messages-content"
          >
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <h2>Start a new conversation</h2>
                <p>Ask me anything and I'll help you optimize your AI API costs</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`message ${message.sender}`}
                >
                  {message.sender === 'assistant' ? (
                    <div className="assistant-message-wrapper">
                      <div className="model-badge">{message.model}</div>
                      <div className="message-content assistant">
                        <p>{message.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="message-content user">
                      <p>{message.text}</p>
                    </div>
                  )}
                  <span className="message-time">
                    {message.timestamp 
  ? (message.timestamp.toDate ? message.timestamp.toDate() : new Date(message.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
  : 'Sending...'}
                  </span>
                </motion.div>
              ))
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="message assistant loading"
              >
                <div className="assistant-message-wrapper">
                  <div className="model-badge">Thinking...</div>
                  <div className="message-content assistant">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </motion.div>
        </div>

        {/* Input Area */}
        <div className="input-area">
          <form onSubmit={handleSendMessage} className="message-form">
            <div className="input-wrapper">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about optimizing your AI API costs..."
                className="message-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="send-button"
                disabled={isLoading || !inputValue.trim()}
                title="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
          <p className="input-hint">
            💡 Tip: The AI will automatically select the best model for your query to save costs!
          </p>
        </div>
      </div>
    </div>
  );
}

export default PromptPage;
