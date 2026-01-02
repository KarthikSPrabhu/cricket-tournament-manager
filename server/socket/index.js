const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join match room for live updates
        socket.on('join_match', (matchId) => {
            socket.join(`match_${matchId}`);
            console.log(`Socket ${socket.id} joined match_${matchId}`);
        });

        // Join tournament room for updates
        socket.on('join_tournament', (tournamentId) => {
            socket.join(`tournament_${tournamentId}`);
        });

        // Admin scoring actions
        socket.on('admin_scoring', (data) => {
            const { matchId, action, ballData } = data;
            // Broadcast to all viewers of this match
            io.to(`match_${matchId}`).emit('score_update', {
                action,
                ballData,
                timestamp: new Date()
            });
        });

        // Match status updates
        socket.on('match_status', (data) => {
            const { matchId, status } = data;
            io.to(`match_${matchId}`).emit('status_update', {
                matchId,
                status,
                timestamp: new Date()
            });
        });

        // Points table updates
        socket.on('points_update', (tournamentId) => {
            io.to(`tournament_${tournamentId}`).emit('points_updated');
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = {
    initializeSocket,
    getIO
};