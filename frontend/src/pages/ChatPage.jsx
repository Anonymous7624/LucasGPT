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
  const heartbeatInterval = useRef(null);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (authToken && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsGuest(false);
      loadUserConversation();
    } else {
      setIsGuest(true);
      loadGuestSession();
    }

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isGuest && conversationId) {
      startHeartbeat();

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isGuest, conversationId]);

  const loadUserConversation = async () => {
    try {
      const { conversations } = await api.getUserConversations();
      if (conversations.length > 0) {
        setConversationId(conversations[0]._id);
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
      setConversationId(newConvId);
      setIsStarted(true);
    } catch (error) {
      alert('Failed to create conversation: ' + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsGuest(true);
    setIsStarted(false);
    setConversationId(null);
    navigate('/login');
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
                Start Conversation
              </button>

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

  return (
    <ChatWindow
      conversationId={conversationId}
      isGuest={isGuest}
      user={user}
      onLogout={handleLogout}
    />
  );
}

export default ChatPage;

