const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      ...options.headers,
    },
    ...options,
  };

  if (!options.isFormData) {
    config.headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('authToken');
  if (token && !options.skipAuth) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const guestSessionId = sessionStorage.getItem('guestSessionId');
  if (guestSessionId && !token) {
    config.headers['X-Guest-Session-Id'] = guestSessionId;
  }

  const response = await fetch(url, config);
  
  if (options.isStream) {
    return response;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  signup: async (username, email, password) => {
    return fetchAPI('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
      skipAuth: true,
    });
  },

  login: async (usernameOrEmail, password) => {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
      skipAuth: true,
    });
  },

  getMe: async () => {
    return fetchAPI('/api/auth/me');
  },

  startGuestSession: async () => {
    return fetchAPI('/api/guest/start', {
      method: 'POST',
      body: JSON.stringify({}),
      skipAuth: true,
    });
  },

  sendHeartbeat: async (guestSessionId) => {
    return fetchAPI(`/api/guest/${guestSessionId}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({}),
      skipAuth: true,
    });
  },

  endGuestSession: async (guestSessionId) => {
    return fetchAPI(`/api/guest/${guestSessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({}),
      skipAuth: true,
    });
  },

  createConversation: async () => {
    return fetchAPI('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  getUserConversations: async () => {
    return fetchAPI('/api/conversations');
  },

  getMessages: async (conversationId) => {
    return fetchAPI(`/api/conversations/${conversationId}/messages`);
  },

  sendMessage: async (conversationId, content, files = []) => {
    const formData = new FormData();
    formData.append('content', content);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    return fetchAPI(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  getFileViewUrl: (fileId) => {
    const token = localStorage.getItem('authToken');
    const guestSessionId = sessionStorage.getItem('guestSessionId');
    
    let url = `${API_BASE_URL}/api/files/${fileId}/view`;
    
    if (token) {
      url += `?auth=${encodeURIComponent(token)}`;
    } else if (guestSessionId) {
      url += `?guest=${encodeURIComponent(guestSessionId)}`;
    }
    
    return url;
  },

  getFileDownloadUrl: (fileId) => {
    const token = localStorage.getItem('authToken');
    const guestSessionId = sessionStorage.getItem('guestSessionId');
    
    let url = `${API_BASE_URL}/api/files/${fileId}/download`;
    
    if (token) {
      url += `?auth=${encodeURIComponent(token)}`;
    } else if (guestSessionId) {
      url += `?guest=${encodeURIComponent(guestSessionId)}`;
    }
    
    return url;
  },

  getAdminConversations: async () => {
    return fetchAPI('/api/admin/conversations');
  },

  getAdminConversation: async (conversationId) => {
    return fetchAPI(`/api/admin/conversations/${conversationId}`);
  },

  sendAdminReply: async (conversationId, content, files = []) => {
    const formData = new FormData();
    formData.append('content', content);
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    return fetchAPI(`/api/admin/conversations/${conversationId}/reply`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  updateConversationStatus: async (conversationId, status) => {
    return fetchAPI(`/api/admin/conversations/${conversationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export default api;

