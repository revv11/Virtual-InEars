import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_SERVER_URL || 'http://10.81.110.80:3001';
  }

  // Connect to the server
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket?.id);
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });
    });
  }

  // Disconnect from the server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get the socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Emit an event
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Listen to an event
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Join a room
  joinRoom(roomCode: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-room', { roomCode });
    }
  }

  // Leave current room
  leaveRoom(): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-room');
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
