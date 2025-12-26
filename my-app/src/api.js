const API_BASE_URL = 'https://app.smartfleetllc.com/api';

export const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const setAuthToken = (token, remember = false) => {
  if (remember) {
    localStorage.setItem('token', token);
  } else {
    sessionStorage.setItem('token', token);
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeAuthToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorData;
    try {
      const text = await response.text();
      if (text) {
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: text || 'Request failed' };
        }
      } else {
        errorData = { message: `Request failed with status ${response.status}` };
      }
    } catch (e) {
      errorData = { message: 'Request failed', status: response.status };
    }
    
    const error = new Error(errorData.detail || errorData.error || errorData.message || `Request failed with status ${response.status}`);
    error.response = errorData;
    error.status = response.status;
    throw error;
  }

  if (options.method === 'DELETE' || response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  return response.json().catch(() => null);
};

export const login = async (username, password) => {
  const data = await apiRequest('/token/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  const token = data.access || data.token || data.access_token;
  if (token) {
    setAuthToken(token);
  }

  return { token, user: data.user || { username } };
};
