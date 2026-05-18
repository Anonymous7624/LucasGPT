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
  const [statusFilter, setStatusFilter] = useState('open');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [navigate, statusFilter]);

  const loadConversations = async () => {
    try {
      const data = await api.getAdminConversations();
      
      let filtered = data.conversations;
      if (statusFilter !== 'all') {
        filtered = data.conversations.filter(c => c.status === statusFilter);
      }
      
      setConversations(filtered);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      if (error.message.includes('token') || error.message.includes('Admin') || error.message.includes('Unauthorized')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/login');
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

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;

    if (!confirm(`Are you sure you want to permanently delete this conversation? This will delete all messages and files and cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteConversation(selectedConversation._id);
      setSelectedConversation(null);
      setMessages([]);
      await loadConversations();
      alert('Conversation deleted successfully');
    } catch (error) {
      alert('Failed to delete conversation: ' + error.message);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('guestSessionId');
      sessionStorage.removeItem('conversationId');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/admin/login');
    }
  };

  const ImageFile = ({ file }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [loadingImg, setLoadingImg] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      let objectUrl = null;
      
      const loadImage = async () => {
        try {
          const blob = await api.fetchFileBlob(file._id, 'view');
          objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
          setLoadingImg(false);
        } catch (err) {
          console.error('Error loading image:', err);
          setError(true);
          setLoadingImg(false);
        }
      };

      loadImage();

      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      };
    }, [file._id]);

    if (loadingImg) {
      return <div className="text-xs opacity-70 mt-2">Loading...</div>;
    }

    if (error) {
      return <div className="text-xs opacity-70 mt-2 text-red-400">Failed to load</div>;
    }

    return (
      <div className="mt-2">
        <img
          src={imageUrl}
          alt={file.original_name}
          className="max-w-full max-h-64 rounded border border-gray-600 cursor-pointer"
          onClick={async () => {
            try {
              const blob = await api.fetchFileBlob(file._id, 'view');
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            } catch (err) {
              console.error('Error opening image:', err);
            }
          }}
        />
        <p className="text-xs opacity-70 mt-1">{file.original_name}</p>
      </div>
    );
  };

  const PDFFile = ({ file }) => {
    const handleView = async () => {
      try {
        const blob = await api.fetchFileBlob(file._id, 'view');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (err) {
        console.error('Error viewing PDF:', err);
        alert('Failed to open PDF');
      }
    };

    const handleDownload = async () => {
      try {
        const blob = await api.fetchFileBlob(file._id, 'download');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.original_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error downloading PDF:', err);
        alert('Failed to download PDF');
      }
    };

    return (
      <div className="mt-2 p-3 bg-gray-700 rounded border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-sm font-medium">{file.original_name}</p>
              <p className="text-xs opacity-70">{(file.size_bytes / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleView}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              Open
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFile = (file) => {
    const isImage = file.mime_type?.startsWith('image/');
    const isPDF = file.mime_type === 'application/pdf';

    if (isImage) {
      return <ImageFile key={file._id} file={file} />;
    }

    if (isPDF) {
      return <PDFFile key={file._id} file={file} />;
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

        <div className="px-4 py-3 border-b border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                statusFilter === 'open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setStatusFilter('answered')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                statusFilter === 'answered'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Answered
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                statusFilter === 'closed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              Closed
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              All
            </button>
          </div>
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
                  disabled={selectedConversation.status === 'answered'}
                >
                  Answered
                </button>
                <button
                  onClick={() => handleUpdateStatus('closed')}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm transition-colors text-white"
                  disabled={selectedConversation.status === 'closed'}
                >
                  Close
                </button>
                <button
                  onClick={handleDeleteConversation}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors text-white"
                >
                  Delete
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

