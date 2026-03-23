import { useState, useRef, useEffect, useCallback } from 'react';
import type { FC, KeyboardEvent } from 'react';
import useGitStore from '../store/gitStore';
import { executeCommand, getAutocompleteSuggestions } from '../store/commandParser';
import { TerminalSquare, ChevronRight } from 'lucide-react';

export const Terminal: FC = () => {
  const store = useGitStore();
  const { terminalHistory, addTerminalLine, addCommandHistory, commandHistory: cmdHistory } = store;
  
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const handleExecute = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    addTerminalLine({ type: 'input', content: trimmed });
    addCommandHistory(trimmed);

    // Get fresh store state for command execution
    const currentStore = useGitStore.getState();
    const outputs = executeCommand(trimmed, currentStore);
    
    outputs.forEach(line => {
      addTerminalLine(line);
    });

    setInput('');
    setHistoryIndex(-1);
    setShowSuggestions(false);
  }, [input, addTerminalLine, addCommandHistory]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0) {
        setInput(suggestions[selectedSuggestion]);
        setShowSuggestions(false);
        return;
      }
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestion(prev => Math.max(0, prev - 1));
        return;
      }
      if (cmdHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < cmdHistory.length) {
          setHistoryIndex(newIndex);
          setInput(cmdHistory[cmdHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1));
        return;
      }
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(cmdHistory[cmdHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[selectedSuggestion]);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim().length > 1) {
      const currentStore = useGitStore.getState();
      const suggs = getAutocompleteSuggestions(value, currentStore);
      setSuggestions(suggs);
      setShowSuggestions(suggs.length > 0);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'input': return 'text-cyan-300';
      case 'output': return 'text-slate-300';
      case 'error': return 'text-red-400';
      case 'success': return 'text-emerald-400';
      case 'info': return 'text-blue-400';
      case 'diff-add': return 'text-emerald-400';
      case 'diff-remove': return 'text-red-400';
      case 'diff-header': return 'text-amber-400 font-bold';
      default: return 'text-slate-300';
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-slate-950 font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900 shrink-0">
        <TerminalSquare size={14} className="text-emerald-500" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Terminal</span>
        <span className="text-xs text-slate-600 ml-auto">Type "help" for commands</span>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {terminalHistory.length === 0 && (
          <div className="text-slate-600 text-xs py-2">
            <p className="text-emerald-500/60 mb-1">Welcome to Git Sandbox Terminal</p>
            <p>Type <span className="text-cyan-400">'help'</span> to see available commands, or start with <span className="text-cyan-400">'git status'</span></p>
          </div>
        )}

        {terminalHistory.map((line) => (
          <div key={line.id} className={`${getLineColor(line.type)} leading-relaxed whitespace-pre-wrap`}>
            {line.type === 'input' ? (
              <span className="flex items-center gap-1">
                <ChevronRight size={12} className="text-emerald-500 shrink-0" />
                <span className="text-cyan-300">{line.content}</span>
              </span>
            ) : (
              <span className="pl-4">{line.content}</span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="relative border-t border-slate-800 bg-slate-900/50">
        {/* Autocomplete */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-t-lg shadow-xl max-h-40 overflow-y-auto z-50">
            {suggestions.map((s, i) => (
              <button
                key={s}
                className={`w-full text-left px-4 py-1.5 text-sm font-mono transition-colors ${
                  i === selectedSuggestion ? 'bg-blue-600/30 text-white' : 'text-slate-400 hover:bg-slate-700/50'
                }`}
                onClick={() => {
                  setInput(s);
                  setShowSuggestions(false);
                  inputRef.current?.focus();
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2">
          <ChevronRight size={14} className="text-emerald-500 shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white outline-none font-mono text-sm placeholder-slate-600"
            placeholder="git status"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
};
