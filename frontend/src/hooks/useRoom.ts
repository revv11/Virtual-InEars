// src/hooks/useRoom.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '@/services/socketService'; // Adjust path as needed

// --- Interfaces ---
interface User {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

interface RoomState {
  roomCode: string;
  roomId: string;
  users: User[];
  isHost: boolean;
  currentUser: string;
  isConnected: boolean;
}

interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  timeSignature: string;
  startTime: number;
}

// --- Hook Definition ---
export const useRoom = () => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [metronomeState, setMetronomeState] = useState<MetronomeState>({
    isPlaying: false,
    bpm: 120,
    timeSignature: '4/4',
    startTime: 0,
  });
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<any>(null);
  const clockOffsetRef = useRef<number>(0); // Ref to store the client-server clock offset

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        setConnectionStatus('connecting');
        const socket = await socketService.connect();
        socketRef.current = socket;
        setConnectionStatus('connected');
        setError(null);
        setupSocketListeners(socket);
      } catch (err) {
        console.error('Failed to connect to server:', err);
        setConnectionStatus('disconnected');
        setError('Failed to connect to server. Please check if the backend is running.');
      }
    };

    initializeSocket();

    // Periodically sync time with the server to maintain an accurate offset
    const syncInterval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('sync-check', { clientTime: Date.now() });
      }
    }, 2000); // Sync every 2 seconds

    return () => {
      clearInterval(syncInterval);
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
      }
    };
  }, []);

  const setupSocketListeners = (socket: any) => {
    // --- Room Events ---
    socket.on('room-created', (data: any) => {
      setRoomState({
        roomCode: data.roomCode,
        roomId: data.roomId,
        users: data.users,
        isHost: data.isHost,
        currentUser: data.users.find((u: User) => u.isHost)?.name || '',
        isConnected: true,
      });
      setError(null);
    });

    socket.on('room-joined', (data: any) => {
      setRoomState({
        roomCode: data.roomCode,
        roomId: data.roomId,
        users: data.users,
        isHost: data.isHost,
        currentUser: data.users.find((u: User) => u.id === socket.id)?.name || '',
        isConnected: true,
      });
      setMetronomeState(data.metronomeState);
      setError(null);
    });

    socket.on('room-left', () => {
      setRoomState(null);
      setMetronomeState({ isPlaying: false, bpm: 120, timeSignature: '4/4', startTime: 0 });
    });

    socket.on('user-joined', (data: any) => {
      setRoomState(prev => prev ? { ...prev, users: [...prev.users, data.user] } : null);
    });

    socket.on('user-left', (data: any) => {
      setRoomState(prev => prev ? { ...prev, users: prev.users.filter(user => user.id !== data.userId) } : null);
    });

    // --- Metronome Events ---
    socket.on('metronome-started', (data: any) => {
      setMetronomeState(prev => ({ ...prev, isPlaying: true, startTime: data.startTime, bpm: data.bpm, timeSignature: data.timeSignature }));
    });

    socket.on('metronome-stopped', () => {
      setMetronomeState(prev => ({ ...prev, isPlaying: false, startTime: 0 }));
    });

    socket.on('metronome-updated', (data: any) => {
      setMetronomeState(prev => ({ ...prev, bpm: data.bpm, timeSignature: data.timeSignature, isPlaying: data.isPlaying }));
    });

    // --- Sync Event ---
    socket.on('sync-response', (data: { clientTime: number; serverTime: number }) => {
      const roundTripTime = Date.now() - data.clientTime;
      const estimatedServerTime = data.serverTime + roundTripTime / 2;
      const offset = estimatedServerTime - Date.now();
      clockOffsetRef.current = offset;
    });

    // --- Error and Connection Events ---
    socket.on('room-error', (data: any) => setError(data.message));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));
    socket.on('connect', () => setConnectionStatus('connected'));
  };

  // --- Actions ---
  const createRoom = useCallback((userName: string) => socketRef.current?.emit('create-room', { userName }), []);
  const joinRoom = useCallback((roomCode: string, userName: string) => socketRef.current?.emit('join-room', { roomCode, userName }), []);
  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave-room');
    setRoomState(null);
    setMetronomeState({ isPlaying: false, bpm: 120, timeSignature: '4/4', startTime: 0 });
  }, []);
  const startMetronome = useCallback(() => socketRef.current?.emit('start-metronome'), []);
  const stopMetronome = useCallback(() => socketRef.current?.emit('stop-metronome'), []);
  const changeBPM = useCallback((bpm: number) => socketRef.current?.emit('change-bpm', { bpm }), []);
  const changeTimeSignature = useCallback((timeSignature: string) => socketRef.current?.emit('change-time-signature', { timeSignature }), []);

  return {
    roomState,
    metronomeState,
    connectionStatus,
    error,
    clockOffset: clockOffsetRef, // Export the ref to be used by other components
    createRoom,
    joinRoom,
    leaveRoom,
    startMetronome,
    stopMetronome,
    changeBPM,
    changeTimeSignature,
  };
};