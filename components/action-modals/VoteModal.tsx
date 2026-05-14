'use client';
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Search, Users, X } from 'lucide-react';
import { ModalProps, SubAction } from './types';

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
  const [filter, setFilter] = useState<'all' | 'top' | 'new'>('all');

  const activeSubActions = useMemo(
    () => subActions.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [subActions]
  );

  const filteredCandidates = useMemo(() => {
    let list = activeSubActions;
    if (searchQuery) {
      list = list.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filter === 'top') {
      list = [...list].sort((a, b) => (b.metadata?.votes || 0) - (a.metadata?.votes || 0));
    }
    return list;
  }, [activeSubActions, searchQuery, filter]);

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
          <div className="rounded-xl overflow-hidden h-64 bg-[#111927] flex-shrink-0">
            {action.coverImage ? (
              <img src={action.coverImage} alt={action.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Users className="w-16 h-16 text-[#1e2d40]" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {(action.description || action.shortDescription) && (
              <p className="text-[#8da0b3] text-sm leading-relaxed">
                {action.description || action.shortDescription}
              </p>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a6278]" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidate..."
                className="w-full bg-[#0d1525] border border-[#1e2d40] rounded-lg pl-9 pr-4 py-2 text-[#f0f4f8] text-sm placeholder:text-[#4a6278] outline-none focus:border-[#3b82f6] transition-colors"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'top', 'new'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    filter === f
                      ? 'bg-[#1a3a5c] border border-[#3b82f6] text-[#60a5fa]'
                      : 'bg-[#111927] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'top' ? 'Top' : 'New'}
                </button>
              ))}
            </div>

            {action.metadata?.closesAt && (
              <p className="text-[#4a6278] text-xs">Closes at {action.metadata.closesAt}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCandidates.map(candidate => {
                const isSelected = selectedCandidate?.id === candidate.id;
                const votes = candidate.metadata?.votes;
                const rank = candidate.metadata?.rank;
                const zone = candidate.metadata?.zone;
                const badge = candidate.metadata?.badge;
                const candidateNum = candidate.metadata?.candidateNumber;
                const hasStats = votes !== undefined || rank !== undefined || zone;

                return (
                  <div
                    key={candidate.id}
                    className={`rounded-xl border overflow-hidden transition-colors ${
                      isSelected
                        ? 'bg-[#1a3a5c] border-[#3b82f6]'
                        : 'bg-[#111927] border-[#1e2d40] hover:border-[#2a3d54]'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-4 pb-3">
                      <div className="w-[72px] h-[72px] rounded-full border-2 border-[#1e2d40] overflow-hidden flex-shrink-0 bg-[#0d1525]">
                        {candidate.coverImage ? (
                          <img
                            src={candidate.coverImage}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[#f0f4f8] font-bold">{candidate.name}</h4>
                          {candidateNum && (
                            <span className="bg-[#1a2c3d] text-[#5b8aaa] rounded-md px-2 py-0.5 text-xs">
                              #{candidateNum}
                            </span>
                          )}
                        </div>
                        {badge && (
                          <span className="inline-block bg-[#1a2c3d] text-[#5b8aaa] rounded-md px-2 py-0.5 text-xs mt-1">
                            {badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {candidate.description && (
                      <p className="text-[#8da0b3] text-xs px-4 pb-3 leading-relaxed">
                        {candidate.description}
                      </p>
                    )}

                    {hasStats && (
                      <div className="mx-4 mb-3 bg-[#0d1525] rounded-lg flex overflow-hidden">
                        <div className="flex-1 p-2.5 text-center border-r border-[#1e2d40]">
                          <p className="text-[#4a6278] text-xs mb-0.5">Votes</p>
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
                        onClick={() => handleSelect(candidate)}
                        className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                          isSelected
                            ? 'border-[#3b82f6] text-[#60a5fa] bg-[#1a3a5c]'
                            : 'border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#2a3d54]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                      <button
                        onClick={() => handleVote(candidate)}
                        disabled={purchasing[candidate.id]}
                        className="flex-1 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        {selectedCandidate && (
          <div className="sticky bottom-0 bg-[#0f1924] border-t border-[#1e2d40] px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[#4a6278] text-xs">Current selection</p>
              <p className="text-[#f0f4f8] font-bold text-sm mt-0.5">{selectedCandidate.name}</p>
            </div>
            <button
              onClick={() => handleVote(selectedCandidate)}
              disabled={purchasing[selectedCandidate.id]}
              className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 rounded-lg text-white font-bold text-sm transition-colors flex items-center gap-2"
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
        )}
      </DialogContent>
    </Dialog>
  );
}
