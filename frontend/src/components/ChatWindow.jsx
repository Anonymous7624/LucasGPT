import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import api from '../api';

function ChatWindow({ conversationId, onNewChat }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      await api.sendMessage(conversationId, messageContent);
      await loadMessages();
    } catch (error) {
      alert('Failed to send message: ' + error.message);
      setInputValue(messageContent);
    } finally {
      setSending(false);
    }
  };

  const hasUnansweredMessage = () => {
    if (messages.length === 0) return false;
    const lastMessage = messages[messages.length - 1];
    return lastMessage.sender === 'user';
  };

  return (
    <div className="min-h-screen bg-chat-bg flex flex-col">
      <header className="bg-chat-input border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">LucasGPT</h1>
          <p className="text-xs text-gray-400">Ask Lucas anything</p>
        </div>
        <button
          onClick={onNewChat}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
        >
          New Chat
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-lg mb-2">Start your conversation with Lucas</p>
            <p className="text-sm">Type your question below</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {hasUnansweredMessage() && (
              <div className="flex justify-start">
                <div className="bg-chat-input rounded-lg px-4 py-3 text-gray-400 text-sm">
                  Lucas has not answered yet...
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-chat-input border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Send a message..."
              rows="1"
              className="flex-1 bg-chat-bg text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            LucasGPT is answered manually by Lucas, not an AI.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
