import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import api from '../api';

function ChatPage() {
  const [conversationId, setConversationId] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const savedConversationId = localStorage.getItem('conversationId');
    if (savedConversationId) {
      setConversationId(savedConversationId);
      setIsStarted(true);
    }
  }, []);

  const handleStart = async () => {
    try {
      const { conversationId: newId } = await api.createConversation(displayName.trim() || null);
      setConversationId(newId);
      localStorage.setItem('conversationId', newId);
      setIsStarted(true);
    } catch (error) {
      alert('Failed to start conversation: ' + error.message);
    }
  };

  const handleNewChat = () => {
    localStorage.removeItem('conversationId');
    setConversationId(null);
    setIsStarted(false);
    setDisplayName('');
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-chat-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-chat-input rounded-lg p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">LucasGPT</h1>
            <p className="text-gray-400">Ask Lucas anything</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Your name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Anonymous"
                className="w-full bg-chat-bg text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>
            
            <button
              onClick={handleStart}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Start Chat
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              LucasGPT is answered manually by Lucas, not an AI.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatWindow 
      conversationId={conversationId} 
      onNewChat={handleNewChat}
    />
  );
}

export default ChatPage;
