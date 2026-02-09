
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthOverlayProps {
    onLogin: (user: any) => void;
    onGuest: () => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLogin, onGuest }) => {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check for existing session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                onLogin(session.user);
            }
        };
        checkSession();
    }, [onLogin]);

    // handleAuth removed


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-terminal-black border border-terminal-green rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.2)]">
                <h2 className="text-2xl font-bold text-terminal-green mb-6 text-center tracking-widest uppercase">
                    AI-MUD ACCESS
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-500 text-red-500 text-sm rounded">
                        ERROR: {error}
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={async () => {
                            setLoading(true);
                            const { error } = await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: window.location.origin,
                                    queryParams: {
                                        access_type: 'offline',
                                        prompt: 'consent',
                                    },
                                }
                            });
                            if (error) {
                                setError(error.message);
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span>Sign in with Google</span>
                    </button>

                    <div className="w-full border-t border-terminal-gray/50 my-4"></div>

                    <button
                        onClick={onGuest}
                        className="w-full border border-terminal-gray text-terminal-lightGray hover:text-white hover:border-white py-2 rounded transition-colors text-sm uppercase tracking-wider"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};
