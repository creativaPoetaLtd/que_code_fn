'use client';

import React, { useState } from 'react';
import { Check, Download, QrCode, Send, Share2, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { WalletPurchase } from '@/types/dashboard';

interface TicketQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: WalletPurchase | null;
  /** Show the transfer action (only for the owner's personal tickets) */
  canTransfer?: boolean;
  onTransfer?: () => void;
}

/**
 * Ticket-focused QR dialog. Mirrors the visual language of ShareQrDialog
 * (dark card, framed QR, segmented actions) but with ticket copy + metadata
 * instead of the vote-page wording, and no public "open page" link.
 */
const TicketQrDialog: React.FC<TicketQrDialogProps> = ({
  open,
  onOpenChange,
  purchase,
  canTransfer = false,
  onTransfer,
}) => {
  const [copied, setCopied] = useState(false);
  const qr = purchase?.qrObject;
  const name = purchase?.action?.name || 'Ticket';
  const meta = (qr?.metadata || {}) as Record<string, any>;

  const handleDownload = () => {
    if (!qr?.qrCodeData) return;
    const link = document.createElement('a');
    link.href = qr.qrCodeData;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase()}-ticket.png`;
    link.click();
  };

  const handleShare = async () => {
    const ref = purchase?.id || '';
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: `My ticket for ${name} (ref ${ref})` });
        return;
      } catch {
        /* share sheet dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const actionClass =
    'flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold whitespace-nowrap transition-colors';
  const statusColor =
    qr?.status === 'valid'
      ? 'text-emerald-400'
      : qr?.status === 'used'
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1117] border border-[#1e2d40] rounded-2xl w-[calc(100vw-2rem)] max-w-sm p-0 gap-0 overflow-hidden">
        <div className="min-w-0 px-5 py-4 border-b border-[#1e2d40]">
          <div className="flex items-center gap-2 min-w-0">
            <QrCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-[#f0f4f8] font-bold text-sm truncate">{name}</p>
          </div>
          {purchase?.subAction?.name && (
            <p className="text-[#8da0b3] text-xs mt-0.5 truncate">{purchase.subAction.name}</p>
          )}
        </div>

        <div className="min-w-0 p-5 space-y-4">
          {qr?.qrCodeData ? (
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-3 shadow-lg shadow-black/40">
                <img src={qr.qrCodeData} alt={`Ticket QR for ${name}`} className="w-44 h-44 block" />
              </div>
            </div>
          ) : (
            <p className="text-[#8da0b3] text-sm text-center py-4">
              No ticket QR was generated for this purchase.
            </p>
          )}

          <p className="text-[#8da0b3] text-xs text-center">
            Show this code at entry. {qr?.type && <span className="capitalize">{qr.type} · </span>}
            <span className={`capitalize font-semibold ${statusColor}`}>{qr?.status || 'unknown'}</span>
          </p>

          {/* Ticket metadata (seat/gate/validity) when present */}
          {(meta.seat || meta.gate || qr?.validUntil) && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {meta.seat && (
                <div className="bg-[#111927] border border-[#1e2d40] rounded-xl px-2 py-2">
                  <p className="text-[#5c6b7d] text-[10px] uppercase tracking-wide">Seat</p>
                  <p className="text-[#f0f4f8] text-xs font-semibold truncate">{meta.seat}</p>
                </div>
              )}
              {meta.gate && (
                <div className="bg-[#111927] border border-[#1e2d40] rounded-xl px-2 py-2">
                  <p className="text-[#5c6b7d] text-[10px] uppercase tracking-wide">Gate</p>
                  <p className="text-[#f0f4f8] text-xs font-semibold truncate">{meta.gate}</p>
                </div>
              )}
              {qr?.validUntil && (
                <div className="bg-[#111927] border border-[#1e2d40] rounded-xl px-2 py-2">
                  <p className="text-[#5c6b7d] text-[10px] uppercase tracking-wide">Valid to</p>
                  <p className="text-[#f0f4f8] text-xs font-semibold truncate">
                    {new Date(qr.validUntil).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 min-w-0">
            <button
              type="button"
              onClick={handleShare}
              className={`${actionClass} bg-[#111927] border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-emerald-500`}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
              ) : typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              {copied ? 'Copied' : 'Share'}
            </button>
            {qr?.qrCodeData && (
              <button
                type="button"
                onClick={handleDownload}
                className={`${actionClass} bg-[#111927] border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-emerald-500`}
              >
                <Download className="w-3.5 h-3.5 flex-shrink-0" />
                Save
              </button>
            )}
          </div>

          {canTransfer && qr?.status === 'valid' && (
            <button
              type="button"
              onClick={onTransfer}
              className={`${actionClass} w-full bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700`}
            >
              <Send className="w-3.5 h-3.5 flex-shrink-0" />
              Transfer ticket
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketQrDialog;
