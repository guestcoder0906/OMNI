import React, { useState, useEffect } from 'react';

interface CharacterSetupModalProps {
    onComplete: (description: string) => void;
    isLoading?: boolean;
}

export const CharacterSetupModal: React.FC<CharacterSetupModalProps> = ({ onComplete, isLoading: externalLoading }) => {
    const [description, setDescription] = useState('');
    const [isInternalLoading, setIsInternalLoading] = useState(false);

    const isLoading = externalLoading || isInternalLoading;

    // Reset internal loading if external loading finishes (AI done thinking)
    useEffect(() => {
        if (!externalLoading && isInternalLoading) {
            setIsInternalLoading(false);
        }
    }, [externalLoading, isInternalLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (description.trim().length > 5) {
            setIsInternalLoading(true);
            onComplete(description);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-terminal-black border border-terminal-green p-6 w-full max-w-md shadow-2xl relative overflow-hidden group">
                {/* Decorative scanning line if loading */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-black/60 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-terminal-green border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-terminal-green font-mono text-sm animate-pulse uppercase tracking-widest">
                            Generating Character...
                        </div>
                    </div>
                )}

                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-terminal-green to-transparent opacity-50"></div>

                <div className="text-terminal-green font-bold mb-4 text-sm tracking-[0.1em] uppercase text-center border-b border-terminal-green/30 pb-2">
                    Character Creation
                </div>

                <p className="text-terminal-lightGray text-sm font-mono mb-6 text-center leading-relaxed">
                    The world simulation has begun. Please define your character to join the reality.
                </p>

                <form onSubmit={handleSubmit}>
                    <textarea
                        autoFocus
                        disabled={isLoading}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. A seasoned pilot stranded from a crash, carrying only a rusted toolkit and a mysterious encrypted data pad."
                        className="w-full bg-terminal-gray/10 border border-terminal-gray rounded p-3 text-terminal-green outline-none focus:border-terminal-green/50 mb-6 font-mono text-sm h-32 resize-none placeholder:opacity-30 disabled:opacity-50"
                    />

                    <button
                        type="submit"
                        disabled={description.length <= 5 || isLoading}
                        className="w-full bg-terminal-green border border-terminal-green text-black py-3 text-sm font-bold hover:bg-terminal-green/80 transition-all disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        {isLoading ? 'Processing...' : 'Start Game'}
                    </button>
                    {!isLoading && (
                        <p className="text-[10px] text-terminal-gray mt-2 text-center italic">
                            The AI will generate your unique player file based on this description.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};
