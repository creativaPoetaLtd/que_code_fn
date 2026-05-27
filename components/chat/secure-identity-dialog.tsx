"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchSecureDeviceIdentitySummaries } from "@/services/secureChatService";

type IdentitySummary = Awaited<ReturnType<typeof fetchSecureDeviceIdentitySummaries>>[number];

const formatFingerprint = (fingerprint: string) =>
  fingerprint
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 48)
    .match(/.{1,4}/g)
    ?.join(" ")
    .toUpperCase() || fingerprint;

interface SecureIdentityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string | null;
  contactUserId: string | null;
  contactName: string;
}

export default function SecureIdentityDialog({
  open,
  onOpenChange,
  token,
  contactUserId,
  contactName,
}: SecureIdentityDialogProps) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<IdentitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token || !contactUserId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchSecureDeviceIdentitySummaries({ token, userId: contactUserId })
      .then((result) => {
        if (!cancelled) setDevices(result);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Unable to load secure identities");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, token, contactUserId]);

  const fullFingerprint = useMemo(
    () => devices.map((device) => `${device.deviceId}:${device.fingerprint}`).join("\n"),
    [devices],
  );

  const copyFingerprints = async () => {
    await navigator.clipboard.writeText(fullFingerprint);
    toast({
      title: "Copied",
      description: "Security fingerprints copied to clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={18} />
            Verify security
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{contactName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Compare these device fingerprints with your contact through another trusted channel.
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 rounded-md border border-gray-200 p-3 text-sm text-gray-600 dark:border-darkBorder-light dark:text-gray-300">
              <Loader2 size={16} className="animate-spin" />
              Loading secure devices
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
              <ShieldAlert size={16} className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && devices.length === 0 && (
            <div className="rounded-md border border-gray-200 p-3 text-sm text-gray-600 dark:border-darkBorder-light dark:text-gray-300">
              No secure devices are currently available for this contact.
            </div>
          )}

          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className="rounded-md border border-gray-200 p-3 dark:border-darkBorder-light"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {device.deviceName}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {device.platform}
                    </p>
                  </div>
                  <Badge variant="secondary">{device.availableOneTimePreKeys} keys</Badge>
                </div>
                <code className="block break-words rounded bg-gray-50 p-2 text-xs leading-5 text-gray-700 dark:bg-darkBg-interactive dark:text-gray-200">
                  {formatFingerprint(device.fingerprint)}
                </code>
              </div>
            ))}
          </div>

          {devices.length > 0 && (
            <Button variant="outline" className="w-full" onClick={copyFingerprints}>
              <Copy size={14} className="mr-2" />
              Copy fingerprints
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
