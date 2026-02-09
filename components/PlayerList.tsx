import React from 'react';

interface PlayerListProps {
    players: any[];
    currentUserId: string;
    isHost: boolean;
    onKick: (userId: string) => void;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentUserId, isHost, onKick }) => {
    if (players.length === 0) return null;

    // Find host based on oldest online_at (same logic as useMultiplayer)
    const sortedPlayers = [...players].sort((a, b) => new Date(a.online_at).getTime() - new Date(b.online_at).getTime());
    const hostId = sortedPlayers[0]?.user_id;

    return (
        <div className="absolute bottom-4 right-4 z-40 bg-terminal-black/90 border border-terminal-gray rounded p-3 min-w-[200px] animate-fade-in shadow-lg">
            <h3 className="text-terminal-gray text-xs uppercase mb-2 border-b border-terminal-gray pb-1 flex justify-between">
                <span>Players</span>
                <span>{players.length}</span>
            </h3>
            <ul className="space-y-1 text-xs">
                {sortedPlayers.map((player) => {
                    const isMe = player.user_id === currentUserId;
                    const isPlayerHost = player.user_id === hostId;

                    return (
                        <li key={player.presence_ref} className="flex items-center justify-between group">
                            <span className={`truncate flex-1 ${isMe ? 'text-terminal-green font-bold' : 'text-terminal-lightGray'} ${player.is_dead ? 'line-through opacity-50' : ''}`}>
                                {isPlayerHost && <span className="text-terminal-amber mr-1">★</span>}
                                {player.username}
                                {player.is_dead && <span className="ml-1 text-red-500">(KIA)</span>}
                            </span>

                            {isHost && !isMe && (
                                <button
                                    onClick={() => onKick(player.user_id)}
                                    className="ml-2 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Kick Player"
                                >
                                    [X]
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
