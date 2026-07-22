'use client';
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ArrowDownUp, ExternalLink, LayoutGrid, List, Loader2, QrCode, Search, TrendingUp, Users, X } from 'lucide-react';
import { ModalProps, SubAction } from './types';
import ImageCarousel from '@/components/ui/image-carousel';
import SocialLinksRow from '@/components/ui/social-links';

type SortMode = 'votes-desc' | 'votes-asc' | 'newest' | 'oldest' | 'trending' | 'custom';
type ViewMode = 'grid' | 'list';

const voteSortOptions: { value: SortMode; label: string; description: string }[] = [
  { value: 'votes-desc', label: 'Highest votes', description: 'Most voted candidates first' },
  { value: 'votes-asc', label: 'Lowest votes', description: 'Least voted candidates first' },
  { value: 'newest', label: 'Newest first', description: 'Recently added candidates first' },
  { value: 'oldest', label: 'Oldest first', description: 'Earlier candidates first' },
  { value: 'trending', label: 'Trending', description: 'Vote momentum first' },
  { value: 'custom', label: 'Custom rank', description: 'Sort order and rank fallback' },
];

function getCandidateVotes(candidate: SubAction) {
  return Number(candidate.metadata?.votes ?? 0);
}

function getCandidateRank(candidate: SubAction) {
  return Number(candidate.metadata?.rank ?? Number.MAX_SAFE_INTEGER);
}

function getCandidateAgeScore(candidate: SubAction) {
  const createdAt = Date.parse(candidate.createdAt);
  if (Number.isNaN(createdAt)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Date.now() - createdAt;
}

function getVoteMomentum(candidate: SubAction) {
  const ageHours = Math.max(getCandidateAgeScore(candidate) / 3_600_000, 1);
  return getCandidateVotes(candidate) / ageHours;
}

function getTrendLabel(candidate: SubAction) {
  const momentum = getVoteMomentum(candidate);

  if (momentum >= 10) {
    return 'Surging';
  }

  if (momentum >= 4) {
    return 'Trending';
  }

  if (momentum >= 1) {
    return 'Rising';
  }

  return 'Steady';
}

function compareCandidates(a: SubAction, b: SubAction, sortMode: SortMode) {
  const votesA = getCandidateVotes(a);
  const votesB = getCandidateVotes(b);
  const rankA = getCandidateRank(a);
  const rankB = getCandidateRank(b);
  const sortOrderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const sortOrderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const createdAtA = Date.parse(a.createdAt) || 0;
  const createdAtB = Date.parse(b.createdAt) || 0;
  const trendA = votesA / Math.max(getCandidateAgeScore(a) / 3_600_000, 1);
  const trendB = votesB / Math.max(getCandidateAgeScore(b) / 3_600_000, 1);

  if (sortMode === 'votes-desc') {
    return votesB - votesA || rankA - rankB || sortOrderA - sortOrderB || createdAtB - createdAtA || a.name.localeCompare(b.name);
  }

  if (sortMode === 'votes-asc') {
    return votesA - votesB || rankA - rankB || sortOrderA - sortOrderB || createdAtA - createdAtB || a.name.localeCompare(b.name);
  }

  if (sortMode === 'newest') {
    return createdAtB - createdAtA || votesB - votesA || rankA - rankB || sortOrderA - sortOrderB || a.name.localeCompare(b.name);
  }

  if (sortMode === 'oldest') {
    return createdAtA - createdAtB || votesB - votesA || rankA - rankB || sortOrderA - sortOrderB || a.name.localeCompare(b.name);
  }

  if (sortMode === 'trending') {
    return trendB - trendA || votesB - votesA || rankA - rankB || sortOrderA - sortOrderB || createdAtB - createdAtA || a.name.localeCompare(b.name);
  }

  return sortOrderA - sortOrderB || rankA - rankB || votesB - votesA || createdAtA - createdAtB || a.name.localeCompare(b.name);
}

export function VoteModal({
  action,
  subActions,
  subActionsLoading,
  isOpen,
  onClose,
  purchasing,
  purchaseError,
  onDirectPurchase,
}: ModalProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<SubAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('votes-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [pinnedCandidateIds, setPinnedCandidateIds] = useState<string[]>([]);
  const [expandedMore, setExpandedMore] = useState<Record<string, boolean>>({});

  const activeSubActions = useMemo(
    () => subActions.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [subActions]
  );

  const filteredCandidates = useMemo(() => {
    let list = filter === 'active' ? activeSubActions : subActions;
    if (searchQuery) {
      list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filter === 'inactive') {
      list = list.filter(s => !s.isActive);
    }
    return [...list].sort((a, b) => compareCandidates(a, b, sortMode));
  }, [activeSubActions, subActions, searchQuery, filter, sortMode]);

  const pinnedCandidates = useMemo(
    () => pinnedCandidateIds.map(candidateId => subActions.find(candidate => candidate.id === candidateId)).filter(Boolean) as SubAction[],
    [subActions, pinnedCandidateIds]
  );

  const togglePinnedCandidate = (candidateId: string) => {
    setPinnedCandidateIds(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      }

      if (prev.length >= 3) {
        return [...prev.slice(1), candidateId];
      }

      return [...prev, candidateId];
    });
  };

  const handleVote = (candidate: SubAction) => {
    onDirectPurchase(candidate, { quantity: 1, buyerData: {} });
  };

  const handleSelect = (candidate: SubAction) => {
    setSelectedCandidate(prev => (prev?.id === candidate.id ? null : candidate));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[960px] max-h-[90vh] overflow-y-auto bg-[#0d1117] border border-[#1e2d40] p-0 gap-0">
        {/* Title bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d40]">
          <div>
            <h3 className="text-[#f0f4f8] font-bold text-lg leading-tight">{action.name}</h3>
            <p className="text-[#8da0b3] text-sm mt-0.5 flex items-center gap-2">
              {action.metadata?.isLive && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse inline-block" />
                  <span className="text-[#3b82f6] font-medium">Live</span>
                </span>
              )}
              {action.availability.userQuota === 1 ? '1 vote per user' : 'Cast your vote'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#111927] border border-[#1e2d40] flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] hover:bg-[#1e2d40] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero: 2-col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 pb-0">
          {/* Left: image with gradient overlay + title + badges */}
          <div className="relative rounded-xl overflow-hidden h-64 bg-[#111927] flex-shrink-0">
            {action.coverImage ? (
              <img src={action.coverImage} alt={action.name} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-950 to-[#0d1117]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {action.metadata?.isLive && (
                  <span className="inline-flex items-center gap-1.5 bg-[#1a3a5c]/80 border border-[#3b82f6] text-[#60a5fa] text-xs px-2.5 py-0.5 rounded-md font-medium backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse inline-block" />
                    Live vote
                  </span>
                )}
                {action.availability.userQuota === 1 && (
                  <span className="bg-black/50 text-white/70 text-xs px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                    1 vote per user
                  </span>
                )}
                {action.metadata?.closesAt && (
                  <span className="bg-black/50 text-white/70 text-xs px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                    Final closes at {action.metadata.closesAt}
                  </span>
                )}
              </div>
              <h2 className="text-[#f0f4f8] font-bold text-xl leading-tight drop-shadow">{action.name}</h2>
            </div>
          </div>

          {/* Right: description + quick-pick pills + search + filter tabs */}
          <div className="flex flex-col gap-4">
            {(action.description || action.shortDescription) && (
              <p className="text-[#8da0b3] text-sm leading-relaxed">
                {action.description || action.shortDescription}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#1e2d40] bg-[#111927] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="Grid view"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#1a3a5c] text-[#60a5fa]'
                      : 'text-[#8da0b3] hover:text-[#f0f4f8]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  aria-label="List view"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#1a3a5c] text-[#60a5fa]'
                      : 'text-[#8da0b3] hover:text-[#f0f4f8]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  List
                </button>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#4a6278]">
                <TrendingUp className="w-3.5 h-3.5" />
                Sort by votes
              </div>
            </div>

            {/* Quick-pick: 2-line pills */}
            {activeSubActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeSubActions.slice(0, 4).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border flex flex-col items-center min-w-[72px] ${
                      selectedCandidate?.id === c.id
                        ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                        : 'bg-[#111927] border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                    }`}
                  >
                    <span>{c.name}</span>
                    {c.metadata?.candidateNumber && (
                      <span className="opacity-60 text-[10px] font-normal mt-0.5">#{c.metadata.candidateNumber}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6278]" />
              <label className="sr-only" htmlFor="vote-candidate-search">
                Search candidates
              </label>
              <input
                id="vote-candidate-search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidate..."
                className="w-full bg-[#0d1525] border border-[#1e2d40] rounded-lg pl-9 pr-4 py-2 text-[#f0f4f8] text-sm placeholder:text-[#4a6278] outline-none focus:border-[#3b82f6] transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'inactive'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors border ${
                    filter === f
                      ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                      : 'bg-[#111927] border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {voteSortOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={sortMode === option.value}
                  title={option.description}
                  onClick={() => setSortMode(option.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                    sortMode === option.value
                      ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                      : 'bg-[#111927] border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                  }`}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  {option.label}
                </button>
              ))}
            </div>

            {pinnedCandidates.length > 0 && (
              <div className="rounded-2xl border border-[#1e2d40] bg-[#0d1525] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[#f0f4f8] text-sm font-semibold">Pinned comparison</p>
                    <p className="text-[#4a6278] text-xs">Compare up to 3 candidates side by side</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPinnedCandidateIds([])}
                    className="text-xs text-[#8da0b3] hover:text-[#f0f4f8] transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {pinnedCandidates.map(candidate => {
                    const votes = candidate.metadata?.votes;
                    const rank = candidate.metadata?.rank;
                    const trend = getTrendLabel(candidate);

                    return (
                      <div key={candidate.id} className="rounded-xl border border-[#1e2d40] bg-[#111927] p-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-[#f0f4f8] text-sm font-semibold truncate">{candidate.name}</p>
                            <p className="text-[#4a6278] text-xs">{trend}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePinnedCandidate(candidate.id)}
                            className="text-[#8da0b3] hover:text-[#f0f4f8] transition-colors text-xs"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-[#0d1525] px-2 py-2">
                            <p className="text-[#4a6278] text-[10px] uppercase tracking-wide">Votes</p>
                            <p className="text-[#f0f4f8] text-sm font-bold">
                              {votes !== undefined ? Number(votes).toLocaleString() : '—'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-[#0d1525] px-2 py-2">
                            <p className="text-[#4a6278] text-[10px] uppercase tracking-wide">Rank</p>
                            <p className="text-[#f0f4f8] text-sm font-bold">{rank !== undefined ? `#${rank}` : '—'}</p>
                          </div>
                          <div className="rounded-lg bg-[#0d1525] px-2 py-2">
                            <p className="text-[#4a6278] text-[10px] uppercase tracking-wide">Trend</p>
                            <p className="text-[#f0f4f8] text-sm font-bold">{trend}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Candidate grid */}
        <div className="p-6">
          {subActionsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 text-[#4a6278] animate-spin" />
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12 bg-[#111927] rounded-xl border border-[#1e2d40]">
              <Users className="w-10 h-10 text-[#1e2d40] mx-auto mb-3" />
              <p className="text-[#4a6278] text-sm">No candidates found</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-4'}>
              {filteredCandidates.map(candidate => {
                const isSelected = selectedCandidate?.id === candidate.id;
                const votes = candidate.metadata?.votes;
                const rank = candidate.metadata?.rank;
                const zone = candidate.metadata?.zone;
                const badge = candidate.metadata?.badge;
                const candidateNum = candidate.metadata?.candidateNumber;
                const trend = getTrendLabel(candidate);
                const momentum = getVoteMomentum(candidate);
                const isPinned = pinnedCandidateIds.includes(candidate.id);
                const hasStats = votes !== undefined || rank !== undefined || zone;
                const isMoreExpanded = expandedMore[candidate.id];

                return (
                  <div
                    key={candidate.id}
                    className={`rounded-xl border overflow-hidden transition-colors ${
                      isSelected
                        ? 'bg-[#1a3a5c] border-[#3b82f6]'
                        : 'bg-[#111927] border-[#1e2d40] hover:border-[#2a3d54]'
                    }`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex items-center gap-3 p-4 pb-3">
                          <div className="relative w-[72px] h-[72px] rounded-full border-2 border-[#1e2d40] overflow-hidden flex-shrink-0 bg-[#0d1525]">
                            {candidate.coverImage || candidate.images?.length ? (
                              <img
                                src={candidate.coverImage || candidate.images![0]}
                                alt={candidate.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="w-7 h-7 text-[#4a6278]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-[#f0f4f8] font-bold truncate">{candidate.name}</h4>
                              <button
                                type="button"
                                onClick={() => togglePinnedCandidate(candidate.id)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded-md border transition-colors ${
                                  isPinned
                                    ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                                    : 'bg-transparent border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                                }`}
                              >
                                {isPinned ? 'Pinned' : 'Pin'}
                              </button>
                            </div>
                            {candidateNum && (
                              <p className="text-[#4a6278] text-xs mt-0.5">Candidate #{candidateNum}</p>
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {badge && (
                                <span className="inline-block bg-[#1a2c3d] text-[#5b8aaa] rounded-md px-2 py-0.5 text-xs">
                                  {badge}
                                </span>
                              )}
                              <span className="inline-block bg-[#16283a] text-[#7fb0ff] rounded-md px-2 py-0.5 text-xs">
                                {trend}
                              </span>
                              <SocialLinksRow links={candidate.metadata?.socialLinks} />
                            </div>
                          </div>
                        </div>

                        {candidate.description && (
                          <p className="text-[#8da0b3] text-sm px-4 pb-3 leading-relaxed">{candidate.description}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-4 p-4">
                          <div className="w-[72px] h-[72px] rounded-2xl border border-[#1e2d40] overflow-hidden flex-shrink-0 bg-[#0d1525]">
                            <ImageCarousel
                              images={[candidate.coverImage, ...(candidate.images ?? [])]}
                              alt={candidate.name}
                              className="w-full h-full"
                              compact
                              fallback={
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users className="w-8 h-8 text-[#4a6278]" />
                                </div>
                              }
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-[#f0f4f8] font-bold text-base truncate">{candidate.name}</h4>
                                  {candidateNum && (
                                    <span className="text-[#4a6278] text-xs">Candidate #{candidateNum}</span>
                                  )}
                                  <SocialLinksRow links={candidate.metadata?.socialLinks} />
                                </div>
                                {candidate.description && (
                                  <p className="text-[#8da0b3] text-sm leading-relaxed mt-1">{candidate.description}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => togglePinnedCandidate(candidate.id)}
                                className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md border transition-colors ${
                                  isPinned
                                    ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                                    : 'bg-transparent border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                                }`}
                              >
                                {isPinned ? 'Pinned' : 'Pin'}
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {badge && (
                                <span className="inline-block bg-[#1a2c3d] text-[#5b8aaa] rounded-md px-2 py-0.5 text-xs">
                                  {badge}
                                </span>
                              )}
                              <span className="inline-block bg-[#16283a] text-[#7fb0ff] rounded-md px-2 py-0.5 text-xs">
                                {trend}
                              </span>
                              <span className="inline-block bg-[#0d1525] border border-[#1e2d40] text-[#8da0b3] rounded-md px-2 py-0.5 text-xs">
                                {momentum.toFixed(1)}/hr
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 border-t border-[#1e2d40] bg-[#0d1525]">
                          <div className="px-3 py-2 text-center border-r border-[#1e2d40]">
                            <p className="text-[#4a6278] text-[10px] uppercase tracking-wide mb-0.5">Votes</p>
                            <p className="text-[#f0f4f8] text-sm font-bold">
                              {votes !== undefined ? Number(votes).toLocaleString() : '—'}
                            </p>
                          </div>
                          <div className="px-3 py-2 text-center border-r border-[#1e2d40]">
                            <p className="text-[#4a6278] text-[10px] uppercase tracking-wide mb-0.5">Rank</p>
                            <p className="text-[#f0f4f8] text-sm font-bold">{rank !== undefined ? `#${rank}` : '—'}</p>
                          </div>
                          <div className="px-3 py-2 text-center">
                            <p className="text-[#4a6278] text-[10px] uppercase tracking-wide mb-0.5">Trend</p>
                            <p className="text-[#f0f4f8] text-sm font-bold">{trend}</p>
                          </div>
                        </div>
                      </>
                    )}

                    {candidate.dedicatedQrCodeData && (
                      <div className="mx-4 mb-3 bg-[#0d1525] border border-[#1e2d40] rounded-xl p-4 flex items-center gap-4">
                        <div className="bg-white rounded-lg p-2 flex-shrink-0">
                          <img src={candidate.dedicatedQrCodeData} alt="QR" className="w-16 h-16 block" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <QrCode className="w-4 h-4 text-[#3b82f6]" />
                            <span className="text-[#f0f4f8] text-sm font-semibold">Your QR Code</span>
                          </div>
                          <p className="text-[#4a6278] text-xs mb-2">Share QR code</p>
                          <a
                            href={`/action/${action.id}/subactions/${candidate.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3a5c] border border-[#3b82f6] text-[#60a5fa] text-xs font-semibold rounded-lg hover:bg-[#1e4a72] transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open link
                          </a>
                        </div>
                      </div>
                    )}

                    {hasStats && (
                      <div className="mx-4 mb-3 bg-[#0d1525] rounded-lg flex overflow-hidden">
                        <div className="flex-1 p-2.5 text-center border-r border-[#1e2d40]">
                          <p className="text-[#4a6278] text-xs mb-0.5">Votes now</p>
                          <p className="text-[#f0f4f8] font-bold text-sm">
                            {votes !== undefined ? Number(votes).toLocaleString() : '—'}
                          </p>
                        </div>
                        <div className="flex-1 p-2.5 text-center border-r border-[#1e2d40]">
                          <p className="text-[#4a6278] text-xs mb-0.5">Rank</p>
                          <p className="text-[#f0f4f8] font-bold text-sm">
                            {rank !== undefined ? `#${rank}` : '—'}
                          </p>
                        </div>
                        <div className="flex-1 p-2.5 text-center">
                          <p className="text-[#4a6278] text-xs mb-0.5">Zone</p>
                          <p className="text-[#f0f4f8] font-bold text-xs truncate">{zone || '—'}</p>
                        </div>
                      </div>
                    )}

                    {purchaseError[candidate.id] && (
                      <div className="mx-4 mb-3 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs">
                        {purchaseError[candidate.id]}
                      </div>
                    )}

                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        type="button"
                        onClick={() => handleSelect(candidate)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                          isSelected
                            ? 'border-[#3b82f6] text-[#60a5fa] bg-[#1a3a5c]'
                            : 'border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#2a3d54]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVote(candidate)}
                        disabled={purchasing[candidate.id]}
                        className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        {purchasing[candidate.id] ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Voting...
                          </>
                        ) : (
                          'Vote now'
                        )}
                      </button>
                    </div>

                    {/* More about this candidate */}
                    <button
                      type="button"
                      onClick={() => setExpandedMore(prev => ({ ...prev, [candidate.id]: !prev[candidate.id] }))}
                      className="w-full text-left px-4 py-3 border-t border-[#1e2d40] hover:bg-[#0d1525] transition-colors"
                    >
                      <p className="text-[#f0f4f8] text-sm font-semibold">
                        {isMoreExpanded ? 'Hide details' : 'More about this candidate'}
                      </p>
                    </button>
                    {isMoreExpanded && (
                      <div className="px-4 pb-4">
                        <p className="text-[#8da0b3] text-sm leading-relaxed">
                          {candidate.metadata?.extendedDescription ||
                            'View more photos, presentation details, background and performance information before confirming your vote.'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        {selectedCandidate && (
          <div className="sticky bottom-0 bg-[#0f1924] border-t border-[#1e2d40] px-6 py-4">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[#4a6278] text-xs">Current vote selection</p>
                  <p className="text-[#f0f4f8] font-bold text-sm">{selectedCandidate.name}</p>
                </div>
                <p className="text-[#8da0b3] text-xs leading-relaxed">
                  You are about to vote for this candidate. The system can handle the next step automatically depending on your QC account state.
                </p>
              </div>
              <button
                onClick={() => handleVote(selectedCandidate)}
                disabled={purchasing[selectedCandidate.id]}
                className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 rounded-xl text-white font-bold text-sm transition-colors flex items-center gap-2 flex-shrink-0"
              >
                {purchasing[selectedCandidate.id] ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Voting...
                  </>
                ) : (
                  'Vote'
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
