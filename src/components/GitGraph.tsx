import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { motion } from 'framer-motion';
import useGitStore from '../store/gitStore';
import { getAncestors } from '../store/utils';
import { Tag, History, GitBranch, Eye, EyeOff } from 'lucide-react';

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
  { stroke: '#3B82F6', fill: '#1D4ED8' },  // blue
  { stroke: '#10B981', fill: '#047857' },  // emerald
  { stroke: '#A855F7', fill: '#7C3AED' },  // purple
  { stroke: '#F59E0B', fill: '#D97706' },  // amber
  { stroke: '#EF4444', fill: '#DC2626' },  // red
  { stroke: '#06B6D4', fill: '#0891B2' },  // cyan
  { stroke: '#EC4899', fill: '#DB2777' },  // pink
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
      <div className="flex-1 flex items-center justify-center text-slate-600 flex-col gap-2">
        <History size={48} className="text-slate-700" />
        <p className="text-sm">No commits yet</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 font-mono text-sm relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 z-10 shrink-0">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <History size={14} className="text-slate-400" />
          Commit Graph
        </h2>
        <button
          onClick={() => setShowAllBranches(!showAllBranches)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-800"
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

                {/* Labels - Left side: commit info */}
                <g className="pointer-events-none">
                  {/* Commit hash */}
                  <text x={pos.x + 20} y={pos.y - 6} fill="#94A3B8" fontSize={10} fontFamily="monospace">
                    {commit.id}
                  </text>
                  
                  {/* Commit message */}
                  <text x={pos.x + 20} y={pos.y + 10} fill="#E2E8F0" fontSize={11} fontFamily="sans-serif">
                    {commit.message.length > 50 ? commit.message.substring(0, 50) + '...' : commit.message}
                  </text>
                </g>

                {/* Branch badges - Left of node */}
                {commitBranches.map((b, i) => (
                  <g key={b} transform={`translate(${pos.x - 20 - i * 0}, ${pos.y - 20})`}>
                    <rect x={-b.length * 3.5 - 16} y={-8} width={b.length * 7 + 28} height={16} rx={3} 
                      fill={isHead && b === head ? '#1E40AF' : '#1E293B'} 
                      stroke={isHead && b === head ? '#3B82F6' : '#475569'} 
                      strokeWidth={1} 
                    />
                    <text x={-b.length * 3.5} y={4} fill={isHead && b === head ? '#93C5FD' : '#94A3B8'} fontSize={10} fontFamily="sans-serif">
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
                  <g transform={`translate(${pos.x + 20}, ${pos.y + 22})`}>
                    <rect x={0} y={0} width={220} height={60} rx={6} fill="#0F172A" stroke="#334155" strokeWidth={1} opacity={0.95} />
                    <text x={10} y={18} fill="#94A3B8" fontSize={9}>
                      {new Date(commit.timestamp).toLocaleString()}
                    </text>
                    <text x={10} y={32} fill="#60A5FA" fontSize={9}>
                      Parents: {commit.parents.join(', ') || 'none (root)'}
                    </text>
                    <text x={10} y={46} fill="#94A3B8" fontSize={9}>
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
