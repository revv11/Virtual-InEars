import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

interface RoomState {
  roomCode: string;
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

// Mock implementation for demonstration - in real app this would use Socket.IO
export const useRoom = () => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [metronomeState, setMetronomeState] = useState<MetronomeState>({
    isPlaying: false,
    bpm: 120,
    timeSignature: '4/4',
    startTime: 0,
  });

  // Generate a random room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create a new room
  const createRoom = useCallback((userName: string) => {
    const roomCode = generateRoomCode();
    const userId = `user_${Date.now()}`;
    
    const newUser: User = {
      id: userId,
      name: userName,
      isHost: true,
      joinedAt: Date.now(),
    };

    setRoomState({
      roomCode,
      users: [newUser],
      isHost: true,
      currentUser: userName,
      isConnected: true,
    });

    // Store in localStorage for persistence during development
    localStorage.setItem('currentRoom', JSON.stringify({
      roomCode,
      userName,
      userId,
    }));

    return roomCode;
  }, []);

  // Join an existing room
  const joinRoom = useCallback((roomCode: string, userName: string) => {
    // In a real implementation, this would make a request to the server
    // For now, we'll simulate joining a room
    const userId = `user_${Date.now()}`;
    
    const newUser: User = {
      id: userId,
      name: userName,
      isHost: false,
      joinedAt: Date.now(),
    };

    // Simulate some existing users in the room
    const existingUsers: User[] = [
      {
        id: 'host_user',
        name: 'Room Host',
        isHost: true,
        joinedAt: Date.now() - 60000, // Joined 1 minute ago
      },
    ];

    setRoomState({
      roomCode,
      users: [...existingUsers, newUser],
      isHost: false,
      currentUser: userName,
      isConnected: true,
    });

    localStorage.setItem('currentRoom', JSON.stringify({
      roomCode,
      userName,
      userId,
    }));

    return true;
  }, []);

  // Leave the room
  const leaveRoom = useCallback(() => {
    setRoomState(null);
    setMetronomeState({
      isPlaying: false,
      bpm: 120,
      timeSignature: '4/4',
      startTime: 0,
    });
    
    localStorage.removeItem('currentRoom');
  }, []);

  // Update metronome settings (host only)
  const updateMetronome = useCallback((updates: Partial<MetronomeState>) => {
    if (!roomState?.isHost) return;

    setMetronomeState(prev => ({
      ...prev,
      ...updates,
    }));

    // In real implementation, broadcast to all users via Socket.IO
    console.log('Broadcasting metronome update:', updates);
  }, [roomState?.isHost]);

  // Start metronome (host only)
  const startMetronome = useCallback(() => {
    if (!roomState?.isHost) return;

    const startTime = Date.now();
    updateMetronome({
      isPlaying: true,
      startTime,
    });
  }, [roomState?.isHost, updateMetronome]);

  // Stop metronome (host only)
  const stopMetronome = useCallback(() => {
    if (!roomState?.isHost) return;

    updateMetronome({
      isPlaying: false,
      startTime: 0,
    });
  }, [roomState?.isHost, updateMetronome]);

  // Change BPM (host only)
  const changeBPM = useCallback((bpm: number) => {
    if (!roomState?.isHost) return;

    updateMetronome({ bpm });
  }, [roomState?.isHost, updateMetronome]);

  // Change time signature (host only)
  const changeTimeSignature = useCallback((timeSignature: string) => {
    if (!roomState?.isHost) return;

    updateMetronome({ timeSignature });
  }, [roomState?.isHost, updateMetronome]);

  // Try to restore room from localStorage on mount
  useEffect(() => {
    const savedRoom = localStorage.getItem('currentRoom');
    if (savedRoom) {
      try {
        const { roomCode, userName, userId } = JSON.parse(savedRoom);
        
        // Simulate reconnecting to the room
        const user: User = {
          id: userId,
          name: userName,
          isHost: true, // Assume we're the host for simplicity
          joinedAt: Date.now(),
        };

        setRoomState({
          roomCode,
          users: [user],
          isHost: true,
          currentUser: userName,
          isConnected: true,
        });
      } catch (error) {
        console.error('Failed to restore room from localStorage:', error);
        localStorage.removeItem('currentRoom');
      }
    }
  }, []);

  return {
    roomState,
    metronomeState,
    createRoom,
    joinRoom,
    leaveRoom,
    startMetronome,
    stopMetronome,
    changeBPM,
    changeTimeSignature,
  };
};

export default useRoom;