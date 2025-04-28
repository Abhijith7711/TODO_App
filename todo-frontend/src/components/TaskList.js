import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Typography,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import todoService from '../services/todoService';
import websocketManager from '../services/websocketService';

const TaskList = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const wsListenerRef = useRef(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;
    
    fetchTasks();
    
    // Get the authentication token
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.access) {
      // Set up WebSocket connection using the singleton manager
      websocketManager.connect(user.access);
      
      // Add listener for WebSocket events
      wsListenerRef.current = websocketManager.addListener((event) => {
        // Only update state if component is still mounted
        if (!isMountedRef.current) return;
        
        if (event.type === 'connected') {
          setWsConnected(true);
        } else if (event.type === 'disconnected') {
          setWsConnected(false);
        } else if (event.type === 'message') {
          handleWebSocketMessage(event);
        }
      });
    }
    
    // Cleanup function
    return () => {
      // Set unmounted flag
      isMountedRef.current = false;
      
      // Remove the listener
      if (wsListenerRef.current) {
        wsListenerRef.current();
      }
      // We don't disconnect the WebSocket here, as it's managed by the singleton
    };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [searchQuery]);

  const handleWebSocketMessage = (event) => {
    const data = event.data;
    console.log('WebSocket message received:', data);

    switch (data.type) {
      case 'task_created':
        setTasks(prevTasks => {
          if (prevTasks.some(task => task.id === data.task.id)) return prevTasks;
          toast.success(`New task created: ${data.task.title}`);
          return [data.task, ...prevTasks];
        });
        break;

      case 'task_updated':
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === data.task.id ? data.task : task
          )
        );
        toast.info(`Task updated: ${data.task.title}`);
        break;

      case 'task_deleted':
        setTasks(prevTasks =>
          prevTasks.filter(task => task.id !== data.task_id)
        );
        toast.error(`Task deleted`);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await todoService.getAllTodos(searchQuery);
      setTasks(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      console.log('Creating task with:', { title: newTask, description: newTaskDescription });
      const createdTask = await todoService.createTodo(newTask, newTaskDescription);
      console.log('Task created successfully:', createdTask);
      setTasks([createdTask, ...tasks]);
      setNewTask('');
      setNewTaskDescription('');
      setError('');
    } catch (err) {
      console.error('Error creating task:', err.response || err);
      setError(err.response?.data?.detail || 'Failed to create task. Please try again.');
    }
  };

  const handleToggleComplete = async (id, completed) => {
    try {
      const updatedTask = await todoService.toggleTodoComplete(id, !completed);
      setTasks(tasks.map(task => 
        task.id === id ? updatedTask : task
      ));
      setError('');
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await todoService.deleteTodo(id);
      setTasks(tasks.filter(task => task.id !== id));
      setError('');
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
  };

  const handleEditSave = async () => {
    if (!editingTask) return;

    try {
      const updatedTask = await todoService.updateTodo(editingTask.id, {
        title: editTitle,
        description: editDescription,
      });
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? updatedTask : task
      ));
      setEditingTask(null);
      setError('');
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  const handleViewDetails = (taskId) => {
    navigate(`/tasks/${taskId}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredTasks = tasks.filter(task => 
    selectedTab === 0 ? !task.completed : task.completed
  );

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Task Management
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {!wsConnected && (
          <Typography color="warning.main" sx={{ mb: 2 }}>
            Real-time updates are not connected. Changes may not appear immediately.
          </Typography>
        )}

        <form onSubmit={handleCreateTask} style={{ marginBottom: '20px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task"
              variant="outlined"
            />
            <TextField
              fullWidth
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Add a description (optional)"
              variant="outlined"
              multiline
              rows={2}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!newTask.trim()}
            >
              Add Task
            </Button>
          </Box>
        </form>

        <TextField
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search tasks by title or description..."
          variant="outlined"
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Pending" />
          <Tab label="Completed" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {filteredTasks.map((task) => (
              <ListItem
                key={task.id}
                sx={{
                  bgcolor: 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Checkbox
                  checked={task.completed}
                  onChange={() => handleToggleComplete(task.id, task.completed)}
                />
                <ListItemText
                  primary={task.title}
                  secondary={task.description}
                  sx={{
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'text.secondary' : 'text.primary',
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleViewDetails(task.id)}
                    sx={{ mr: 1 }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  {!task.completed && (
                    <IconButton
                      edge="end"
                      onClick={() => handleEditClick(task)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {filteredTasks.length === 0 && (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                No {selectedTab === 0 ? 'pending' : 'completed'} tasks
              </Typography>
            )}
          </List>
        )}
      </Paper>

      <Dialog open={!!editingTask} onClose={() => setEditingTask(null)}>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTask(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskList; 