// WebSocket manager singleton
let instance = null;

class WebSocketManager {
  constructor() {
    if (instance) {
      return instance;
    }
    
    this.ws = null;
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.listeners = new Set();
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.connectionAttemptDelay = 5000;
    this.lastConnectionTime = 0;
    this.connectionThrottleTime = 1000; // 1 second throttle
    
    instance = this;
  }
  
  connect(token) {
    // If already connecting, don't try again
    if (this.isConnecting) {
      console.log('WebSocket connection already in progress, skipping...');
      return;
    }
    
    // If already connected, don't try again
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping connection attempt');
      return;
    }
    
    // If we've tried too many times, don't try again
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.log('Too many connection attempts, giving up');
      return;
    }
    
    // Throttle connection attempts
    const now = Date.now();
    if (now - this.lastConnectionTime < this.connectionThrottleTime) {
      console.log('Connection attempt throttled, skipping...');
      return;
    }
    this.lastConnectionTime = now;
    
    this.isConnecting = true;
    this.connectionAttempts++;
    
    try {
      // Create WebSocket connection with authentication
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = process.env.REACT_APP_WS_HOST || 'localhost:8000';
      const wsUrl = `${wsProtocol}//${wsHost}/ws/tasks/?token=${token}`;
      console.log(`Attempting to connect to WebSocket (attempt ${this.connectionAttempts}):`, wsUrl);
      
      // Create a new WebSocket connection
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.connectionAttempts = 0; // Reset connection attempts on success
        this.notifyListeners({ type: 'connected' });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          this.notifyListeners({ type: 'message', data });
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.notifyListeners({ type: 'disconnected' });
        
        // Try to reconnect after a delay
        this.reconnectTimeout = setTimeout(() => this.connect(token), this.connectionAttemptDelay);
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.notifyListeners({ type: 'disconnected' });
        
        // Try to reconnect after a delay
        this.reconnectTimeout = setTimeout(() => this.connect(token), this.connectionAttemptDelay);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      this.isConnecting = false;
      this.notifyListeners({ type: 'disconnected' });
      
      // Try to reconnect after a delay
      this.reconnectTimeout = setTimeout(() => this.connect(token), this.connectionAttemptDelay);
    }
  }
  
  disconnect() {
    // Clear any pending reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Close the WebSocket connection
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  notifyListeners(event) {
    this.listeners.forEach(listener => listener(event));
  }
  
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create a single instance
const websocketManager = new WebSocketManager();

// Don't freeze the instance, as we need to modify its properties
export default websocketManager; 