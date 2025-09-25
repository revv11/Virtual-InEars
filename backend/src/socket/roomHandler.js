const roomManager = require('../utils/roomManager'); // Adjust path as needed
const { SOCKET_EVENTS, ERROR_MESSAGES } = require('../config/constants'); // Adjust path as needed

module.exports = (socket, io) => {
  // --- Room Management Events ---

  // Handles a user creating a new room
  socket.on(SOCKET_EVENTS.CREATE_ROOM, (data) => {
    try {
      const { userName } = data;
      if (!userName || userName.trim().length === 0) {
        return socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'User name is required' });
      }

      const room = roomManager.createRoom(socket.id, userName.trim());
      socket.join(room.roomCode);
      
      socket.emit(SOCKET_EVENTS.ROOM_CREATED, {
        roomCode: room.roomCode,
        roomId: room.roomId,
        isHost: true,
        users: room.users,
        metronomeState: room.metronomeState
      });
      console.log(`Room created: ${room.roomCode} by ${userName}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: error.message || 'Failed to create room' });
    }
  });

  // Handles a user joining an existing room
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
    try {
      const { roomCode, userName } = data;
      if (!roomCode || !userName || userName.trim().length === 0) {
        return socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Room code and user name are required' });
      }

      const room = roomManager.joinRoom(roomCode.toUpperCase(), socket.id, userName.trim());
      socket.join(room.roomCode);
      
      // Notify the joining user
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
        roomCode: room.roomCode,
        roomId: room.roomId,
        isHost: room.users.find(u => u.id === socket.id)?.isHost || false,
        users: room.users,
        metronomeState: room.metronomeState
      });

      // Notify other users in the room
      socket.to(room.roomCode).emit(SOCKET_EVENTS.USER_JOINED, {
        user: room.users.find(u => u.id === socket.id)
      });
      console.log(`User ${userName} joined room ${roomCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: error.message || 'Failed to join room' });
    }
  });

  // Handles a user intentionally leaving a room
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, () => {
    try {
      const room = roomManager.leaveRoom(socket.id);
      if (room) {
        socket.to(room.roomCode).emit(SOCKET_EVENTS.USER_LEFT, { userId: socket.id });
        socket.leave(room.roomCode);
        socket.emit(SOCKET_EVENTS.ROOM_LEFT, { message: 'Successfully left room' });
        console.log(`User left room ${room.roomCode}`);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: error.message || 'Failed to leave room' });
    }
  });

  // --- Metronome Control Events (Host Only) ---

  socket.on(SOCKET_EVENTS.START_METRONOME, () => {
    try {
      const room = roomManager.getRoomByUserId(socket.id);
      if (!room) return socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: ERROR_MESSAGES.USER_NOT_IN_ROOM });

      const updatedRoom = roomManager.startMetronome(room.roomCode, socket.id);
      
      // Broadcast to all users in the room with the universal start time
      io.to(room.roomCode).emit(SOCKET_EVENTS.METRONOME_STARTED, {
        startTime: updatedRoom.metronomeState.startTime,
        bpm: updatedRoom.metronomeState.bpm,
        timeSignature: updatedRoom.metronomeState.timeSignature
      });
      console.log(`Metronome started in room ${room.roomCode}`);
    } catch (error) {
      console.error('Error starting metronome:', error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: error.message || 'Failed to start metronome' });
    }
  });

  socket.on(SOCKET_EVENTS.STOP_METRONOME, () => {
    try {
      const room = roomManager.getRoomByUserId(socket.id);
      if (!room) return socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: ERROR_MESSAGES.USER_NOT_IN_ROOM });

      roomManager.stopMetronome(room.roomCode, socket.id);
      
      io.to(room.roomCode).emit(SOCKET_EVENTS.METRONOME_STOPPED, { message: 'Metronome stopped' });
      console.log(`Metronome stopped in room ${room.roomCode}`);
    } catch (error) {
      console.error('Error stopping metronome:', error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: error.message || 'Failed to stop metronome' });
    }
  });

  socket.on(SOCKET_EVENTS.CHANGE_BPM, (data) => {
    try {
      const { bpm } = data;
      const room = roomManager.getRoomByUserId(socket.id);
      if (!room) return socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: ERROR_MESSAGES.USER_NOT_IN_ROOM });

      const updatedRoom = roomManager.changeBPM(room.roomCode, bpm, socket.id);
      
      io.to(room.roomCode).emit(SOCKET_EVENTS.METRONOME_UPDATED, updatedRoom.metronomeState);
      console.log(`BPM changed to ${bpm} in room ${room.roomCode}`);
    } catch (error) {
      console.error('Error changing BPM:', error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: error.message || 'Failed to change BPM' });
    }
  });

  socket.on(SOCKET_EVENTS.CHANGE_TIME_SIGNATURE, (data) => {
    try {
      const { timeSignature } = data;
      const room = roomManager.getRoomByUserId(socket.id);
      if (!room) return socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: ERROR_MESSAGES.USER_NOT_IN_ROOM });

      const updatedRoom = roomManager.changeTimeSignature(room.roomCode, timeSignature, socket.id);
      
      io.to(room.roomCode).emit(SOCKET_EVENTS.METRONOME_UPDATED, updatedRoom.metronomeState);
      console.log(`Time signature changed to ${timeSignature} in room ${room.roomCode}`);
    } catch (error) {
      console.error('Error changing time signature:', error);
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: error.message || 'Failed to change time signature' });
    }
  });

  // --- Synchronization & Disconnect Events ---

  socket.on(SOCKET_EVENTS.SYNC_CHECK, (data) => {
    const { clientTime } = data;
    // Immediately respond with the original clientTime and the current serverTime
    socket.emit(SOCKET_EVENTS.SYNC_RESPONSE, {
      clientTime,
      serverTime: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    try {
      const room = roomManager.leaveRoom(socket.id);
      if (room) {
        // Notify other users that this user has left
        socket.to(room.roomCode).emit(SOCKET_EVENTS.USER_LEFT, { userId: socket.id });
        console.log(`User disconnected from room ${room.roomCode}`);
      }
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  });
};