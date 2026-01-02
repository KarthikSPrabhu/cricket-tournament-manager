import { useSocket } from '../context/SocketContext';

export const useSocketHook = () => {
    const socketContext = useSocket();

    const emitBallScored = (matchId, ballData) => {
        if (socketContext.socket && socketContext.isConnected) {
            socketContext.socket.emit('admin_scoring', {
                matchId,
                action: 'ball_scored',
                ballData
            });
        }
    };

    const emitMatchStatus = (matchId, status) => {
        if (socketContext.socket && socketContext.isConnected) {
            socketContext.socket.emit('match_status', {
                matchId,
                status
            });
        }
    };

    const emitPointsUpdate = (tournamentId) => {
        if (socketContext.socket && socketContext.isConnected) {
            socketContext.socket.emit('points_update', tournamentId);
        }
    };

    return {
        ...socketContext,
        emitBallScored,
        emitMatchStatus,
        emitPointsUpdate
    };
};