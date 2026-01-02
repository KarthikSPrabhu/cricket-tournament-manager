const { getIO } = require('./index');

const matchEvents = {
    // Emit when a new ball is scored
    emitBallScored: (matchId, ballData) => {
        const io = getIO();
        io.to(`match_${matchId}`).emit('ball_scored', {
            matchId,
            ball: ballData,
            timestamp: new Date()
        });
    },

    // Emit when innings changes
    emitInningsChange: (matchId, inningsData) => {
        const io = getIO();
        io.to(`match_${matchId}`).emit('innings_change', {
            matchId,
            innings: inningsData
        });
    },

    // Emit when match ends
    emitMatchEnd: (matchId, result) => {
        const io = getIO();
        io.to(`match_${matchId}`).emit('match_end', {
            matchId,
            result,
            timestamp: new Date()
        });
    },

    // Emit points table update
    emitPointsUpdate: (tournamentId) => {
        const io = getIO();
        io.to(`tournament_${tournamentId}`).emit('points_table_updated', {
            tournamentId,
            timestamp: new Date()
        });
    },

    // Emit player stats update
    emitPlayerStatsUpdate: (playerId, stats) => {
        const io = getIO();
        io.emit('player_stats_update', {
            playerId,
            stats,
            timestamp: new Date()
        });
    }
};

module.exports = matchEvents;