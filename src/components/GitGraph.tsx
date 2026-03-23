import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { motion } from 'framer-motion';
import useGitStore from '../store/gitStore';
import { getAncestors } from '../store/utils';
import { History, Eye, EyeOff } from 'lucide-react';

interface NodePosition {
  x: number;
  y: number;
  lane: number;
}

const LANE_WIDTH = 36;
const NODE_SPACING = 60;
const PADDING_LEFT = 140;
const PADDING_TOP = 30;
const NODE_RADIUS = 7;

const LANE_COLORS = [
  { stroke: '#3b82f6', fill: '#1d4ed8' },  // blue
  { stroke: '#10b981', fill: '#047857' },  // emerald
  { stroke: '#a1a1aa', fill: '#52525b' },  // zinc
  { stroke: '#f59e0b', fill: '#d97706' },  // amber
  { stroke: '#f43f5e', fill: '#e11d48' },  // rose
  { stroke: '#06b6d4', fill: '#0891b2' },  // cyan
  { stroke: '#8b5cf6', fill: '#7c3aed' },  // violet
];

export const GitGraph: FC = () => {
  const { commits, branches, head, tags, checkout } = useGitStore();
  const [showAllBranches, setShowAllBranches] = useState(true);
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null);

  // Compute the sorted list of commits and their positions
  const { sortedCommits, positions, svgHeight, svgWidth } = useMemo(() => {
    let commitList = Object.values(commits);
    
    if (!showAllBranches) {
      const currentCommitId = branches[head] || head;
      if (currentCommitId) {
        const ancestors = getAncestors(commits, currentCommitId);
        commitList = commitList.filter(c => ancestors.has(c.id));
      }
    }

    // Topological sort by timestamp descending
    const sorted = [...commitList].sort((a, b) => b.timestamp - a.timestamp);
    
    // Assign lanes to branches
    const branchLanes: Record<string, number> = {};
    const branchNames = Object.keys(branches).sort((a, b) => {
      if (a === 'main') return -1;
      if (b === 'main') return 1;
      return a.localeCompare(b);
    });
    branchNames.forEach((b, i) => { branchLanes[b] = i; });

    // Assign positions
    const pos: Record<string, NodePosition> = {};
    const commitLane: Record<string, number> = {};

    // Determine which lane each commit belongs to
    for (const [branchName, commitId] of Object.entries(branches)) {
      let curr = commitId;
      while (curr && !commitLane[curr]) {
        commitLane[curr] = branchLanes[branchName] ?? 0;
        curr = commits[curr]?.parents[0];
      }
    }

    sorted.forEach((commit, idx) => {
      const lane = commitLane[commit.id] ?? 0;
      pos[commit.id] = {
        x: PADDING_LEFT + lane * LANE_WIDTH,
        y: PADDING_TOP + idx * NODE_SPACING,
        lane,
      };
    });

    return {
      sortedCommits: sorted,
      positions: pos,
      svgHeight: PADDING_TOP + sorted.length * NODE_SPACING + 40,
      svgWidth: PADDING_LEFT + (branchNames.length + 1) * LANE_WIDTH + 300,
    };
  }, [commits, branches, head, showAllBranches]);

  // Map branches & tags by commit
  const branchesByCommit = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [branch, commitId] of Object.entries(branches)) {
      if (!map[commitId]) map[commitId] = [];
      map[commitId].push(branch);
    }
    return map;
  }, [branches]);

  const tagsByCommit = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [, tag] of Object.entries(tags)) {
      if (!map[tag.commitId]) map[tag.commitId] = [];
      map[tag.commitId].push(tag.name);
    }
    return map;
  }, [tags]);

  if (Object.keys(commits).length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505] text-zinc-600 flex-col gap-6">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
          <History size={32} className="text-zinc-800" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-zinc-400 tracking-tight">No commits yet</p>
          <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest mt-2 px-2 py-0.5 border border-white/5 rounded">Start by making a commit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#050505] font-mono text-sm relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#0a0a0a] border-b border-white/5 z-10 shrink-0">
        <h2 className="text-white font-bold text-[11px] flex items-center gap-3 uppercase tracking-[0.2em]">
          <History size={16} className="text-zinc-500" />
          Commit History
        </h2>
        <button
          onClick={() => setShowAllBranches(!showAllBranches)}
          className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-white transition-all px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/5"
        >
          {showAllBranches ? <Eye size={12} /> : <EyeOff size={12} />}
          {showAllBranches ? 'All branches' : 'Current only'}
        </button>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 overflow-auto p-2">
        <svg width={svgWidth} height={svgHeight} className="min-w-full">
          {/* Connection Lines */}
          {sortedCommits.map(commit => 
            commit.parents.map(parentId => {
              const from = positions[commit.id];
              const to = positions[parentId];
              if (!from || !to) return null;
              
              const color = LANE_COLORS[from.lane % LANE_COLORS.length];
              const isMerge = from.lane !== to.lane;

              if (isMerge) {
                // Curved line for merge
                const midY = (from.y + to.y) / 2;
                return (
                  <path
                    key={`${commit.id}-${parentId}`}
                    d={`M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`}
                    fill="none"
                    stroke={color.stroke}
                    strokeWidth={2}
                    strokeOpacity={0.5}
                    strokeDasharray={isMerge ? "4 2" : undefined}
                  />
                );
              }
              
              return (
                <line
                  key={`${commit.id}-${parentId}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={color.stroke}
                  strokeWidth={2}
                  strokeOpacity={0.4}
                />
              );
            })
          )}

          {/* Commit Nodes */}
          {sortedCommits.map(commit => {
            const pos = positions[commit.id];
            if (!pos) return null;

            const isHead = branches[head] === commit.id || head === commit.id;
            const commitBranches = branchesByCommit[commit.id] || [];
            const commitTags = tagsByCommit[commit.id] || [];
            const color = LANE_COLORS[pos.lane % LANE_COLORS.length];
            const isHovered = hoveredCommit === commit.id;
            const isMerge = commit.parents.length > 1;

            return (
              <g key={commit.id}>
                {/* Node */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHead ? NODE_RADIUS + 2 : NODE_RADIUS}
                  fill={isHovered ? color.stroke : color.fill}
                  stroke={color.stroke}
                  strokeWidth={isHead ? 3 : 2}
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredCommit(commit.id)}
                  onMouseLeave={() => setHoveredCommit(null)}
                  onClick={() => checkout(commit.id)}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                />

                {/* HEAD ring */}
                {isHead && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS + 7}
                    fill="none"
                    stroke={color.stroke}
                    strokeWidth={1.5}
                    strokeOpacity={0.3}
                    strokeDasharray="3 2"
                  />
                )}

                {/* Merge diamond indicator */}
                {isMerge && (
                  <rect
                    x={pos.x - 3}
                    y={pos.y - 3}
                    width={6}
                    height={6}
                    fill={color.stroke}
                    transform={`rotate(45, ${pos.x}, ${pos.y})`}
                    className="pointer-events-none"
                  />
                )}

                {/* Labels - Right side: commit info */}
                <g className="pointer-events-none">
                  {/* Commit hash */}
                  <text x={pos.x + 20} y={pos.y - 6} fill="#52525b" fontSize={10} fontFamily="monospace" fontWeight="bold">
                    {commit.id.substring(0, 7)}
                    {isHead ? ' (HEAD)' : ''}
                  </text>
                  
                  {/* Commit message */}
                  <text x={pos.x + 20} y={pos.y + 10} fill="#d4d4d8" fontSize={12} fontFamily="Inter, sans-serif" fontWeight="500">
                    {commit.message.length > 50 ? commit.message.substring(0, 50) + '...' : commit.message}
                  </text>
                </g>

                {/* Branch badges - Top of node */}
                {commitBranches.map((b, i) => (
                  <g key={b} transform={`translate(${pos.x - 24 - i * 4}, ${pos.y - 24})`}>
                    <rect x={-b.length * 3.5 - 20} y={-10} width={b.length * 7 + 32} height={20} rx={6} 
                      fill={isHead && b === head ? '#ffffff' : '#111111'} 
                      stroke={isHead && b === head ? '#ffffff' : 'rgba(255,255,255,0.05)'} 
                      strokeWidth={1} 
                    />
                    <text x={-b.length * 3.5} y={4} fill={isHead && b === head ? '#000000' : '#a1a1aa'} fontSize={10} fontFamily="Inter, sans-serif" fontWeight="bold">
                      {b === head ? '⎆ ' : ''}{b}
                    </text>
                  </g>
                ))}

                {/* Tag badges */}
                {commitTags.map((t, i) => (
                  <g key={t} transform={`translate(${pos.x - 20}, ${pos.y + 18 + i * 18})`}>
                    <rect x={-t.length * 3 - 12} y={-7} width={t.length * 6.5 + 24} height={14} rx={3}
                      fill="#422006" stroke="#92400E" strokeWidth={1}
                    />
                    <text x={-t.length * 3} y={3} fill="#FCD34D" fontSize={9} fontFamily="sans-serif">
                      🏷 {t}
                    </text>
                  </g>
                ))}

                {/* Tooltip on hover */}
                {isHovered && (
                  <g transform={`translate(${pos.x + 20}, ${pos.y + 24})`}>
                    <rect x={0} y={0} width={260} height={70} rx={12} fill="#111111" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                    <text x={14} y={20} fill="#71717a" fontSize={10} fontWeight="bold">
                      {new Date(commit.timestamp).toLocaleString()}
                    </text>
                    <text x={14} y={36} fill="#3b82f6" fontSize={10} fontWeight="bold">
                      Parents: {commit.parents.map(p => p.substring(0, 7)).join(', ') || 'root'}
                    </text>
                    <text x={14} y={52} fill="#d4d4d8" fontSize={10} fontWeight="medium">
                      Files: {Object.keys(commit.files).join(', ')}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
