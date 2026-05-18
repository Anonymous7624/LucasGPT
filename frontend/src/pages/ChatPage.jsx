import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import api from '../api';

function ChatPage() {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [conversations, setConversations] = useState([]);
  const heartbeatInterval = useRef(null);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (authToken && userData) {
      const parsedUser = JSON.parse(userData);
      
      if (parsedUser.role === 'admin') {
        navigate('/admin/dashboard');
        return;
      }
      
      setUser(parsedUser);
      setIsGuest(false);
      loadUserConversations();
    } else {
      setIsGuest(true);
      loadGuestSession();
    }

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (isGuest && conversationId) {
      startHeartbeat();

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isGuest, conversationId]);

  const loadUserConversations = async () => {
    try {
      const { conversations: convs } = await api.getUserConversations();
      const openConversations = convs.filter(c => c.status === 'open' || c.status === 'answered');
      setConversations(openConversations);
      
      if (openConversations.length > 0) {
        setConversationId(openConversations[0]._id);
        setIsStarted(true);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadGuestSession = () => {
    const savedGuestSessionId = sessionStorage.getItem('guestSessionId');
    const savedConversationId = sessionStorage.getItem('conversationId');

    if (savedGuestSessionId && savedConversationId) {
      setConversationId(savedConversationId);
      setIsStarted(true);
    }
  };

  const startHeartbeat = () => {
    const guestSessionId = sessionStorage.getItem('guestSessionId');
    if (!guestSessionId) return;

    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    heartbeatInterval.current = setInterval(async () => {
      try {
        await api.sendHeartbeat(guestSessionId);
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000);
  };

  const handleBeforeUnload = (e) => {
    const guestSessionId = sessionStorage.getItem('guestSessionId');
    if (guestSessionId) {
      navigator.sendBeacon(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/guest/${guestSessionId}/end`,
        JSON.stringify({})
      );
    }
  };

  const handleStartGuest = async () => {
    try {
      const { guestSessionId, conversationId: newConvId } = await api.startGuestSession();
      sessionStorage.setItem('guestSessionId', guestSessionId);
      sessionStorage.setItem('conversationId', newConvId);
      setConversationId(newConvId);
      setIsStarted(true);
    } catch (error) {
      alert('Failed to start guest session: ' + error.message);
    }
  };

  const handleStartUser = async () => {
    try {
      const { conversationId: newConvId } = await api.createConversation();
      await loadUserConversations();
      setConversationId(newConvId);
      setIsStarted(true);
    } catch (error) {
      alert('Failed to create conversation: ' + error.message);
    }
  };

  const handleNewChat = async () => {
    if (isGuest) {
      sessionStorage.removeItem('guestSessionId');
      sessionStorage.removeItem('conversationId');
      setConversationId(null);
      setIsStarted(false);
    } else {
      await handleStartUser();
    }
  };

  const handleConversationClosed = async () => {
    if (isGuest) {
      sessionStorage.removeItem('guestSessionId');
      sessionStorage.removeItem('conversationId');
      setConversationId(null);
      setIsStarted(false);
    } else {
      setConversationId(null);
      setIsStarted(false);
      await loadUserConversations();
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('guestSessionId');
      sessionStorage.removeItem('conversationId');
      setUser(null);
      setIsGuest(true);
      setIsStarted(false);
      setConversationId(null);
      setConversations([]);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/login');
    }
  };

  const handleSelectConversation = (convId) => {
    setConversationId(convId);
    setIsStarted(true);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">LucasGPT</h1>
            <p className="text-xl text-gray-300 mb-2">Ask Lucas anything.</p>
            <p className="text-sm text-gray-400 mb-4">Lucas will get back to you in 24 hours or less.</p>
            <p className="text-xs text-gray-500">LucasGPT is answered manually by Lucas, not an AI.</p>
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <p className="text-gray-300 text-sm">Welcome back,</p>
                <p className="text-white font-medium text-lg">{user.username}</p>
              </div>

              <button
                onClick={handleStartUser}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Start New Conversation
              </button>

              {conversations.length > 0 && (
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-gray-300 text-sm mb-2">Or continue an existing chat:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {conversations.map(conv => (
                      <button
                        key={conv._id}
                        onClick={() => handleSelectConversation(conv._id)}
                        className="w-full text-left px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate flex-1">
                            {conv.last_message?.substring(0, 40) || 'New conversation'}...
                          </span>
                          <span className="text-xs text-gray-400 ml-2 capitalize">{conv.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleStartGuest}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Continue as Guest
              </button>

              <div className="text-center text-gray-400 text-sm">or</div>

              <Link
                to="/login"
                className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors text-center"
              >
                Sign In
              </Link>

              <Link
                to="/signup"
                className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors text-center"
              >
                Create Account
              </Link>

              <p className="text-xs text-gray-500 text-center mt-4">
                Guest conversations are temporary. Create an account to save your conversations.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isGuest && conversations.length > 1) {
    return (
      <div className="min-h-screen bg-gray-900 flex">
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold text-white mb-2">Your Chats</h2>
            <button
              onClick={handleNewChat}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm transition-colors"
            >
              + New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {conversations.map(conv => (
              <button
                key={conv._id}
                onClick={() => handleSelectConversation(conv._id)}
                className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors ${
                  conv._id === conversationId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs capitalize font-medium">{conv.status}</span>
                  <span className="text-xs opacity-70">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="truncate">
                  {conv.last_message?.substring(0, 50) || 'New conversation'}...
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="text-center mb-2">
              <p className="text-gray-400 text-xs">Logged in as</p>
              <p className="text-white text-sm font-medium">{user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex-1">
          <ChatWindow
            conversationId={conversationId}
            isGuest={isGuest}
            user={user}
            onLogout={handleLogout}
            onConversationClosed={handleConversationClosed}
          />
        </div>
      </div>
    );
  }

  return (
    <ChatWindow
      conversationId={conversationId}
      isGuest={isGuest}
      user={user}
      onLogout={handleLogout}
      onConversationClosed={handleConversationClosed}
    />
  );
}

export default ChatPage;

