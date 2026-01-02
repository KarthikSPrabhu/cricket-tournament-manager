import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Create socket connection
        const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.close();
        };
    }, []);

    // Join a specific match room
    const joinMatchRoom = (matchId) => {
        if (socket && isConnected) {
            socket.emit('join_match', matchId);
        }
    };

    // Leave a match room
    const leaveMatchRoom = (matchId) => {
        if (socket && isConnected) {
            socket.leave(`match_${matchId}`);
        }
    };

    // Join tournament room
    const joinTournamentRoom = (tournamentId) => {
        if (socket && isConnected) {
            socket.emit('join_tournament', tournamentId);
        }
    };

    // Listen for score updates
    const onScoreUpdate = (callback) => {
        if (socket) {
            socket.on('score_update', callback);
        }
    };

    // Listen for status updates
    const onStatusUpdate = (callback) => {
        if (socket) {
            socket.on('status_update', callback);
        }
    };

    // Listen for match end
    const onMatchEnd = (callback) => {
        if (socket) {
            socket.on('match_end', callback);
        }
    };

    // Listen for points table updates
    const onPointsUpdate = (callback) => {
        if (socket) {
            socket.on('points_table_updated', callback);
        }
    };

    // Remove listeners
    const removeListener = (event, callback) => {
        if (socket) {
            socket.off(event, callback);
        }
    };

    const value = {
        socket,
        isConnected,
        joinMatchRoom,
        leaveMatchRoom,
        joinTournamentRoom,
        onScoreUpdate,
        onStatusUpdate,
        onMatchEnd,
        onPointsUpdate,
        removeListener
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};