const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: [
            "http://localhost", 
            "http://localhost:80", 
            "http://localhost:8080",
            "http://localhost:8010", 
            "http://127.0.0.1",
            "http://127.0.0.1:80",
            "http://127.0.0.1:8080"
        ],
        methods: ["GET", "POST"],
        credentials: true
    },
    allowEIO3: true
});

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'misvord',
    charset: 'utf8mb4'
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Session store
const sessionStore = new MySQLStore({
    host: dbConfig.host,
    port: 3307,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
});

// Session middleware
const sessionMiddleware = session({
    key: 'session_cookie_name',
    secret: 'your_session_secret_here',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
});

app.use(sessionMiddleware);

// Share session with Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Store active connections
const activeUsers = new Map();
const serverRooms = new Map();
const channelRooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    let userId = null;
    
    // Try to get user ID from session first
    const session = socket.request.session;
    if (session && session.user_id) {
        userId = session.user_id;
        console.log(`User authenticated via session: ${userId}`);
        handleUserConnect(socket, userId);
    } else {
        console.log('User not authenticated via session, waiting for manual authentication...');
    }
    
    // Handle manual authentication (for clients that don't use sessions)
    socket.on('authenticate', (data) => {
        if (data.userId) {
            userId = data.userId;
            socket.userId = userId;
            console.log(`User manually authenticated: ${userId}`);
            handleUserConnect(socket, userId);
            socket.emit('authenticated', { success: true, userId: userId });
        } else {
            console.log('Authentication failed: no userId provided');
            socket.emit('authentication_failed', { message: 'No userId provided' });
        }
    });
    
    function handleUserConnect(socket, userId) {
        socket.userId = userId;
        
        // Store user connection
        activeUsers.set(userId, {
            socketId: socket.id,
            userId: userId,
            status: 'online',
            lastSeen: new Date()
        });
        
        // Update user status in database
        updateUserStatus(userId, 'online');
    }
    
    // Handle joining server room
    socket.on('join_server', async (data) => {
        if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }
        
        const { serverId } = data;
        const userId = socket.userId;
        
        // Verify user is member of server
        const isMember = await isServerMember(userId, serverId);
        if (!isMember) {
            socket.emit('error', { message: 'Access denied' });
            return;
        }
        
        // Join server room
        socket.join(`server_${serverId}`);
        
        // Track server room
        if (!serverRooms.has(serverId)) {
            serverRooms.set(serverId, new Set());
        }
        serverRooms.get(serverId).add(socket.id);
        
        // Notify other server members
        socket.to(`server_${serverId}`).emit('member_joined', {
            userId: userId,
            serverId: serverId
        });
        
        console.log(`User ${userId} joined server ${serverId}`);
    });
    
    // Handle leaving server room
    socket.on('leave_server', (data) => {
        if (!socket.userId) return;
        
        const { serverId } = data;
        const userId = socket.userId;
        
        socket.leave(`server_${serverId}`);
        
        // Remove from server room tracking
        if (serverRooms.has(serverId)) {
            serverRooms.get(serverId).delete(socket.id);
            if (serverRooms.get(serverId).size === 0) {
                serverRooms.delete(serverId);
            }
        }
        
        // Notify other server members
        socket.to(`server_${serverId}`).emit('member_left', {
            userId: userId,
            serverId: serverId
        });
        
        console.log(`User ${userId} left server ${serverId}`);
    });
    
    // Handle joining channel room
    socket.on('join_channel', async (data) => {
        if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }
        
        const { channelId } = data;
        const userId = socket.userId;
        
        // Get channel info and verify access
        const channel = await getChannelInfo(channelId);
        if (!channel) {
            socket.emit('error', { message: 'Channel not found' });
            return;
        }
        
        const isMember = await isServerMember(userId, channel.ServerID);
        if (!isMember) {
            socket.emit('error', { message: 'Access denied' });
            return;
        }
        
        // Join channel room
        socket.join(`channel_${channelId}`);
        
        // Track channel room
        if (!channelRooms.has(channelId)) {
            channelRooms.set(channelId, new Set());
        }
        channelRooms.get(channelId).add(socket.id);
        
        console.log(`User ${userId} joined channel ${channelId}`);
    });
    
    // Handle leaving channel room
    socket.on('leave_channel', (data) => {
        if (!socket.userId) return;
        
        const { channelId } = data;
        const userId = socket.userId;
        
        socket.leave(`channel_${channelId}`);
        
        // Remove from channel room tracking
        if (channelRooms.has(channelId)) {
            channelRooms.get(channelId).delete(socket.id);
            if (channelRooms.get(channelId).size === 0) {
                channelRooms.delete(channelId);
            }
        }
        
        console.log(`User ${userId} left channel ${channelId}`);
    });
    
    // Handle new message
    socket.on('new_message', async (data) => {
        if (!socket.userId) return;
        
        const { channelId, messageData } = data;
        const userId = socket.userId;
        
        // Verify user can access channel
        const channel = await getChannelInfo(channelId);
        if (!channel || !await isServerMember(userId, channel.ServerID)) {
            return;
        }
        
        // Broadcast message to channel members
        socket.to(`channel_${channelId}`).emit('message_received', {
            channelId: channelId,
            message: messageData
        });
        
        console.log(`New message in channel ${channelId} from user ${userId}`);
    });
    
    // Handle message update
    socket.on('message_updated', async (data) => {
        const { channelId, messageId, content } = data;
        
        // Verify user can access channel
        const channel = await getChannelInfo(channelId);
        if (!channel || !await isServerMember(userId, channel.ServerID)) {
            return;
        }
        
        // Broadcast update to channel members
        socket.to(`channel_${channelId}`).emit('message_updated', {
            messageId: messageId,
            content: content,
            editedAt: new Date()
        });
    });
    
    // Handle message deletion
    socket.on('message_deleted', async (data) => {
        const { channelId, messageId } = data;
        
        // Verify user can access channel
        const channel = await getChannelInfo(channelId);
        if (!channel || !await isServerMember(userId, channel.ServerID)) {
            return;
        }
        
        // Broadcast deletion to channel members
        socket.to(`channel_${channelId}`).emit('message_deleted', {
            messageId: messageId
        });
    });
    
    // Handle reaction added
    socket.on('reaction_added', async (data) => {
        const { channelId, messageId, emoji, userId: reactorId } = data;
        
        // Verify user can access channel
        const channel = await getChannelInfo(channelId);
        if (!channel || !await isServerMember(userId, channel.ServerID)) {
            return;
        }
        
        // Broadcast reaction to channel members
        socket.to(`channel_${channelId}`).emit('reaction_added', {
            messageId: messageId,
            emoji: emoji,
            userId: reactorId
        });
    });
    
    // Handle voice channel events
    socket.on('join_voice', async (data) => {
        const { channelId } = data;
        
        // Verify voice channel access
        const channel = await getChannelInfo(channelId);
        if (!channel || channel.Type !== 'Voice' || !await isServerMember(userId, channel.ServerID)) {
            return;
        }
        
        // Join voice room
        socket.join(`voice_${channelId}`);
        
        // Notify other voice participants
        socket.to(`voice_${channelId}`).emit('user_joined_voice', {
            userId: userId,
            channelId: channelId
        });
        
        // Add to voice channel participants
        await addVoiceParticipant(channelId, userId);
        
        console.log(`User ${userId} joined voice channel ${channelId}`);
    });
    
    socket.on('leave_voice', async (data) => {
        const { channelId } = data;
        
        socket.leave(`voice_${channelId}`);
        
        // Notify other voice participants
        socket.to(`voice_${channelId}`).emit('user_left_voice', {
            userId: userId,
            channelId: channelId
        });
        
        // Remove from voice channel participants
        await removeVoiceParticipant(channelId, userId);
        
        console.log(`User ${userId} left voice channel ${channelId}`);
    });
    
    // Handle WebRTC signaling
    socket.on('webrtc_offer', (data) => {
        socket.to(`voice_${data.channelId}`).emit('webrtc_offer', {
            from: userId,
            to: data.to,
            offer: data.offer
        });
    });
    
    socket.on('webrtc_answer', (data) => {
        socket.to(`voice_${data.channelId}`).emit('webrtc_answer', {
            from: userId,
            to: data.to,
            answer: data.answer
        });
    });
    
    socket.on('webrtc_ice_candidate', (data) => {
        socket.to(`voice_${data.channelId}`).emit('webrtc_ice_candidate', {
            from: userId,
            to: data.to,
            candidate: data.candidate
        });
    });
    
    // Handle server events
    socket.on('server_updated', async (data) => {
        const { serverId } = data;
        
        // Verify user is admin/owner
        if (!await isServerAdmin(userId, serverId)) {
            return;
        }
        
        // Broadcast server update to all server members
        socket.to(`server_${serverId}`).emit('server_updated', data);
    });
    
    socket.on('channel_created', async (data) => {
        const { serverId, channelData } = data;
        
        // Verify user is admin/owner
        if (!await isServerAdmin(userId, serverId)) {
            return;
        }
        
        // Broadcast new channel to all server members
        socket.to(`server_${serverId}`).emit('channel_created', channelData);
    });
    
    socket.on('channel_updated', async (data) => {
        const { serverId, channelData } = data;
        
        // Verify user is admin/owner
        if (!await isServerAdmin(userId, serverId)) {
            return;
        }
        
        // Broadcast channel update to all server members
        socket.to(`server_${serverId}`).emit('channel_updated', channelData);
    });
    
    socket.on('channel_deleted', async (data) => {
        const { serverId, channelId } = data;
        
        // Verify user is admin/owner
        if (!await isServerAdmin(userId, serverId)) {
            return;
        }
        
        // Broadcast channel deletion to all server members
        socket.to(`server_${serverId}`).emit('channel_deleted', { channelId });
    });
    
    // Handle member events
    socket.on('member_updated', async (data) => {
        const { serverId, memberData } = data;
        
        // Verify user is admin/owner
        if (!await isServerAdmin(userId, serverId)) {
            return;
        }
        
        // Broadcast member update to all server members
        socket.to(`server_${serverId}`).emit('member_updated', memberData);
    });
    
    // Handle status updates
    socket.on('status_update', async (data) => {
        const { status } = data;
        
        // Update user status
        await updateUserStatus(userId, status);
        
        // Update active users map
        if (activeUsers.has(userId)) {
            activeUsers.get(userId).status = status;
            activeUsers.get(userId).lastSeen = new Date();
        }
        
        // Broadcast status update to all servers user is in
        const userServers = await getUserServers(userId);
        userServers.forEach(serverId => {
            socket.to(`server_${serverId}`).emit('user_status_updated', {
                userId: userId,
                status: status
            });
        });
    });
    
    // Handle typing indicators
    socket.on('typing_start', async (data) => {
        const { channelId } = data;
        
        // Verify channel access
        const channel = await getChannelInfo(channelId);
        if (!channel || !await isServerMember(userId, channel.ServerID)) {
            return;
        }
        
        socket.to(`channel_${channelId}`).emit('user_typing', {
            userId: userId,
            channelId: channelId
        });
    });
    
    socket.on('typing_stop', async (data) => {
        const { channelId } = data;
        
        socket.to(`channel_${channelId}`).emit('user_stopped_typing', {
            userId: userId,
            channelId: channelId
        });
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        
        const userId = socket.userId;
        if (!userId) return;
        
        // Remove from active users
        activeUsers.delete(userId);
        
        // Update user status to offline
        await updateUserStatus(userId, 'offline');
        
        // Remove from all room tracking
        serverRooms.forEach((users, serverId) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                socket.to(`server_${serverId}`).emit('member_left', {
                    userId: userId,
                    serverId: serverId
                });
            }
        });
        
        channelRooms.forEach((users, channelId) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
            }
        });
        
        // Remove from voice channels
        await removeUserFromAllVoiceChannels(userId);
        
        // Broadcast offline status to all servers user is in
        const userServers = await getUserServers(userId);
        userServers.forEach(serverId => {
            socket.to(`server_${serverId}`).emit('user_status_updated', {
                userId: userId,
                status: 'offline'
            });
        });
    });
});

// Database helper functions
async function isServerMember(userId, serverId) {
    try {
        const [rows] = await pool.execute(
            'SELECT ID FROM UserServerMemberships WHERE UserID = ? AND ServerID = ?',
            [userId, serverId]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Error checking server membership:', error);
        return false;
    }
}

async function isServerAdmin(userId, serverId) {
    try {
        const [rows] = await pool.execute(
            'SELECT Role FROM UserServerMemberships WHERE UserID = ? AND ServerID = ?',
            [userId, serverId]
        );
        return rows.length > 0 && ['Owner', 'Admin'].includes(rows[0].Role);
    } catch (error) {
        console.error('Error checking server admin status:', error);
        return false;
    }
}

async function getChannelInfo(channelId) {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM Channel WHERE ID = ?',
            [channelId]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error getting channel info:', error);
        return null;
    }
}

async function updateUserStatus(userId, status) {
    try {
        await pool.execute(
            'INSERT INTO UserLastSeens (UserID, Status, LastSeenAt) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE Status = VALUES(Status), LastSeenAt = VALUES(LastSeenAt)',
            [userId, status]
        );
    } catch (error) {
        console.error('Error updating user status:', error);
    }
}

async function getUserServers(userId) {
    try {
        const [rows] = await pool.execute(
            'SELECT ServerID FROM UserServerMemberships WHERE UserID = ?',
            [userId]
        );
        return rows.map(row => row.ServerID);
    } catch (error) {
        console.error('Error getting user servers:', error);
        return [];
    }
}

async function addVoiceParticipant(channelId, userId) {
    try {
        await pool.execute(
            'INSERT INTO VoiceChannelParticipants (ChannelID, UserID) VALUES (?, ?) ON DUPLICATE KEY UPDATE JoinedAt = CURRENT_TIMESTAMP',
            [channelId, userId]
        );
    } catch (error) {
        console.error('Error adding voice participant:', error);
    }
}

async function removeVoiceParticipant(channelId, userId) {
    try {
        await pool.execute(
            'DELETE FROM VoiceChannelParticipants WHERE ChannelID = ? AND UserID = ?',
            [channelId, userId]
        );
    } catch (error) {
        console.error('Error removing voice participant:', error);
    }
}

async function removeUserFromAllVoiceChannels(userId) {
    try {
        await pool.execute(
            'DELETE FROM VoiceChannelParticipants WHERE UserID = ?',
            [userId]
        );
    } catch (error) {
        console.error('Error removing user from voice channels:', error);
    }
}

// API endpoint to get server statistics
app.get('/api/stats', async (req, res) => {
    try {
        const stats = {
            activeUsers: activeUsers.size,
            activeServers: serverRooms.size,
            activeChannels: channelRooms.size,
            totalConnections: io.engine.clientsCount
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 8010;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Stats endpoint: http://localhost:${PORT}/api/stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});