const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const token = localStorage.getItem('adminToken');
  if (token && !options.skipAuth) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  createConversation: async (displayName) => {
    return fetchAPI('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
      skipAuth: true,
    });
  },

  getMessages: async (conversationId) => {
    return fetchAPI(`/api/conversations/${conversationId}/messages`, {
      skipAuth: true,
    });
  },

  sendMessage: async (conversationId, content) => {
    return fetchAPI(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
      skipAuth: true,
    });
  },

  adminLogin: async (username, password) => {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    });
  },

  getConversations: async () => {
    return fetchAPI('/api/conversations/admin/conversations');
  },

  getConversation: async (conversationId) => {
    return fetchAPI(`/api/conversations/admin/conversations/${conversationId}`);
  },

  sendReply: async (conversationId, content) => {
    return fetchAPI(`/api/conversations/admin/conversations/${conversationId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  updateStatus: async (conversationId, status) => {
    return fetchAPI(`/api/conversations/admin/conversations/${conversationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export default api;
