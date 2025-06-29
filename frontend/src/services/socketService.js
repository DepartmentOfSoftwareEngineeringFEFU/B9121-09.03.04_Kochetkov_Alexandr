import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.messageHandlers = new Set();
    this.historyHandlers = new Set();
    this.roomUsersHandlers = new Set();
  }

  connect(token) {
    if (this.connected && this.socket) {
      return;
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.onAny((eventName, ...args) => {
    });

    this.messageHandlers.forEach(handler => {
      this.socket.on('chatMessage', handler);
    });
    this.historyHandlers.forEach(handler => {
      this.socket.on('chatHistory', handler);
    });
    this.roomUsersHandlers.forEach(handler => {
      this.socket.on('roomUsers', handler);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.messageHandlers.clear();
      this.historyHandlers.clear();
      this.roomUsersHandlers.clear();
    }
  }

  joinRoom(roomId, user) {
    if (this.socket && this.connected) {
      this.socket.emit('joinRoom', { roomId, user });
    }
  }

  leaveRoom(roomId) {
    if (this.socket && this.connected) {
      this.socket.emit('leaveRoom', roomId);
    }
  }

  sendMessage(roomId, message) {
    if (this.socket && this.connected) {
      this.socket.emit('chatMessage', { roomId, ...message });
    }
  }

  onMessage(callback) {
    if (this.socket) {
      this.messageHandlers.add(callback);
      this.socket.on('chatMessage', callback);
      return () => {
        this.messageHandlers.delete(callback);
        this.socket.off('chatMessage', callback);
      };
    }
    return () => {};
  }

  onHistory(callback) {
    if (this.socket) {
      this.historyHandlers.add(callback);
      this.socket.on('chatHistory', callback);
      return () => {
        this.historyHandlers.delete(callback);
        this.socket.off('chatHistory', callback);
      };
    }
    return () => {};
  }

  onRoomUsers(callback) {
    if (this.socket) {
      this.roomUsersHandlers.add(callback);
      this.socket.on('roomUsers', callback);
      return () => {
        this.roomUsersHandlers.delete(callback);
        this.socket.off('roomUsers', callback);
      };
    }
    return () => {};
  }
}

const socketService = new SocketService();
export default socketService; 