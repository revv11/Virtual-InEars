const { v4: uuidv4 } = require('uuid');
const { ROOM_CONFIG, METRONOME_CONFIG, ERROR_MESSAGES } = require('../config/constants');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.userToRoom = new Map(); // Track which room a user is in
    this.startCleanupInterval();
  }

  // Generate a unique room code
  generateRoomCode() {
    let roomCode;
    do {
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.rooms.has(roomCode));
    return roomCode;
  }

  // Create a new room
  createRoom(hostId, hostName) {
    const roomCode = this.generateRoomCode();
    const roomId = uuidv4();
    
    const room = {
      roomId,
      roomCode,
      hostId,
      users: [{
        id: hostId,
        name: hostName,
        isHost: true,
        joinedAt: Date.now()
      }],
      metronomeState: {
        isPlaying: false,
        bpm: METRONOME_CONFIG.DEFAULT_BPM,
        timeSignature: METRONOME_CONFIG.DEFAULT_TIME_SIGNATURE,
        startTime: 0
      },
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    this.rooms.set(roomCode, room);
    this.userToRoom.set(hostId, roomCode);
    
    console.log(`Room created: ${roomCode} by ${hostName}`);
    return room;
  }

  // Join an existing room
  joinRoom(roomCode, userId, userName) {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      throw new Error(ERROR_MESSAGES.ROOM_NOT_FOUND);
    }

    if (room.users.length >= ROOM_CONFIG.MAX_USERS_PER_ROOM) {
      throw new Error(ERROR_MESSAGES.ROOM_FULL);
    }

    // Check if user is already in the room
    const existingUser = room.users.find(user => user.id === userId);
    if (existingUser) {
      return room; // User already in room
    }

    const newUser = {
      id: userId,
      name: userName,
      isHost: false,
      joinedAt: Date.now()
    };

    room.users.push(newUser);
    room.lastActivity = Date.now();
    this.userToRoom.set(userId, roomCode);

    console.log(`User ${userName} joined room ${roomCode}`);
    return room;
  }

  // Leave a room
  leaveRoom(userId) {
    const roomCode = this.userToRoom.get(userId);
    if (!roomCode) {
      return null; // User not in any room
    }

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.userToRoom.delete(userId);
      return null;
    }

    const userIndex = room.users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      this.userToRoom.delete(userId);
      return null;
    }

    const user = room.users[userIndex];
    room.users.splice(userIndex, 1);
    room.lastActivity = Date.now();
    this.userToRoom.delete(userId);

    console.log(`User ${user.name} left room ${roomCode}`);

    // If host left, transfer host to another user or delete room
    if (user.isHost) {
      if (room.users.length > 0) {
        // Transfer host to the first remaining user
        room.users[0].isHost = true;
        room.hostId = room.users[0].id;
        console.log(`Host transferred to ${room.users[0].name} in room ${roomCode}`);
      } else {
        // No users left, delete room
        this.rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted (no users left)`);
        return null;
      }
    }

    return room;
  }

  // Get room by code
  getRoom(roomCode) {
    return this.rooms.get(roomCode);
  }

  // Get room by user ID
  getRoomByUserId(userId) {
    const roomCode = this.userToRoom.get(userId);
    return roomCode ? this.rooms.get(roomCode) : null;
  }

  // Update metronome state (host only)
  updateMetronomeState(roomCode, updates, userId) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error(ERROR_MESSAGES.ROOM_NOT_FOUND);
    }

    const user = room.users.find(u => u.id === userId);
    if (!user || !user.isHost) {
      throw new Error(ERROR_MESSAGES.USER_NOT_HOST);
    }

    // Validate BPM
    if (updates.bpm !== undefined) {
      if (updates.bpm < METRONOME_CONFIG.MIN_BPM || updates.bpm > METRONOME_CONFIG.MAX_BPM) {
        throw new Error(ERROR_MESSAGES.INVALID_BPM);
      }
    }

    // Validate time signature
    if (updates.timeSignature !== undefined) {
      const timeSignatureRegex = /^\d+\/\d+$/;
      if (!timeSignatureRegex.test(updates.timeSignature)) {
        throw new Error(ERROR_MESSAGES.INVALID_TIME_SIGNATURE);
      }
    }

    room.metronomeState = {
      ...room.metronomeState,
      ...updates
    };
    room.lastActivity = Date.now();

    console.log(`Metronome state updated in room ${roomCode}:`, updates);
    return room;
  }

  // Start metronome (host only)
  startMetronome(roomCode, userId) {
    const startTime = Date.now();
    return this.updateMetronomeState(roomCode, {
      isPlaying: true,
      startTime
    }, userId);
  }

  // Stop metronome (host only)
  stopMetronome(roomCode, userId) {
    return this.updateMetronomeState(roomCode, {
      isPlaying: false,
      startTime: 0
    }, userId);
  }

  // Change BPM (host only)
  changeBPM(roomCode, bpm, userId) {
    return this.updateMetronomeState(roomCode, { bpm }, userId);
  }

  // Change time signature (host only)
  changeTimeSignature(roomCode, timeSignature, userId) {
    return this.updateMetronomeState(roomCode, { timeSignature }, userId);
  }

  // Check if user is host
  isHost(userId, roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    
    const user = room.users.find(u => u.id === userId);
    return user ? user.isHost : false;
  }

  // Get all rooms (for debugging)
  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  // Clean up inactive rooms
  cleanupInactiveRooms() {
    const now = Date.now();
    const inactiveRooms = [];

    for (const [roomCode, room] of this.rooms) {
      if (now - room.lastActivity > ROOM_CONFIG.INACTIVE_ROOM_TIMEOUT) {
        inactiveRooms.push(roomCode);
      }
    }

    inactiveRooms.forEach(roomCode => {
      const room = this.rooms.get(roomCode);
      if (room) {
        // Remove all users from userToRoom mapping
        room.users.forEach(user => {
          this.userToRoom.delete(user.id);
        });
        this.rooms.delete(roomCode);
        console.log(`Cleaned up inactive room: ${roomCode}`);
      }
    });

    return inactiveRooms.length;
  }

  // Start cleanup interval
  startCleanupInterval() {
    setInterval(() => {
      const cleanedCount = this.cleanupInactiveRooms();
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} inactive rooms`);
      }
    }, ROOM_CONFIG.ROOM_CLEANUP_INTERVAL);
  }

  // Get room statistics
  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalUsers: this.userToRoom.size,
      rooms: Array.from(this.rooms.values()).map(room => ({
        roomCode: room.roomCode,
        userCount: room.users.length,
        isPlaying: room.metronomeState.isPlaying,
        bpm: room.metronomeState.bpm,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }))
    };
  }
}

// Export singleton instance
module.exports = new RoomManager();
