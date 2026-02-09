import React from 'react';
import { LiveUpdate } from '../types';

interface LiveTickerProps {
  updates: LiveUpdate[];
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ updates }) => {
  return (
    <div className="absolute top-4 right-4 md:right-8 w-64 pointer-events-none z-10 flex flex-col items-end space-y-1">
      {updates.slice(0, 6).map((update, idx) => ( // Only show most recent 6 for visual clarity
        <div
          key={update.id}
          className={`
            text-xs font-mono px-3 py-1 rounded bg-black/80 border backdrop-blur-sm shadow-lg
            transform transition-all duration-500 ease-out animate-slide-in-right
            ${update.type === 'POSITIVE' ? 'border-terminal-green text-terminal-green' : 
              update.type === 'NEGATIVE' ? 'border-red-800 text-red-400' : 
              'border-terminal-gray text-terminal-lightGray'}
          `}
          style={{ opacity: 1 - (idx * 0.15) }}
        >
          {update.text}
        </div>
      ))}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};
