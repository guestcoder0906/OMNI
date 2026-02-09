
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { GameState } from '../types';

export const useMultiplayer = (
    user: any,
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    handleInput: (input: string) => Promise<void>
) => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [connectedPlayers, setConnectedPlayers] = useState<any[]>([]);
    const [pendingActions, setPendingActions] = useState<{ playerId: string, action: string }[]>([]);
    const [lastProcessedActionTime, setLastProcessedActionTime] = useState(0);
    const channelRef = useRef<any>(null);

    // Generate a random 6-character code
    const generateSessionId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const createSession = async () => {
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        setIsHost(true);
        // In a real app, we might check collision in DB, but for now random is fine
        connectToSession(newSessionId);
    };

    const joinSession = (id: string) => {
        setSessionId(id);
        setIsHost(false);
        connectToSession(id);
    };

    const connectToSession = (id: string) => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase.channel(`game_session_${id}`, {
            config: {
                presence: {
                    key: user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.id || `Guest_${Math.floor(Math.random() * 1000)}`,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const players = Object.values(newState).flat();
                setConnectedPlayers(players);
            })
            .on('broadcast', { event: 'action' }, ({ payload }: { payload: { playerId: string, action: string, timestamp: number } }) => {
                console.log("Received action", payload);
                handleRemoteAction(payload);
            })
            .on('broadcast', { event: 'gameState' }, ({ payload }: { payload: GameState }) => {
                if (!isHost) {
                    console.log("Received game state sync", payload);
                    setGameState(prev => ({
                        ...payload,
                        // Keep local UI state like loading/debug if needed, but mostly trust host
                        isLoading: false
                    }));
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const username = user?.user_metadata?.username || user?.id || "Guest";
                    await channel.track({
                        user_id: user?.id,
                        username: username,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        channelRef.current = channel;
    };

    const handleRemoteAction = (payload: { playerId: string, action: string, timestamp: number }) => {
        // Add to pending actions
        setPendingActions(prev => {
            // Avoid duplicates
            if (prev.find(a => a.playerId === payload.playerId && a.action === payload.action)) return prev;
            return [...prev, payload];
        });
    };

    // Turn Execution Logic
    useEffect(() => {
        if (!sessionId || !isHost) return;

        // Check if we have actions from all players
        // For simplicity in this text adventure, we might just process actions as they come 
        // OR wait for everyone. User asked: "waits for all players to submit"

        const uniquePlayers = new Set(connectedPlayers.map((p: any) => p.username));
        const activePlayerCount = uniquePlayers.size;

        if (activePlayerCount === 0) return;

        // Group actions by unique player
        const receivedPlayerIds = new Set(pendingActions.map(a => a.playerId));

        if (receivedPlayerIds.size >= activePlayerCount && activePlayerCount > 0) {
            // Execute all actions!
            // We order them by timestamp to be fair, or random, or just sequence.
            // Since we need to update state sequentially, we'll chain them.

            processTurn(pendingActions);
            setPendingActions([]); // Clear after processing
        }

    }, [pendingActions, connectedPlayers, isHost, sessionId]);

    const processTurn = async (actions: { playerId: string, action: string }[]) => {
        // 1. Combine actions into a narrative input or process sequentially?
        // User said "text can be set like local(player1)[blah]".
        // We might want to send a combined prompt to Gemini:
        // "Player1 says: 'attack'. Player2 says: 'run'."

        const compositeInput = actions.map(a => `Player ${a.playerId} action: ${a.action}`).join('\n');

        // We send this special composite input to the engine
        // But wait, our handleInput takes a string.
        // We should probably modify handleInput or just send this composite string.

        await handleInput(`[MULTIPLAYER TURN]\n${compositeInput}`);

        // After processing, if we are host, we broadcast the new state
        // This happens in the next effect since gameState updates
    };

    // HOST syncs state to others
    useEffect(() => {
        if (isHost && sessionId && channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'gameState',
                payload: gameState
            });
        }
    }, [gameState, isHost, sessionId]);

    const broadcastAction = async (action: string) => {
        if (channelRef.current) {
            const playerId = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || user?.id || 'Guest';
            await channelRef.current.send({
                type: 'broadcast',
                event: 'action',
                payload: {
                    playerId: playerId,
                    action,
                    timestamp: Date.now()
                }
            });

            // If I am not host, I just wait.
            // If I am host, I also add my own action to pending locally via the broadcast listener? 
            // Actually broadcast sends to everyone including self? No usually not self.
            // So we manually add to self.

            handleRemoteAction({
                playerId: playerId,
                action,
                timestamp: Date.now()
            });
        }
    };

    return {
        sessionId,
        createSession,
        joinSession,
        connectedPlayers,
        broadcastAction,
        isHost
    };
};
