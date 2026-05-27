'use client';
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Ticket, QrCode, CreditCard, X } from 'lucide-react';
import { Input as CustomInput } from '@/components/ui/input';
import { ModalProps, SubAction } from './types';

export function DefaultModal({
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
  onUpdateBuyerData,
  renderBuyerField,
  formatDate,
  formatPrice,
  currentUserId,
  userId,
  isLoggedInAsOrganization,
}: ModalProps) {
  const activeSubActions = subActions
    .filter(s => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const ctaLabel = () => {
    switch (action.type) {
      case 'donation': return 'Donate';
      case 'subscription': return 'Subscribe';
      case 'payment':
      case 'transport': return 'Pay';
      default: return 'Purchase';
    }
  };

  const updatePurchaseQuantity = (subActionId: string, max: number | null, value: number) => {
    const clamped = max !== null && value > max ? max : value;
    onUpdateQuantity(subActionId, clamped < 0 ? 0 : clamped);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[960px] max-h-[90vh] overflow-y-auto bg-[#0d1117] border border-[#1e2d40] p-0 gap-0">
        {/* Header */}
        {action.coverImage ? (
          <div className="relative h-48 w-full overflow-hidden rounded-t-xl flex-shrink-0">
            <img src={action.coverImage} alt={action.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-[#1a2c3d] text-[#5b8aaa] rounded-md px-2.5 py-0.5 text-xs capitalize">
                  {action.type || 'action'}
                </span>
                {action.status === 'published' && (
                  <span className="bg-[#1a2c3d] text-[#5b8aaa] rounded-md px-2.5 py-0.5 text-xs">
                    Published
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-[#f0f4f8] leading-tight">
                {action.name || 'Action Details'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d40]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1a3a5c]/50 border border-[#3b82f6]/30 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-[#60a5fa]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#f0f4f8]">{action.name || 'Action Details'}</h2>
                {action.type && (
                  <p className="text-[#4a6278] text-xs capitalize">{action.type}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#111927] border border-[#1e2d40] flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] hover:bg-[#1e2d40] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Meta row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {action.availability.startsAt && (
              <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-3">
                <p className="text-[#4a6278] text-xs mb-1">Starts</p>
                <p className="text-[#f0f4f8] text-xs font-semibold">{formatDate(action.availability.startsAt)}</p>
              </div>
            )}
            {action.availability.endsAt && (
              <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-3">
                <p className="text-[#4a6278] text-xs mb-1">Ends</p>
                <p className="text-[#f0f4f8] text-xs font-semibold">{formatDate(action.availability.endsAt)}</p>
              </div>
            )}
            {action.pricing.mode && (
              <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-3">
                <p className="text-[#4a6278] text-xs mb-1">Pricing</p>
                <p className="text-[#f0f4f8] text-xs font-semibold capitalize">
                  {action.pricing.mode.replace(/_/g, ' ')}
                </p>
              </div>
            )}
            {action.currency && (
              <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-3">
                <p className="text-[#4a6278] text-xs mb-1">Currency</p>
                <p className="text-[#f0f4f8] text-xs font-semibold">{action.currency}</p>
              </div>
            )}
          </div>

          {action.description && (
            <p className="text-[#8da0b3] text-sm leading-relaxed">{action.description}</p>
          )}

          {/* Sub-actions */}
          <div>
            <h3 className="text-[#f0f4f8] font-bold text-base mb-3">Available options</h3>

            {subActionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-7 h-7 text-[#4a6278] animate-spin" />
              </div>
            ) : activeSubActions.length === 0 ? (
              <div className="text-center py-10 bg-[#111927] rounded-xl border border-[#1e2d40]">
                <Ticket className="w-10 h-10 text-[#1e2d40] mx-auto mb-3" />
                <p className="text-[#4a6278] font-medium text-sm">No options available for this action</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSubActions.map(subAction => {
                  const quota = action.availability.userQuota;
                  const stock = subAction.stock !== null ? subAction.stock : null;
                  const max = quota && stock !== null ? Math.min(quota, stock) : quota || stock;

                  return (
                    <div
                      key={subAction.id}
                      className="rounded-xl overflow-hidden border border-[#1e2d40] bg-[#111927]"
                    >
                      {subAction.coverImage && (
                        <div className="relative h-36 w-full">
                          <img
                            src={subAction.coverImage}
                            alt={subAction.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#111927]/90 to-transparent" />
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h4 className="text-[#f0f4f8] font-bold text-base">{subAction.name}</h4>
                            {subAction.description && (
                              <p className="text-[#8da0b3] text-sm mt-1">{subAction.description}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {action.pricing.mode !== 'pay_what_you_want' && (
                              <p className="text-[#3b82f6] font-bold text-lg">
                                {formatPrice(subAction.price, action.currency)}
                              </p>
                            )}
                            {subAction.stock !== null && (
                              <span className="text-[#4a6278] text-xs">{subAction.stock} left</span>
                            )}
                          </div>
                        </div>

                        {subAction.wallet && currentUserId === userId && isLoggedInAsOrganization && (
                          <div className="bg-[#1a3a5c]/30 border border-[#3b82f6]/30 rounded-lg px-3 py-2 mb-3 text-xs text-[#60a5fa] font-semibold">
                            Wallet: {subAction.wallet.currency} {subAction.wallet.balance.toLocaleString()}
                          </div>
                        )}

                        {subAction.metadata?.benefits && Array.isArray(subAction.metadata.benefits) && (
                          <div className="bg-[#0d1525] border border-[#1e2d40] rounded-lg p-3 mb-3">
                            <p className="text-[#4a6278] text-xs font-semibold mb-2">Benefits</p>
                            <ul className="space-y-1">
                              {subAction.metadata.benefits.map((b: string, i: number) => (
                                <li key={i} className="text-[#7a95ad] text-xs flex items-start gap-2">
                                  <span className="text-[#3b82f6] mt-0.5">·</span>
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {subAction.dedicatedQrCodeData && (
                          <div className="bg-[#0d1525] border border-[#1e2d40] rounded-lg p-4 mb-3 flex items-center gap-4">
                            <div className="bg-white rounded-lg p-2">
                              <img src={subAction.dedicatedQrCodeData} alt="QR Code" className="w-20 h-20" />
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

                        <div className="pt-4 border-t border-[#1e2d40] space-y-4">
                          {action.pricing.mode === 'pay_what_you_want' && (
                            <div>
                              <label className="text-[#4a6278] text-xs font-semibold mb-1.5 block">
                                Amount ({action.currency})
                              </label>
                              <CustomInput
                                type="number"
                                min="0"
                                step="0.01"
                                value={purchaseData[subAction.id]?.customAmount || ''}
                                onChange={e => {
                                  const val = e.target.value ? parseFloat(e.target.value) : 0;
                                  if (!isNaN(val) && val >= 0) {
                                    onUpdateQuantity(subAction.id, purchaseData[subAction.id]?.quantity || 1);
                                    onUpdateBuyerData(subAction.id, '__customAmount__', val.toString());
                                  }
                                }}
                                className="h-10 rounded-lg bg-[#0d1525] border-[#1e2d40] text-[#f0f4f8] placeholder:text-[#4a6278] focus:border-[#3b82f6]"
                                placeholder="Enter amount"
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-[#4a6278] text-xs font-semibold mb-1.5 flex items-center gap-2">
                              Quantity
                              {max && (
                                <span className="text-[#4a6278] font-normal">(max {max})</span>
                              )}
                            </label>
                            <div className="flex items-center gap-3">
                              <CustomInput
                                type="number"
                                min="1"
                                max={max ?? undefined}
                                value={purchaseData[subAction.id]?.quantity || ''}
                                onChange={e => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val >= 0) {
                                    updatePurchaseQuantity(subAction.id, max ?? null, val);
                                  } else if (e.target.value === '') {
                                    onUpdateQuantity(subAction.id, 0);
                                  }
                                }}
                                className="w-24 h-10 rounded-lg bg-[#0d1525] border-[#1e2d40] text-[#f0f4f8] text-center placeholder:text-[#4a6278] focus:border-[#3b82f6]"
                                placeholder="0"
                              />
                              <span className="text-[#8da0b3] text-sm">
                                ×{' '}
                                {action.pricing.mode === 'pay_what_you_want'
                                  ? formatPrice(
                                      (purchaseData[subAction.id]?.customAmount || 0).toString(),
                                      action.currency
                                    )
                                  : formatPrice(subAction.price, action.currency)}
                                {' '}={' '}
                                <span className="text-[#f0f4f8] font-bold">
                                  {purchaseData[subAction.id]?.quantity
                                    ? formatPrice(
                                        (
                                          (action.pricing.mode === 'pay_what_you_want'
                                            ? purchaseData[subAction.id]?.customAmount || 0
                                            : parseFloat(subAction.price)) *
                                          purchaseData[subAction.id].quantity
                                        ).toString(),
                                        action.currency
                                      )
                                    : formatPrice('0', action.currency)}
                                </span>
                              </span>
                            </div>
                          </div>

                          {(purchaseData[subAction.id]?.quantity || 0) > 0 && (
                            <div className="bg-[#0d1525] border border-[#1e2d40] rounded-lg p-4 space-y-3">
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
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs">
                              {purchaseError[subAction.id]}
                            </div>
                          )}

                          <button
                            onClick={() => onPurchase(subAction)}
                            disabled={
                              !purchaseData[subAction.id]?.quantity ||
                              purchaseData[subAction.id].quantity <= 0 ||
                              purchasing[subAction.id]
                            }
                            className="w-full py-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            {purchasing[subAction.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                {ctaLabel()}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
