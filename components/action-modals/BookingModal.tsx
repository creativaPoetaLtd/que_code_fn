'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { ModalProps, SubAction } from './types';

const PEOPLE_OPTIONS = ['1 person', '2 people', '3 people', '4 people', '5+ people'];

interface BookingState {
  selectedSlot: string;
  selectedDate: string;
  people: string;
  notes: string;
  selectedOptions: string[];
}

const defaultBookingState = (): BookingState => ({
  selectedSlot: '',
  selectedDate: '',
  people: '1 person',
  notes: '',
  selectedOptions: [],
});

export function BookingModal({
  action,
  subActions,
  subActionsLoading,
  isOpen,
  onClose,
  purchasing,
  purchaseError,
  onDirectPurchase,
}: ModalProps) {
  const [bookingState, setBookingState] = useState<Record<string, BookingState>>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const activeSubActions = subActions
    .filter(s => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const getState = (id: string): BookingState => bookingState[id] || defaultBookingState();

  const updateState = (id: string, patch: Partial<BookingState>) =>
    setBookingState(prev => ({ ...prev, [id]: { ...getState(id), ...patch } }));

  const toggleOption = (subActionId: string, option: string) => {
    const current = getState(subActionId).selectedOptions;
    updateState(subActionId, {
      selectedOptions: current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option],
    });
  };

  const toggleDetails = (id: string) =>
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));

  const handleBook = (subAction: SubAction) => {
    const state = getState(subAction.id);
    const errors: Record<string, string> = {};

    if (!state.selectedDate) errors[subAction.id] = 'Please select a preferred date.';
    else if (!state.selectedSlot) errors[subAction.id] = 'Please select a time slot.';

    if (errors[subAction.id]) {
      setLocalErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    setLocalErrors(prev => {
      const n = { ...prev };
      delete n[subAction.id];
      return n;
    });

    const peopleCount = parseInt(state.people) || 1;
    onDirectPurchase(subAction, {
      quantity: peopleCount,
      buyerData: {
        preferredDate: state.selectedDate,
        preferredTime: state.selectedSlot,
        people: state.people,
        notes: state.notes,
        options: state.selectedOptions.join(', '),
      },
    });
  };

  const hasAnythingConfigured = activeSubActions.some(s => {
    const st = getState(s.id);
    return st.selectedSlot || st.selectedDate;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[960px] max-h-[90vh] overflow-y-auto bg-[#0d1117] border border-[#1e2d40] p-0 gap-0">
        {/* Hero with title overlaid */}
        <div className="relative h-72 w-full overflow-hidden rounded-t-xl flex-shrink-0">
          {action.coverImage ? (
            <img src={action.coverImage} alt={action.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-[#0d1117]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2.5 py-0.5 rounded-md font-medium">
                Appointment booking
              </span>
              <span className="bg-[#1a3a5c] border border-[#3b82f6] text-[#60a5fa] text-xs px-2.5 py-0.5 rounded-md font-medium">
                Instant QC booking
              </span>
            </div>
            <h2 className="text-2xl font-bold text-[#f0f4f8] leading-tight">{action.name}</h2>
            {(action.description || action.shortDescription) && (
              <p className="text-[#8da0b3] text-sm mt-1.5 max-w-lg">
                {action.description || action.shortDescription}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Service cards */}
        <div className="p-6">
          {subActionsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 text-[#4a6278] animate-spin" />
            </div>
          ) : activeSubActions.length === 0 ? (
            <div className="text-center py-12 bg-[#111927] rounded-xl border border-[#1e2d40]">
              <Calendar className="w-10 h-10 text-[#1e2d40] mx-auto mb-3" />
              <p className="text-[#4a6278] text-sm">No services available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeSubActions.map(subAction => {
                const state = getState(subAction.id);
                const duration = subAction.metadata?.duration;
                const slots: string[] = subAction.metadata?.availableSlots || [];
                const locationOptions: string[] = subAction.metadata?.locationOptions || [];
                const highlights: string[] =
                  subAction.metadata?.highlights || subAction.metadata?.benefits || [];
                const maxPeople = subAction.metadata?.maxPeople;
                const category = subAction.metadata?.category;
                const stockLeft = subAction.stock !== null ? subAction.stock : null;
                const error = localErrors[subAction.id] || purchaseError[subAction.id];

                return (
                  <div
                    id={`booking-card-${subAction.id}`}
                    key={subAction.id}
                    className="rounded-xl border border-[#1e2d40] bg-[#111927] overflow-hidden hover:border-[#2a3d54] transition-colors"
                  >
                    {subAction.coverImage && (
                      <div className="relative h-32 w-full">
                        <img
                          src={subAction.coverImage}
                          alt={subAction.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#111927]/90 to-transparent" />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="text-[#f0f4f8] font-bold text-base">{subAction.name}</h4>
                          {subAction.description && (
                            <p className="text-[#8da0b3] text-xs mt-0.5">{subAction.description}</p>
                          )}
                        </div>
                        <span className="text-[#3b82f6] font-bold text-lg flex-shrink-0">
                          {action.currency}{Math.round(parseFloat(subAction.price || '0'))}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {duration && (
                          <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2 py-0.5 rounded-md">
                            {duration}
                          </span>
                        )}
                        {stockLeft !== null && (
                          <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2 py-0.5 rounded-md">
                            {stockLeft} slots left
                          </span>
                        )}
                        {locationOptions.length > 0 && (
                          <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2 py-0.5 rounded-md">
                            {locationOptions.join(' / ')}
                          </span>
                        )}
                      </div>

                      {highlights.length > 0 && (
                        <ul className="space-y-1.5 mb-4">
                          {highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-[#7a95ad] text-xs">
                              <span className="text-[#3b82f6] mt-0.5 flex-shrink-0">·</span>
                              {h}
                            </li>
                          ))}
                        </ul>
                      )}

                      {(category || duration || maxPeople) && (
                        <div className="grid grid-cols-3 gap-px bg-[#1e2d40] rounded-lg overflow-hidden mb-4">
                          {category && (
                            <div className="bg-[#0d1525] p-2.5 text-center">
                              <p className="text-[#4a6278] text-xs mb-0.5">Category</p>
                              <p className="text-[#f0f4f8] text-xs font-semibold">{category}</p>
                            </div>
                          )}
                          {duration && (
                            <div className="bg-[#0d1525] p-2.5 text-center">
                              <p className="text-[#4a6278] text-xs mb-0.5">Duration</p>
                              <p className="text-[#f0f4f8] text-xs font-semibold">{duration}</p>
                            </div>
                          )}
                          {maxPeople && (
                            <div className="bg-[#0d1525] p-2.5 text-center">
                              <p className="text-[#4a6278] text-xs mb-0.5">People</p>
                              <p className="text-[#f0f4f8] text-xs font-semibold">1 to {maxPeople}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {locationOptions.length > 0 && (
                        <div className="mb-4">
                          <label className="text-[#4a6278] text-xs font-semibold mb-2 block">Options</label>
                          <div className="flex flex-wrap gap-2">
                            {locationOptions.map(opt => (
                              <button
                                key={opt}
                                onClick={() => toggleOption(subAction.id, opt)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  state.selectedOptions.includes(opt)
                                    ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                                    : 'bg-[#0d1525] border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {slots.length > 0 && (
                        <div className="mb-4">
                          <label className="text-[#4a6278] text-xs font-semibold mb-2 block">
                            Available slots
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {slots.map(slot => (
                              <button
                                key={slot}
                                onClick={() => updateState(subAction.id, { selectedSlot: slot })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  state.selectedSlot === slot
                                    ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                                    : 'bg-[#0d1525] border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="text-[#4a6278] text-xs font-semibold mb-1.5 block">
                            Preferred date
                          </label>
                          <input
                            type="date"
                            value={state.selectedDate}
                            onChange={e => updateState(subAction.id, { selectedDate: e.target.value })}
                            className="w-full bg-[#0d1525] border border-[#1e2d40] rounded-lg px-3 py-2 text-[#f0f4f8] text-xs outline-none focus:border-[#3b82f6] transition-colors [color-scheme:dark]"
                          />
                        </div>
                        <div>
                          <label className="text-[#4a6278] text-xs font-semibold mb-1.5 block">
                            People
                          </label>
                          <select
                            value={state.people}
                            onChange={e => updateState(subAction.id, { people: e.target.value })}
                            className="w-full bg-[#0d1525] border border-[#1e2d40] rounded-lg px-3 py-2 text-[#f0f4f8] text-xs outline-none focus:border-[#3b82f6] transition-colors [color-scheme:dark]"
                          >
                            {PEOPLE_OPTIONS.slice(0, maxPeople || 5).map(opt => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="text-[#4a6278] text-xs font-semibold mb-1.5 block">Notes</label>
                        <textarea
                          value={state.notes}
                          onChange={e => updateState(subAction.id, { notes: e.target.value })}
                          placeholder="Add details for this booking..."
                          rows={3}
                          className="w-full bg-[#0d1525] border border-[#1e2d40] rounded-lg px-3 py-2 text-[#f0f4f8] text-xs placeholder:text-[#4a6278] outline-none focus:border-[#3b82f6] transition-colors resize-none"
                        />
                      </div>

                      {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs mb-4">
                          {error}
                        </div>
                      )}

                      <button
                        onClick={() => handleBook(subAction)}
                        disabled={purchasing[subAction.id]}
                        className="w-full py-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        {purchasing[subAction.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Booking...
                          </>
                        ) : (
                          'Book now'
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => toggleDetails(subAction.id)}
                      className="w-full flex items-center justify-between px-5 py-3 text-[#4a6278] text-xs border-t border-[#1e2d40] hover:bg-[#0d1525] transition-colors"
                    >
                      <span>Included details &amp; conditions</span>
                      {expandedDetails[subAction.id] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedDetails[subAction.id] && (
                      <div className="px-5 pb-4 space-y-1.5">
                        {action.policy.refund && (
                          <p className="text-[#4a6278] text-xs">
                            <span className="text-[#8da0b3] font-semibold">Refund:</span>{' '}
                            {action.policy.refund}
                          </p>
                        )}
                        {action.policy.cancellation && (
                          <p className="text-[#4a6278] text-xs">
                            <span className="text-[#8da0b3] font-semibold">Cancellation:</span>{' '}
                            {action.policy.cancellation}
                          </p>
                        )}
                        {!action.policy.refund && !action.policy.cancellation && (
                          <p className="text-[#4a6278] text-xs">No additional details provided.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky booking summary footer */}
        {hasAnythingConfigured && (
          <div className="sticky bottom-0 bg-[#0f1924] border-t border-[#1e2d40] px-6 py-4">
            {(() => {
              const configured = activeSubActions.filter(s => {
                const st = getState(s.id);
                return st.selectedDate || st.selectedSlot;
              });
              const first = configured[0];
              if (!first) return null;
              const st = getState(first.id);
              return (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[#4a6278] text-xs">
                      {first.name}
                      {st.selectedSlot && ` · ${st.selectedSlot}`}
                      {` · ${st.people}`}
                    </p>
                    <p className="text-[#f0f4f8] font-bold text-sm mt-0.5">
                      {action.currency}{Math.round(parseFloat(first.price || '0'))}
                    </p>
                  </div>
                  <button
                    onClick={() => handleBook(first)}
                    disabled={purchasing[first.id]}
                    className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 rounded-lg text-white font-bold text-sm transition-colors flex items-center gap-2"
                  >
                    {purchasing[first.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Book'
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
