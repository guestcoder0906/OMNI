import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UsernameSetupProps {
    user: any;
    onComplete: (user: any) => void;
}

export const UsernameSetup: React.FC<UsernameSetupProps> = ({ user, onComplete }) => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);

        const finalUsername = username.trim() || `Explorer_${Math.floor(Math.random() * 10000)}`;

        try {
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    username: finalUsername,
                    custom_username: true // Flag to know it's set
                }
            });

            if (error) throw error;
            if (data.user) {
                onComplete(data.user);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-terminal-black border border-terminal-green rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.2)]">
                <h2 className="text-xl font-bold text-terminal-green mb-4 text-center uppercase tracking-widest">
                    Identify Yourself
                </h2>

                <p className="text-terminal-lightGray text-sm mb-6 text-center">
                    Enter a unique callsign for the network.
                </p>

                {error && (
                    <div className="mb-4 p-2 bg-red-900/30 border border-red-500 text-red-500 text-xs rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-terminal-gray/10 border border-terminal-gray rounded p-2 text-terminal-green focus:border-terminal-green focus:outline-none text-center font-bold"
                        placeholder="Enter Username (Optional)"
                        maxLength={15}
                    />

                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={loading}
                            className="flex-1 border border-terminal-gray text-terminal-lightGray hover:text-white hover:border-white py-2 rounded transition-colors text-xs uppercase"
                        >
                            Skip (Random)
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-terminal-green text-terminal-black font-bold py-2 rounded hover:bg-green-400 transition-colors text-xs uppercase disabled:opacity-50"
                        >
                            {loading ? 'Registering...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
