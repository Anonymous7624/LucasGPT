import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import api from '../api';

function ChatWindow({ conversationId, isGuest, user, onLogout, onConversationClosed }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [closedBanner, setClosedBanner] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const closedHandledRef = useRef(false);

  useEffect(() => {
    if (conversationId) {
      closedHandledRef.current = false;
      setClosedBanner(null);
      loadMessages();
      pollingIntervalRef.current = setInterval(loadMessages, 3000);
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data.messages);
      setConversation(data.conversation);
      
      if (data.conversation.status === 'closed' && !closedHandledRef.current) {
        closedHandledRef.current = true;
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        setClosedBanner('This conversation has been closed. Please start a new conversation.');
        if (onConversationClosed) {
          setTimeout(() => onConversationClosed(), 2000);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      if ((error.message.includes('closed') || error.message.includes('Access denied') || error.message.includes('403') || error.message.includes('410')) && !closedHandledRef.current) {
        closedHandledRef.current = true;
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        setClosedBanner('This conversation has been closed. Please start a new conversation.');
        if (onConversationClosed) {
          setTimeout(() => onConversationClosed(), 2000);
        }
      }
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

    if (conversation?.status === 'closed') {
      alert('This conversation is closed. Please start a new conversation.');
      return;
    }

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
      if (error.message.includes('closed')) {
        if (onConversationClosed) {
          onConversationClosed();
        }
      } else {
        setInputValue(messageContent);
        setSelectedFiles(filesToSend);
      }
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

      {closedBanner && (
        <div className="bg-yellow-600 border-b border-yellow-700 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-white text-sm">{closedBanner}</p>
            <button
              onClick={() => setClosedBanner(null)}
              className="text-white hover:text-gray-200 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-300 text-sm mb-1">Ask Lucas anything.</p>
          <p className="text-gray-400 text-xs">Lucas will get back to you in 24 hours or less.</p>
          <p className="text-gray-500 text-xs mt-1">LucasGPT is answered manually by Lucas, not an AI.</p>
        </div>
      </div>

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
              disabled={conversation?.status === 'closed'}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              title="Attach files"
              disabled={conversation?.status === 'closed'}
            >
              📎
            </button>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={conversation?.status === 'closed' ? 'This conversation is closed' : 'Send a message...'}
              rows="1"
              className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={sending || conversation?.status === 'closed'}
            />
            
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && selectedFiles.length === 0) || sending || conversation?.status === 'closed'}
              className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          
          {hasUnansweredMessage() && conversation?.status !== 'closed' && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Lucas will get back to you soon...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;

