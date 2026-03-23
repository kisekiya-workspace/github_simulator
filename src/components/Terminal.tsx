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
      case 'input': return 'text-zinc-300';
      case 'output': return 'text-zinc-400';
      case 'error': return 'text-red-500';
      case 'success': return 'text-emerald-500';
      case 'info': return 'text-blue-500';
      case 'diff-add': return 'text-emerald-500';
      case 'diff-remove': return 'text-red-500';
      case 'diff-header': return 'text-zinc-500 font-bold';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#050505] font-mono text-sm leading-relaxed"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 bg-[#0a0a0a] shrink-0">
        <TerminalSquare size={16} className="text-emerald-500" />
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Terminal</span>
        <span className="text-[10px] text-zinc-700 ml-auto uppercase tracking-widest">Type "help" for commands</span>
      </div>

      {/* Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 selection:bg-white/10 selection:text-white">
        {terminalHistory.length === 0 && (
          <div className="text-zinc-700 text-[11px] py-4 px-1 font-mono uppercase tracking-loose">
            <p className="text-emerald-500/80 mb-2 font-bold select-none tracking-[0.1em]">/ Git Sandbox Interactive Shell v2.0.4</p>
            <p className="select-none">Type 'help' to see available commands</p>
            <p className="select-none">Start with 'git status' or 'git log'</p>
          </div>
        )}

        {terminalHistory.map((line) => (
          <div key={line.id} className={`${getLineColor(line.type)} leading-relaxed whitespace-pre-wrap font-mono`}>
            {line.type === 'input' ? (
              <span className="flex items-center gap-2">
                <ChevronRight size={14} className="text-emerald-500 shrink-0" />
                <span className="text-zinc-200">{line.content}</span>
              </span>
            ) : (
              <span className="pl-6">{line.content}</span>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="relative border-t border-white/5 bg-[#0a0a0a]">
        {/* Autocomplete */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 bg-[#111111] border border-white/10 rounded-t-xl shadow-2xl max-h-48 overflow-y-auto z-50 animate-slide-up">
            {suggestions.map((s, i) => (
              <button
                key={s}
                className={`w-full text-left px-4 py-2 text-[11px] font-mono transition-all uppercase tracking-widest ${
                  i === selectedSuggestion ? 'bg-white/10 text-white' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.02]'
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

        <div className="flex items-center gap-2 px-4 py-3">
          <ChevronRight size={16} className="text-emerald-500 shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white outline-none font-mono text-sm placeholder:text-zinc-800"
            placeholder="git status"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
};
