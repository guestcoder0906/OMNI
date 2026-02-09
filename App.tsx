import React, { useState, useEffect, useRef } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { Terminal } from './components/Terminal';
import { FileSystem } from './components/FileSystem';
import { LiveTicker } from './components/LiveTicker';

const App: React.FC = () => {
  const {
    gameState,
    handleInput,
    resetGame,
    toggleDebug,
    inspectItem,
    selectedFile,
    setSelectedFile,
    isPlayerDead
  } = useGameEngine();

  const [inputValue, setInputValue] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true); // Assume true initially to avoid flicker, check on mount
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for API Key presence via AI Studio integration
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // If not in AI Studio environment, check env var directly
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkApiKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Fix: Assume success to avoid race condition as per guidelines
      setHasApiKey(true);
    }
  };

  // Auto-focus input on load and after AI response
  useEffect(() => {
    if (!gameState.isLoading) {
      inputRef.current?.focus();
    }
  }, [gameState.isLoading]);

  // If Debug Mode gets turned on, auto-show sidebar
  useEffect(() => {
    if (gameState.debugMode) setShowSidebar(true);
  }, [gameState.debugMode]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleInput(inputValue);
    setInputValue('');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen bg-terminal-black text-terminal-green font-mono flex flex-col overflow-hidden relative selection:bg-terminal-green selection:text-terminal-black">

      {/* Header / Status Bar */}
      <header className="h-12 border-b border-terminal-gray bg-terminal-black flex items-center justify-between px-4 z-20 shadow-md shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-terminal-amber font-bold tracking-widest">OMNISCRIPT</div>
          <div className="hidden md:block text-xs text-terminal-lightGray opacity-50">v3.1.0-ENGINE</div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6 text-sm">
          {!hasApiKey && window.aistudio && (
            <button
              onClick={handleConnectKey}
              className="text-xs bg-terminal-amber text-terminal-black px-3 py-1 rounded font-bold hover:bg-yellow-400 transition-colors animate-pulse"
            >
              CONNECT KEY
            </button>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-terminal-lightGray text-xs uppercase hidden sm:inline">Time</span>
            <span className="text-terminal-green font-bold">{formatTime(gameState.worldTime)}</span>
          </div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`text-xs uppercase border px-2 py-1 rounded transition-colors ${showSidebar ? 'bg-terminal-green/10 border-terminal-green text-terminal-green' : 'border-terminal-gray text-terminal-lightGray'}`}
          >
            {showSidebar ? 'Hide' : 'Files'}
          </button>

          <div className="flex items-center space-x-2 border-l border-terminal-gray pl-4">
            <span className="text-terminal-lightGray text-xs uppercase hidden md:inline">Debug</span>
            <button
              onClick={toggleDebug}
              className={`w-8 h-4 rounded-full relative transition-colors duration-200 ease-in-out border ${gameState.debugMode ? 'bg-terminal-dimAmber border-terminal-amber' : 'bg-terminal-black border-terminal-gray'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-current transition-transform duration-200 ${gameState.debugMode ? 'translate-x-4 text-terminal-amber' : 'text-terminal-gray'}`}></div>
            </button>
          </div>

          <button
            onClick={resetGame}
            className="text-red-900 hover:text-red-500 text-xs uppercase border border-red-900 px-2 py-1 rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Main Terminal Area */}
        <main className="flex-1 flex flex-col relative bg-gradient-to-b from-terminal-black to-[#050505]">
          <LiveTicker updates={gameState.liveUpdates} />

          <Terminal
            history={gameState.history}
            isLoading={gameState.isLoading}
            onReferenceClick={inspectItem}
          />

          {/* Input Area */}
          <div className="p-4 bg-terminal-black border-t border-terminal-gray shrink-0">
            <form onSubmit={onSubmit} className="relative flex items-center">
              <span className="absolute left-3 text-terminal-amber font-bold animate-pulse">{'>'}</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isPlayerDead ? "PLAYER IS DECEASED - ACCESS DENIED" :
                    !hasApiKey ? "Connect API Key to Start..." :
                      (gameState.isInitialized ? "Enter command..." : "Initialize reality (e.g., 'A hard sci-fi space station running on low power')")
                }
                className="w-full bg-terminal-gray/10 border border-terminal-gray rounded p-3 pl-8 text-terminal-green focus:outline-none focus:border-terminal-green focus:ring-1 focus:ring-terminal-green placeholder-terminal-gray/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={gameState.isLoading || !hasApiKey || isPlayerDead}
                autoComplete="off"
              />
            </form>
          </div>
        </main>

        {/* File System Sidebar (Responsive & Toggleable) */}
        {showSidebar && (
          <aside className="absolute md:relative right-0 top-0 bottom-0 z-30 w-full md:w-80 h-full border-l border-terminal-gray shadow-xl animate-fade-in bg-terminal-black">
            <div className="h-full w-full relative">
              {/* Close button for mobile */}
              <button
                onClick={() => setShowSidebar(false)}
                className="absolute top-2 right-2 md:hidden text-terminal-lightGray z-40"
              >✕</button>

              <FileSystem
                files={gameState.files}
                externalSelectedFile={selectedFile}
                onSelect={setSelectedFile}
                debugMode={gameState.debugMode}
              />
            </div>
          </aside>
        )}

      </div>
    </div>
  );
};

export default App;