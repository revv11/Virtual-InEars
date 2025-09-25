# Virtual IEM Metronome Backend

A Node.js + Express + Socket.io backend server for the Virtual IEM Metronome application.

## Features

- **Real-time Communication**: Socket.io for instant synchronization
- **Room Management**: Create, join, and manage metronome rooms
- **Metronome Control**: Start/stop metronome, change BPM and time signature
- **Time Synchronization**: Precise timing for synchronized playback
- **User Management**: Track users and handle host privileges
- **Auto Cleanup**: Remove inactive rooms automatically

## Quick Start

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```
   PORT=3001
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## API Endpoints

- `GET /health` - Health check endpoint

## Socket Events

### Room Events
- `create-room` - Create a new room
- `join-room` - Join an existing room
- `leave-room` - Leave current room
- `room-created` - Room creation confirmation
- `room-joined` - Room join confirmation
- `room-left` - Room leave confirmation
- `user-joined` - User joined notification
- `user-left` - User left notification
- `room-error` - Room operation error

### Metronome Events
- `start-metronome` - Start metronome (host only)
- `stop-metronome` - Stop metronome (host only)
- `change-bpm` - Change BPM (host only)
- `change-time-signature` - Change time signature (host only)
- `metronome-started` - Metronome started broadcast
- `metronome-stopped` - Metronome stopped broadcast
- `metronome-updated` - Metronome settings updated broadcast

### Sync Events
- `sync-check` - Request time synchronization
- `sync-response` - Time sync response
- `time-packet` - Periodic time packets for drift correction

## Project Structure

```
backend/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── src/
│   ├── config/
│   │   └── constants.js      # Configuration constants
│   ├── socket/
│   │   └── roomHandler.js    # Socket event handlers
│   └── utils/
│       └── roomManager.js    # Room state management
└── README.md
```

## Configuration

### Room Settings
- Max users per room: 50
- Room code length: 6 characters
- Room cleanup interval: 5 minutes
- Inactive room timeout: 30 minutes

### Metronome Settings
- BPM range: 30-300
- Default BPM: 120
- Default time signature: 4/4
- Sync check interval: 1 second

## Development

The server uses nodemon for development with hot reloading. All socket events are handled in `roomHandler.js` and room state is managed by the `RoomManager` class.

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure proper CORS origins
3. Use a process manager like PM2
4. Set up proper logging and monitoring
