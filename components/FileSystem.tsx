import React, { useEffect } from 'react';
import { FileObject } from '../types';

interface FileSystemProps {
  files: Record<string, FileObject>;
  externalSelectedFile: string | null;
  onSelect: (fileName: string | null) => void;
  debugMode: boolean;
}

export const FileSystem: React.FC<FileSystemProps> = ({ files, externalSelectedFile, onSelect, debugMode }) => {
  useEffect(() => {
    if (externalSelectedFile) {
        // Optional: Scroll into view logic
    }
  }, [externalSelectedFile]);

  // Filter: Show file IF (Debug Mode is ON) OR (File is NOT hidden)
  const visibleFiles = (Object.values(files) as FileObject[])
    .filter(f => debugMode || !f.isHidden);

  const fileList = visibleFiles.sort((a, b) => {
    const getPriority = (type: string, name: string) => {
        if (name === 'Guide.txt') return 0;
        if (name.includes('Rules')) return 1;
        if (type === 'PLAYER') return 2;
        if (type === 'LOCATION') return 3;
        return 4;
    };
    
    const pA = getPriority(a.type, a.name);
    const pB = getPriority(b.type, b.name);
    
    if (pA !== pB) return pA - pB;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="h-full flex flex-col bg-terminal-black border-l border-terminal-gray w-full md:w-80">
      <div className={`p-3 border-b border-terminal-gray flex justify-between items-center ${debugMode ? 'bg-terminal-dimAmber/30' : 'bg-terminal-dimGreen/20'}`}>
        <h2 className={`${debugMode ? 'text-terminal-amber' : 'text-terminal-green'} text-xs font-bold uppercase tracking-wider flex items-center`}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          {debugMode ? 'DEBUG: ALL FILES' : 'KNOWN FILES'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {fileList.length === 0 && (
            <div className="p-4 text-xs text-terminal-gray italic text-center">No files perceived yet.</div>
        )}
        {fileList.map((file) => (
          <div key={file.name}>
            <button
              onClick={() => onSelect(externalSelectedFile === file.name ? null : file.name)}
              className={`w-full text-left px-4 py-2 text-xs font-mono border-b border-terminal-gray/30 hover:bg-terminal-gray/20 transition-colors flex items-center justify-between ${externalSelectedFile === file.name ? 'bg-terminal-gray/30 text-terminal-amber' : 'text-terminal-lightGray'}`}
            >
              <div className="flex items-center space-x-2 overflow-hidden">
                {file.isHidden && debugMode && (
                    <span className="text-[8px] px-1 border border-terminal-gray text-terminal-gray rounded">HIDDEN</span>
                )}
                <span className="truncate max-w-[120px]">{file.name}</span>
              </div>
              <span className="text-[10px] opacity-50 ml-2 shrink-0">{file.type.substring(0,3)}</span>
            </button>
            
            {externalSelectedFile === file.name && (
              <div className="bg-black/80 p-3 text-[10px] font-mono text-terminal-lightGray overflow-x-auto whitespace-pre-wrap border-b border-terminal-gray/30 animate-fade-in shadow-inner relative">
                {file.content.includes('hide[') && (
                    <div className="absolute top-1 right-1 text-red-500 text-[9px] border border-red-500 px-1 rounded bg-black">HIDDEN LAYERS</div>
                )}
                {file.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};