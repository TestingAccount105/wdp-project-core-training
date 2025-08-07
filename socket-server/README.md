# Discord Socket.IO Server

A real-time WebSocket server for Discord-like messaging functionality using Socket.IO.

## Installation

1. Install Node.js (if not already installed): https://nodejs.org/
2. Navigate to the socket-server directory:
   ```bash
   cd socket-server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment configuration:
   ```bash
   copy .env.example .env
   ```
5. Update `.env` with your database credentials

## Running the Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will run on port 8010 by default.

## Features

- Real-time messaging
- Channel and server management
- User presence (online/offline status)
- Typing indicators
- Message reactions
- Voice channel events
- User authentication

## WebSocket Events

### Client → Server:
- `authenticate` - Authenticate user
- `join_server` - Join a server
- `join_channel` - Join a channel
- `new_message` - Send new message
- `edit_message` - Edit existing message
- `delete_message` - Delete message
- `add_reaction` - Add reaction to message
- `remove_reaction` - Remove reaction
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `join_voice` - Join voice channel
- `leave_voice` - Leave voice channel

### Server → Client:
- `message_received` - New message in channel
- `message_edited` - Message was edited
- `message_deleted` - Message was deleted
- `reaction_added` - Reaction added to message
- `reaction_removed` - Reaction removed
- `user_typing` - User typing status
- `user_status_update` - User online/offline status
- `user_joined_channel` - User joined channel
- `user_left_channel` - User left channel
- `channel_members` - Current channel members

## Configuration

Edit the database configuration in `server.js` or use environment variables:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'wdp_discord'
};
```

## Testing

Open your browser console and check for:
- "Connected to server" message
- No WebSocket connection errors

## Troubleshooting

1. **Port 8010 already in use**: Change the port in `server.js`
2. **Database connection failed**: Check your MySQL credentials
3. **CORS errors**: Update the CORS origins in the server configuration
