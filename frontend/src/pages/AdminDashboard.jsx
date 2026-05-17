import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ConversationList from '../components/ConversationList';
import api from '../api';

function AdminDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/admin/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      navigate('/admin/login');
      return;
    }

    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const loadConversations = async () => {
    try {
      const data = await api.getAdminConversations();
      setConversations(data.conversations);
    } catch (error) {
      if (error.message.includes('token') || error.message.includes('Admin')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    try {
      const data = await api.getAdminConversation(conversationId);
      setSelectedConversation(data.conversation);
      setMessages(data.messages);
    } catch (error) {
      alert('Failed to load conversation: ' + error.message);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    if ((!replyContent.trim() && selectedFiles.length === 0) || !selectedConversation) return;

    setSending(true);
    try {
      await api.sendAdminReply(
        selectedConversation._id,
        replyContent.trim() || '(attached files)',
        selectedFiles
      );
      setReplyContent('');
      setSelectedFiles([]);
      await handleSelectConversation(selectedConversation._id);
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
      await api.updateConversationStatus(selectedConversation._id, status);
      await handleSelectConversation(selectedConversation._id);
      await loadConversations();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const renderFile = (file) => {
    const isImage = file.mime_type?.startsWith('image/');
    const isPDF = file.mime_type === 'application/pdf';

    if (isImage) {
      return (
        <div key={file._id} className="mt-2">
          <img
            src={api.getFileViewUrl(file._id)}
            alt={file.original_name}
            className="max-w-full max-h-64 rounded border border-gray-600 cursor-pointer"
            onClick={() => window.open(api.getFileViewUrl(file._id), '_blank')}
          />
          <p className="text-xs opacity-70 mt-1">{file.original_name}</p>
        </div>
      );
    }

    if (isPDF) {
      return (
        <div key={file._id} className="mt-2 p-3 bg-gray-700 rounded border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📄</span>
              <div>
                <p className="text-sm font-medium">{file.original_name}</p>
                <p className="text-xs opacity-70">{(file.size_bytes / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={api.getFileViewUrl(file._id)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                View
              </a>
              <a
                href={api.getFileDownloadUrl(file._id)}
                download
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold mb-1 text-white">LucasGPT Admin</h1>
          <p className="text-sm text-gray-400">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?._id}
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
            <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white">
                  {selectedConversation.owner_user_id?.username || 
                   selectedConversation.display_name || 
                   'Guest User'}
                </h2>
                <p className="text-sm text-gray-400">
                  Status: <span className="capitalize">{selectedConversation.status}</span>
                  {selectedConversation.is_guest && ' • Guest'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus('answered')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors text-white"
                >
                  Answered
                </button>
                <button
                  onClick={() => handleUpdateStatus('closed')}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const files = message.file_ids || [];
                return (
                  <div
                    key={message._id}
                    className={`flex ${message.sender === 'lucas' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        message.sender === 'lucas'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <div className="text-xs opacity-70 mb-1">
                        {message.sender === 'lucas' ? 'Lucas (You)' : 'User'}
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {files.length > 0 && (
                        <div className="space-y-2">
                          {files.map(file => renderFile(file))}
                        </div>
                      )}
                      <div className="text-xs opacity-50 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-700 p-4 bg-gray-800">
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
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  rows="3"
                  className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                
                <button
                  onClick={handleSendReply}
                  disabled={(!replyContent.trim() && selectedFiles.length === 0) || sending}
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

