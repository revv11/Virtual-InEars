// Simple test script to verify backend is working
const { io } = require('socket.io-client');

const client = io('http://localhost:3001');

client.on('connect', () => {
  console.log('✅ Connected to backend server');
  console.log('Socket ID:', client.id);
  
  // Test creating a room
  client.emit('create-room', { userName: 'Test User' });
});

client.on('room-created', (data) => {
  console.log('✅ Room created successfully:', data.roomCode);
  console.log('Room data:', data);
  
  // Test joining the room
  client.emit('join-room', { roomCode: data.roomCode, userName: 'Another User' });
});

client.on('room-joined', (data) => {
  console.log('✅ Room joined successfully');
  console.log('Users in room:', data.users.length);
  
  // Test metronome controls
  client.emit('start-metronome');
});

client.on('metronome-started', (data) => {
  console.log('✅ Metronome started successfully');
  console.log('Metronome data:', data);
  
  // Test changing BPM
  client.emit('change-bpm', { bpm: 140 });
});

client.on('metronome-updated', (data) => {
  console.log('✅ Metronome updated successfully');
  console.log('New BPM:', data.bpm);
  
  // Test stopping metronome
  client.emit('stop-metronome');
});

client.on('metronome-stopped', () => {
  console.log('✅ Metronome stopped successfully');
  
  // Test leaving room
  client.emit('leave-room');
});

client.on('room-left', () => {
  console.log('✅ Left room successfully');
  console.log('🎉 All tests passed! Backend is working correctly.');
  client.disconnect();
});

client.on('room-error', (error) => {
  console.error('❌ Room error:', error.message);
});

client.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.log('Make sure the backend server is running on port 3001');
});

client.on('disconnect', () => {
  console.log('Disconnected from server');
});
