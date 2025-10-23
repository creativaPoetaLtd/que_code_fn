"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Label from "@/components/ui/Label";
import { AlertCircle, Loader2, Mail, MessageSquare } from "lucide-react";
import { useAuthToken } from "@/hooks/use-auth-token";
import { requestPinReset, confirmPinReset } from "@/helpers/api";

interface PinResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const PinResetModal: React.FC<PinResetModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { getToken } = useAuthToken();
  const [step, setStep] = useState<'method' | 'verify' | 'new-pin'>('method');
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');
  const [resetToken, setResetToken] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestReset = async () => {
    setLoading(true);
    setError("");

    try {
      await requestPinReset(verificationMethod);
      setStep('verify');
    } catch (err: any) {
      console.error("PIN reset request error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to send reset code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setLoading(true);
    try {
      await confirmPinReset(resetToken, newPin);
      onOpenChange(false);
      setStep('method');
      setResetToken("");
      setNewPin("");
      setConfirmPin("");
      onSuccess?.();
    } catch (err: any) {
      console.error("PIN reset confirmation error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to reset PIN. Please check your reset code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setStep('method');
      setResetToken("");
      setNewPin("");
      setConfirmPin("");
      setError("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'method' && 'Reset Your PIN'}
            {step === 'verify' && 'Enter Reset Code'}
            {step === 'new-pin' && 'Set New PIN'}
          </DialogTitle>
          <DialogDescription>
            {step === 'method' && 'Choose how to receive your PIN reset code'}
            {step === 'verify' && `Enter the reset code sent to your ${verificationMethod}`}
            {step === 'new-pin' && 'Create your new 4-digit PIN'}
          </DialogDescription>
        </DialogHeader>

        {step === 'method' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <button
                onClick={() => setVerificationMethod('email')}
                className={`w-full p-4 border rounded-lg text-left transition ${
                  verificationMethod === 'email'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-gray-500">Receive code via email</p>
                  </div>
                </div>
              </button>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleRequestReset} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Code
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={(e) => { e.preventDefault(); setStep('new-pin'); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetToken">Reset Code</Label>
              <Input
                id="resetToken"
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter the code you received"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('method')}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" disabled={!resetToken || loading}>
                Continue
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'new-pin' && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPin">New PIN (4 digits)</Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={newPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setNewPin(value);
                }}
                placeholder="0000"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPin">Confirm New PIN</Label>
              <Input
                id="confirmNewPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setConfirmPin(value);
                }}
                placeholder="0000"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('verify')}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset PIN
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};