import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const authService = {
  register: async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/register/`, {
        username,
        email,
        password,
        password2: password,
      });
      if (response.data.access) {
        const userData = {
          user: {
            username,
            email,
          },
          access: response.data.access,
          refresh: response.data.refresh,
        };
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  login: async (username, password) => {
    const response = await axios.post(`${API_URL}/token/`, {
      username,
      password,
    });
    if (response.data.access) {
      const userData = {
        user: {
          username,
        },
        access: response.data.access,
        refresh: response.data.refresh,
      };
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return response.data;
  },

  logout: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.access) {
      const config = {
        headers: { Authorization: `Bearer ${user.access}` }
      };
      axios.post(`${API_URL}/logout/`, {}, config)
        .then(() => {
          localStorage.removeItem('user');
        })
        .catch(error => {
          console.error('Logout error:', error);
          // Still remove user from localStorage even if the server request fails
          localStorage.removeItem('user');
        });
    } else {
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  },
};

export default authService; 