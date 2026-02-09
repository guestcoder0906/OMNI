
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
    const [connectedPlayers, setConnectedPlayers] = useState<any[]>([]);
    const [pendingActions, setPendingActions] = useState<{ playerId: string, action: string }[]>([]);
    const channelRef = useRef<any>(null);

    // Derived Host State
    const hostPlayer = connectedPlayers.sort((a, b) => new Date(a.online_at).getTime() - new Date(b.online_at).getTime())[0];
    const isHost = hostPlayer?.user_id === user?.id;

    // Generate a random 6-character code
    const generateSessionId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const createSession = async () => {
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        connectToSession(newSessionId);
    };

    const joinSession = (id: string) => {
        setSessionId(id);
        connectToSession(id);
    };

    const leaveSession = async () => {
        if (channelRef.current) {
            await supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        setSessionId(null);
        setConnectedPlayers([]);
        setPendingActions([]);
    };

    const kickPlayer = async (targetUserId: string) => {
        if (!isHost || !channelRef.current) return;
        await channelRef.current.send({
            type: 'broadcast',
            event: 'kick',
            payload: { targetUserId }
        });
    };

    const connectToSession = (id: string) => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase.channel(`game_session_${id}`, {
            config: {
                presence: {
                    key: user?.id || `Guest_${Math.floor(Math.random() * 1000)}`,
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
                    setGameState(prev => ({
                        ...payload,
                        isLoading: false
                    }));
                }
            })
            .on('broadcast', { event: 'kick' }, async ({ payload }: { payload: { targetUserId: string } }) => {
                if (payload.targetUserId === user?.id) {
                    alert("You have been kicked from the session.");
                    await leaveSession();
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const username = user?.user_metadata?.username || "Guest";
                    // Note: We'll rely on App.tsx to ensure username is set correctly in user_metadata before join
                    await channel.track({
                        user_id: user?.id,
                        username: username,
                        online_at: new Date().toISOString(),
                        is_dead: false // Track death status in presence
                    });
                }
            });

        channelRef.current = channel;
    };

    const handleRemoteAction = (payload: { playerId: string, action: string, timestamp: number }) => {
        setPendingActions(prev => {
            if (prev.find(a => a.playerId === payload.playerId && a.action === payload.action)) return prev;
            return [...prev, payload];
        });
    };

    // Turn Execution Logic
    useEffect(() => {
        if (!sessionId || !isHost) return;

        // Filter out dead players from "active" count if we track that
        // For now, simple unique count
        const uniquePlayers = new Set(connectedPlayers.map((p: any) => p.username));
        const activePlayerCount = uniquePlayers.size;

        if (activePlayerCount === 0) return;

        const receivedPlayerIds = new Set(pendingActions.map(a => a.playerId));

        if (receivedPlayerIds.size >= activePlayerCount && activePlayerCount > 0) {
            processTurn(pendingActions);
            setPendingActions([]);
        }

    }, [pendingActions, connectedPlayers, isHost, sessionId]);

    const processTurn = async (actions: { playerId: string, action: string }[]) => {
        const compositeInput = actions.map(a => `Player ${a.playerId} action: ${a.action}`).join('\n');
        await handleInput(`[MULTIPLAYER TURN]\n${compositeInput}`);
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
            const playerId = user?.user_metadata?.username || 'Guest';
            await channelRef.current.send({
                type: 'broadcast',
                event: 'action',
                payload: {
                    playerId: playerId,
                    action,
                    timestamp: Date.now()
                }
            });

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
        leaveSession,
        connectedPlayers,
        broadcastAction,
        isHost,
        kickPlayer
    };
};
