'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Ticket, ChevronDown, ChevronUp, QrCode, X } from 'lucide-react';
import { ModalProps, SubAction } from './types';

export function TicketModal({
  action,
  subActions,
  subActionsLoading,
  isOpen,
  onClose,
  purchaseData,
  purchasing,
  purchaseError,
  onPurchase,
  onUpdateQuantity,
  renderBuyerField,
  formatPrice,
  currentUserId,
  userId,
  isLoggedInAsOrganization,
}: ModalProps) {
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const activeSubActions = subActions
    .filter(s => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const toggleDetails = (id: string) =>
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));

  const adjustQuantity = (subAction: SubAction, delta: number) => {
    const current = purchaseData[subAction.id]?.quantity || 0;
    const quota = action.availability.userQuota;
    const stock = subAction.stock !== null ? subAction.stock : null;
    const max = quota && stock !== null ? Math.min(quota, stock) : quota || stock || 999;
    const next = Math.max(0, Math.min(current + delta, max));
    onUpdateQuantity(subAction.id, next);
  };

  const totalSelected = activeSubActions.reduce(
    (sum, s) => sum + (purchaseData[s.id]?.quantity || 0),
    0
  );
  const totalPrice = activeSubActions.reduce((sum, s) => {
    const qty = purchaseData[s.id]?.quantity || 0;
    return sum + qty * parseFloat(s.price || '0');
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[960px] max-h-[90vh] overflow-y-auto bg-[#0d1117] border border-[#1e2d40] p-0 gap-0">
        {/* Title bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d40]">
          <div>
            <h3 className="text-[#f0f4f8] font-bold text-lg leading-tight">{action.name}</h3>
            <p className="text-[#8da0b3] text-sm mt-0.5">Select your ticket category</p>
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
                <Ticket className="w-16 h-16 text-[#1e2d40]" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[#f0f4f8] font-bold text-2xl leading-tight">{action.name}</h2>

            <div className="flex flex-wrap gap-2">
              {action.metadata?.schedule && (
                <span className="bg-[#1a2c3d] text-[#5b8aaa] rounded-md px-2.5 py-0.5 text-xs font-medium">
                  {action.metadata.schedule}
                </span>
              )}
              {action.metadata?.venue && (
                <span className="bg-[#1a2c3d] text-[#5b8aaa] rounded-md px-2.5 py-0.5 text-xs font-medium">
                  {action.metadata.venue}
                </span>
              )}
              {action.metadata?.accessMode && (
                <span className="bg-[#1a3a5c] border border-[#3b82f6] text-[#60a5fa] rounded-md px-2.5 py-0.5 text-xs font-medium">
                  {action.metadata.accessMode}
                </span>
              )}
            </div>

            {(action.description || action.shortDescription) && (
              <p className="text-[#8da0b3] text-sm leading-relaxed">
                {action.description || action.shortDescription}
              </p>
            )}

            {action.metadata?.features && Array.isArray(action.metadata.features) && (
              <ul className="space-y-1.5">
                {action.metadata.features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[#7a95ad] text-sm">
                    <span className="text-[#3b82f6] mt-0.5 flex-shrink-0">·</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Ticket cards */}
        <div className="p-6">
          {subActionsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 text-[#4a6278] animate-spin" />
            </div>
          ) : activeSubActions.length === 0 ? (
            <div className="text-center py-12 bg-[#111927] rounded-xl border border-[#1e2d40]">
              <Ticket className="w-10 h-10 text-[#1e2d40] mx-auto mb-3" />
              <p className="text-[#4a6278] text-sm">No ticket categories available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeSubActions.map(subAction => {
                const qty = purchaseData[subAction.id]?.quantity || 0;
                const highlights: string[] =
                  subAction.metadata?.highlights || subAction.metadata?.benefits || [];
                const accessLabel = subAction.metadata?.accessLabel;
                const quota = action.availability.userQuota;
                const stock = subAction.stock !== null ? subAction.stock : null;
                const max = quota && stock !== null ? Math.min(quota, stock) : quota || stock;

                return (
                  <div
                    id={`ticket-card-${subAction.id}`}
                    key={subAction.id}
                    className={`rounded-xl border overflow-hidden transition-colors ${
                      qty > 0 ? 'bg-[#111927] border-[#3b82f6]' : 'bg-[#111927] border-[#1e2d40] hover:border-[#2a3d54]'
                    }`}
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
                        <span className="text-[#3b82f6] font-bold text-xl flex-shrink-0">
                          {formatPrice(subAction.price, action.currency)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {accessLabel && (
                          <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2 py-0.5 rounded-md">
                            {accessLabel}
                          </span>
                        )}
                        {stock !== null && (
                          <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2 py-0.5 rounded-md">
                            {stock} left
                          </span>
                        )}
                        {max && (
                          <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2 py-0.5 rounded-md capitalize">
                            max {max} per user
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

                      {subAction.dedicatedQrCodeData && (
                        <div className="bg-[#0d1525] border border-[#1e2d40] rounded-xl p-4 mb-4 flex items-center gap-4">
                          <div className="bg-white rounded-lg p-2">
                            <img src={subAction.dedicatedQrCodeData} alt="QR Code" className="w-16 h-16" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <QrCode className="w-4 h-4 text-[#3b82f6]" />
                              <span className="text-[#f0f4f8] text-sm font-semibold">Your QR Code</span>
                            </div>
                            <p className="text-[#4a6278] text-xs">Show this at the entry gate</p>
                          </div>
                        </div>
                      )}

                      {subAction.wallet && currentUserId === userId && isLoggedInAsOrganization && (
                        <div className="bg-[#1a3a5c]/30 border border-[#3b82f6]/30 rounded-lg px-3 py-2 mb-4 text-xs text-[#60a5fa] font-semibold">
                          Wallet: {subAction.wallet.currency} {subAction.wallet.balance.toLocaleString()}
                        </div>
                      )}

                      {/* Quantity with round buttons */}
                      <div className="mb-4">
                        <label className="text-[#4a6278] text-xs font-semibold mb-2 block">Quantity</label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustQuantity(subAction, -1)}
                            disabled={qty <= 0}
                            className="w-8 h-8 rounded-full bg-[#111927] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#2a3d54] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-bold text-base"
                          >
                            −
                          </button>
                          <span className="text-[#f0f4f8] font-bold text-base w-6 text-center">{qty}</span>
                          <button
                            onClick={() => adjustQuantity(subAction, 1)}
                            disabled={max !== null && max !== undefined && qty >= max}
                            className="w-8 h-8 rounded-full bg-[#111927] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#2a3d54] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-bold text-base"
                          >
                            +
                          </button>
                          {max && (
                            <span className="text-[#4a6278] text-xs">max {max}</span>
                          )}
                        </div>
                      </div>

                      {qty > 0 && (
                        <div className="bg-[#0d1525] border border-[#1e2d40] rounded-xl p-4 space-y-3 mb-4">
                          <p className="text-[#4a6278] text-xs font-semibold">Buyer information</p>
                          {(action.buyerFields?.length > 0
                            ? action.buyerFields
                            : ['fullName', 'email', 'phone']
                          ).map(field =>
                            renderBuyerField(
                              field,
                              subAction.id,
                              purchaseData[subAction.id]?.buyerData?.[field] || '',
                              field !== 'notes'
                            )
                          )}
                        </div>
                      )}

                      {purchaseError[subAction.id] && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs mb-4">
                          {purchaseError[subAction.id]}
                        </div>
                      )}

                      <button
                        onClick={() => onPurchase(subAction)}
                        disabled={qty <= 0 || purchasing[subAction.id]}
                        className="w-full py-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        {purchasing[subAction.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Buy now'
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => toggleDetails(subAction.id)}
                      className="w-full flex items-center justify-between px-5 py-3 text-[#4a6278] text-xs border-t border-[#1e2d40] hover:bg-[#111927] transition-colors"
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
                            <span className="text-[#8da0b3] font-semibold">Refund:</span> {action.policy.refund}
                          </p>
                        )}
                        {action.policy.cancellation && (
                          <p className="text-[#4a6278] text-xs">
                            <span className="text-[#8da0b3] font-semibold">Cancellation:</span>{' '}
                            {action.policy.cancellation}
                          </p>
                        )}
                        {action.fulfillment.postPurchaseMessage && (
                          <p className="text-[#4a6278] text-xs">
                            <span className="text-[#8da0b3] font-semibold">Note:</span>{' '}
                            {action.fulfillment.postPurchaseMessage}
                          </p>
                        )}
                        {!action.policy.refund &&
                          !action.policy.cancellation &&
                          !action.fulfillment.postPurchaseMessage && (
                            <p className="text-[#4a6278] text-xs">No additional details provided.</p>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Event info footer */}
          {(action.metadata?.eventType ||
            action.metadata?.accessMode ||
            action.metadata?.paymentMethod ||
            action.metadata?.refundPolicy) && (
            <div className="grid grid-cols-2 gap-px bg-[#1e2d40] rounded-xl overflow-hidden mt-4">
              {action.metadata?.eventType && (
                <div className="bg-[#0d1117] p-4">
                  <p className="text-[#4a6278] text-xs mb-1">Event type</p>
                  <p className="text-[#f0f4f8] font-semibold text-sm">{action.metadata.eventType}</p>
                </div>
              )}
              {action.metadata?.accessMode && (
                <div className="bg-[#0d1117] p-4">
                  <p className="text-[#4a6278] text-xs mb-1">Access mode</p>
                  <p className="text-[#f0f4f8] font-semibold text-sm">{action.metadata.accessMode}</p>
                </div>
              )}
              {action.metadata?.paymentMethod && (
                <div className="bg-[#0d1117] p-4">
                  <p className="text-[#4a6278] text-xs mb-1">Payment</p>
                  <p className="text-[#f0f4f8] font-semibold text-sm">{action.metadata.paymentMethod}</p>
                </div>
              )}
              {action.metadata?.refundPolicy && (
                <div className="bg-[#0d1117] p-4">
                  <p className="text-[#4a6278] text-xs mb-1">Refund policy</p>
                  <p className="text-[#f0f4f8] font-semibold text-sm">{action.metadata.refundPolicy}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky checkout bar */}
        {totalSelected > 0 && (
          <div className="sticky bottom-0 bg-[#0f1924] border-t border-[#1e2d40] px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[#4a6278] text-xs">
                {totalSelected} ticket{totalSelected !== 1 ? 's' : ''} selected
              </p>
              <p className="text-[#f0f4f8] font-bold text-sm mt-0.5">
                Total {action.currency}{' '}
                {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={() => {
                const firstSelected = activeSubActions.find(
                  s => (purchaseData[s.id]?.quantity || 0) > 0
                );
                if (firstSelected) onPurchase(firstSelected);
              }}
              disabled={activeSubActions.some(s => purchasing[s.id])}
              className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 rounded-lg text-white font-bold text-sm transition-colors"
            >
              Checkout
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
