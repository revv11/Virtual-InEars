// Room and metronome configuration constants
const ROOM_CONFIG = {
  MAX_USERS_PER_ROOM: 50,
  ROOM_CODE_LENGTH: 6,
  ROOM_CLEANUP_INTERVAL: 300000, // 5 minutes
  INACTIVE_ROOM_TIMEOUT: 1800000, // 30 minutes
};

const METRONOME_CONFIG = {
  MIN_BPM: 30,
  MAX_BPM: 300,
  DEFAULT_BPM: 120,
  DEFAULT_TIME_SIGNATURE: '4/4',
  SYNC_CHECK_INTERVAL: 1000, // 1 second
};

const SOCKET_EVENTS = {
  // Room events
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  ROOM_CREATED: 'room-created',
  ROOM_JOINED: 'room-joined',
  ROOM_LEFT: 'room-left',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  ROOM_ERROR: 'room-error',
  
  // Metronome events
  START_METRONOME: 'start-metronome',
  STOP_METRONOME: 'stop-metronome',
  CHANGE_BPM: 'change-bpm',
  CHANGE_TIME_SIGNATURE: 'change-time-signature',
  METRONOME_STARTED: 'metronome-started',
  METRONOME_STOPPED: 'metronome-stopped',
  METRONOME_UPDATED: 'metronome-updated',
  
  // Sync events
  SYNC_CHECK: 'sync-check',
  SYNC_RESPONSE: 'sync-response',
  TIME_PACKET: 'time-packet',
};

const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Room not found',
  ROOM_FULL: 'Room is full',
  INVALID_ROOM_CODE: 'Invalid room code',
  USER_NOT_HOST: 'Only the host can perform this action',
  INVALID_BPM: 'Invalid BPM value',
  INVALID_TIME_SIGNATURE: 'Invalid time signature',
  USER_NOT_IN_ROOM: 'User not in room',
};

module.exports = {
  ROOM_CONFIG,
  METRONOME_CONFIG,
  SOCKET_EVENTS,
  ERROR_MESSAGES,
};
