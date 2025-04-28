import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.access) {
    return {
      'Authorization': `Bearer ${user.access}`,
      'Content-Type': 'application/json',
    };
  }
  return {};
};

const todoService = {
  getAllTodos: async (searchQuery = '') => {
    try {
      const response = await axios.get(`${API_URL}/todos/`, {
        headers: getAuthHeader(),
        params: searchQuery ? { search: searchQuery } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching todos:', error.response || error);
      throw error;
    }
  },

  getTodoById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/todos/${id}/`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching todo details:', error.response || error);
      throw error;
    }
  },

  createTodo: async (title, description = '') => {
    try {
      const response = await axios.post(
        `${API_URL}/todos/`,
        { title, description },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating todo:', error.response || error);
      throw error;
    }
  },

  updateTodo: async (id, data) => {
    try {
      const response = await axios.patch(
        `${API_URL}/todos/${id}/`,
        data,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating todo:', error.response || error);
      throw error;
    }
  },

  toggleTodoComplete: async (id, completed) => {
    try {
      const response = await axios.patch(
        `${API_URL}/todos/${id}/`,
        { completed },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling todo:', error.response || error);
      throw error;
    }
  },

  deleteTodo: async (id) => {
    try {
      await axios.delete(`${API_URL}/todos/${id}/`, {
        headers: getAuthHeader(),
      });
    } catch (error) {
      console.error('Error deleting todo:', error.response || error);
      throw error;
    }
  },
};

export default todoService; 