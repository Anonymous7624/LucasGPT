import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConversationList from '../components/ConversationList';
import api from '../api';

function AdminDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations);
    } catch (error) {
      if (error.message.includes('token')) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    try {
      const data = await api.getConversation(conversationId);
      setSelectedConversation(data.conversation);
      setMessages(data.messages);
    } catch (error) {
      alert('Failed to load conversation: ' + error.message);
    }
  };

  const handleSendReply = async () => {
    if (!replyContent.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await api.sendReply(selectedConversation.id, replyContent.trim());
      setReplyContent('');
      await handleSelectConversation(selectedConversation.id);
      await loadConversations();
    } catch (error) {
      alert('Failed to send reply: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedConversation) return;

    try {
      await api.updateStatus(selectedConversation.id, status);
      await handleSelectConversation(selectedConversation.id);
      await loadConversations();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-chat-bg flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chat-bg flex">
      <div className="w-80 bg-sidebar-bg border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold mb-1">LucasGPT Admin</h1>
          <p className="text-sm text-gray-400">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id}
            onSelect={handleSelectConversation}
          />
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="bg-sidebar-bg border-b border-gray-700 p-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  {selectedConversation.display_name || 'Anonymous'}
                </h2>
                <p className="text-sm text-gray-400">
                  Status: <span className="capitalize">{selectedConversation.status}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus('answered')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                >
                  Answered
                </button>
                <button
                  onClick={() => handleUpdateStatus('closed')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'lucas' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 ${
                      message.sender === 'lucas'
                        ? 'bg-blue-600 text-white'
                        : 'bg-chat-input text-gray-100'
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">
                      {message.sender === 'lucas' ? 'Lucas' : 'User'}
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 p-4 bg-sidebar-bg">
              <div className="flex gap-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows="3"
                  className="flex-1 bg-chat-input text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyContent.trim() || sending}
                  className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to view and reply
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
