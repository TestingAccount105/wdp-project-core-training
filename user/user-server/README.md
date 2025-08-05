# Discord-Like Server Application

A comprehensive Discord-like server application built with PHP, JavaScript, CSS, HTML, AJAX, and WebSockets. This application allows users to create and join servers, participate in text chat and voice calls, and manage server settings.

## Features

### 🖥️ Server Management
- **Create Servers**: Set up new servers with custom names, descriptions, icons, banners, and categories
- **Server Settings**: Comprehensive management including profile settings, channel management, member management, and server deletion
- **Public/Private Servers**: Control server visibility and discoverability
- **Server Categories**: Organize servers by Gaming, Education, Technology, Music, etc.

### 💬 Text Chat
- **Real-time Messaging**: WebSocket-powered instant messaging
- **Message Features**: Edit, delete, reply to messages, and add reactions
- **File Attachments**: Support for images, videos, audio, and documents
- **Message Search**: Server-wide message search with highlighting
- **Rich Text**: Support for mentions, links, and basic markdown formatting

### 🎤 Voice & Video
- **Voice Channels**: Join voice channels for real-time audio communication
- **Video Calls**: Enable camera for face-to-face conversations
- **Screen Sharing**: Share your screen with other participants
- **Voice Controls**: Mute, deafen, and adjust audio settings
- **WebRTC**: High-quality peer-to-peer audio/video communication

### 👥 User Management
- **User Profiles**: Customizable avatars, banners, usernames, and bio
- **Role System**: Owner, Admin, Member, and Bot roles with appropriate permissions
- **Member Management**: Promote, demote, kick, and ban members
- **Online Status**: Real-time user presence indicators

### 🔗 Invite System
- **Invite Links**: Generate shareable invite links with expiration dates
- **Titibot Integration**: Invite the built-in bot to your server
- **Invite Management**: View, copy, and delete active invites

### ⚙️ User Settings
- **Account Management**: Change username, display name, email, and password
- **Security**: Security question verification for password changes
- **Voice & Video Settings**: Device selection, volume controls, and testing
- **Account Deletion**: Safe account deletion with server ownership checks

## Technology Stack

### Backend
- **PHP**: Server-side logic and REST API
- **MySQL**: Database management with MySQLi
- **XAMPP**: Local development environment

### Frontend
- **HTML5**: Modern semantic markup
- **CSS3**: Responsive design with CSS Grid and Flexbox
- **JavaScript ES6+**: Modern JavaScript with classes and async/await
- **jQuery**: DOM manipulation and AJAX requests
- **Socket.IO**: Real-time WebSocket communication

### Real-time Features
- **WebSockets**: Real-time chat and server updates
- **WebRTC**: Peer-to-peer voice and video communication
- **Node.js**: WebSocket server for real-time features

### Additional Libraries
- **Cropper.js**: Image cutting and cropping
- **Font Awesome**: Icon library
- **VideoSDK/Agora**: Voice and video SDK options (configurable)

## Installation & Setup

### Prerequisites
- XAMPP (Apache, MySQL, PHP)
- Node.js (for WebSocket server)
- Modern web browser with WebRTC support

### Database Setup
1. Start XAMPP and ensure MySQL is running
2. Import the database schema:
   ```sql
   mysql -u root -p < db.sql
   ```
3. Run the database extensions:
   ```bash
   php create_db_extensions.php
   ```

### WebSocket Server Setup
1. Navigate to the websocket directory:
   ```bash
   cd websocket
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the WebSocket server:
   ```bash
   npm start
   ```
   The server will run on port 3001 by default.

### Web Server Setup
1. Place the `user-server` folder in your XAMPP `htdocs/user/` directory
2. Ensure Apache is running in XAMPP
3. Access the application at: `http://localhost/user/user-server/`

### Configuration
1. Update database credentials in `api/config.php` if needed
2. Update WebSocket server URL in JavaScript files if using a different port
3. Configure STUN/TURN servers in `voice.js` for better WebRTC connectivity

## File Structure

```
user-server/
├── api/                          # PHP API endpoints
│   ├── config.php               # Database configuration and utilities
│   ├── servers.php              # Server management API
│   ├── channels.php             # Channel and messaging API
│   ├── members.php              # Member management API
│   ├── invites.php              # Invite system API
│   ├── user.php                 # User management API
│   └── upload.php               # File upload handling
├── assets/
│   ├── css/
│   │   └── server.css           # Main stylesheet
│   ├── js/
│   │   ├── server.js            # Core application logic
│   │   ├── modals.js            # Modal functionality
│   │   ├── channels.js          # Chat and messaging
│   │   └── voice.js             # Voice/video features
│   └── images/                  # Static images
├── modals/                      # HTML modal components
│   ├── create-server-modal.php
│   ├── user-settings-modal.php
│   ├── server-settings-modal.php
│   ├── invite-people-modal.php
│   ├── create-channel-modal.php
│   ├── confirmation-modal.php
│   └── leave-server-modal.php
├── uploads/                     # User-uploaded files
├── websocket/                   # Node.js WebSocket server
│   ├── server.js               # WebSocket server implementation
│   └── package.json            # Node.js dependencies
├── index.php                   # Main application entry point
├── create_db_extensions.php    # Database schema extensions
└── README.md                   # This file
```

## API Endpoints

### Server Management
- `GET /api/servers.php?action=getUserServers` - Get user's servers
- `POST /api/servers.php` - Create, update, delete servers
- `POST /api/servers.php?action=joinServer` - Join server via invite
- `POST /api/servers.php?action=leaveServer` - Leave server

### Channel Management
- `GET /api/channels.php?action=getChannels&serverId=X` - Get server channels
- `GET /api/channels.php?action=getMessages&channelId=X` - Get channel messages
- `POST /api/channels.php` - Send, edit, delete messages
- `POST /api/channels.php?action=addReaction` - Add message reactions

### Member Management
- `GET /api/members.php?action=getMembers&serverId=X` - Get server members
- `POST /api/members.php?action=updateMemberRole` - Change member roles
- `POST /api/members.php?action=kickMember` - Remove members

### User Management
- `GET /api/user.php?action=getCurrentUser` - Get current user data
- `POST /api/user.php?action=updateProfile` - Update user profile
- `POST /api/user.php?action=changePassword` - Change password

### File Upload
- `POST /api/upload.php` - Upload files (avatars, banners, attachments)

## WebSocket Events

### Connection Events
- `join_server` - Join server room for real-time updates
- `join_channel` - Join channel room for messaging
- `join_voice` - Join voice channel for audio/video

### Message Events
- `new_message` - Send new message
- `message_updated` - Edit message
- `message_deleted` - Delete message
- `reaction_added` - Add message reaction

### Voice Events
- `webrtc_offer` - WebRTC offer for voice/video
- `webrtc_answer` - WebRTC answer
- `webrtc_ice_candidate` - ICE candidate exchange

## Security Features

- **Session Management**: Secure PHP sessions with MySQL storage
- **Input Sanitization**: All user inputs are sanitized and validated
- **SQL Injection Prevention**: Prepared statements for all database queries
- **File Upload Security**: File type and size validation
- **Permission System**: Role-based access control for all operations
- **CSRF Protection**: Form tokens and validation

## Browser Compatibility

- **Chrome/Chromium**: Full support including WebRTC
- **Firefox**: Full support including WebRTC
- **Safari**: Full support including WebRTC
- **Edge**: Full support including WebRTC

## Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Image Processing**: Automatic image resizing and compression
- **Lazy Loading**: Messages loaded on demand
- **Connection Pooling**: Efficient database connections
- **WebSocket Optimization**: Efficient real-time communication

## Development

### Adding New Features
1. Create API endpoint in appropriate PHP file
2. Add frontend JavaScript functionality
3. Update database schema if needed
4. Add WebSocket events for real-time features

### Debugging
- Check browser console for JavaScript errors
- Check Apache error logs for PHP errors
- Check WebSocket server console for real-time issues
- Use browser developer tools for network debugging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the documentation above
- Review the code comments
- Test with browser developer tools
- Check server logs for errors

## Acknowledgments

- Discord for UI/UX inspiration
- Socket.IO for real-time communication
- WebRTC for voice/video capabilities
- Font Awesome for icons
- Cropper.js for image editing