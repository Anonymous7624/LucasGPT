import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import api from '../api';

function ChatWindow({ conversationId, isGuest, user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!inputValue.trim() && selectedFiles.length === 0) return;

    const messageContent = inputValue.trim();
    const filesToSend = [...selectedFiles];
    
    setInputValue('');
    setSelectedFiles([]);
    setSending(true);

    try {
      await api.sendMessage(conversationId, messageContent || '(attached files)', filesToSend);
      await loadMessages();
    } catch (error) {
      alert('Failed to send message: ' + error.message);
      setInputValue(messageContent);
      setSelectedFiles(filesToSend);
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">LucasGPT</h1>
          <p className="text-xs text-gray-400">
            {isGuest ? 'Guest Session' : `Logged in as ${user?.username}`}
          </p>
        </div>
        {!isGuest && onLogout && (
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors text-white"
          >
            Logout
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-lg mb-2">Start your conversation with Lucas</p>
            <p className="text-sm">Type your question below</p>
            <p className="text-xs mt-2 text-gray-500">You can attach PDFs and images</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message._id} message={message} />
            ))}
            {hasUnansweredMessage() && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg px-4 py-3 text-gray-400 text-sm">
                  Lucas will get back to you in 24 hours or less...
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="bg-gray-700 rounded px-3 py-1 text-sm text-white flex items-center gap-2">
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif"
              multiple
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="Attach files"
            >
              📎
            </button>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Send a message..."
              rows="1"
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
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
              disabled={(!inputValue.trim() && selectedFiles.length === 0) || sending}
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

