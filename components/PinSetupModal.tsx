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
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuthToken } from "@/hooks/use-auth-token";
import axios from "axios";
import baseUrl from "@/helpers/baseUrl";

interface PinSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { getToken } = useAuthToken();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await axios.post(
        `${baseUrl}/users/pin/setup`,
        { pin },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        onOpenChange(false);
        setPin("");
        setConfirmPin("");
        onSuccess?.();
      } else {
        setError(response.data.message || "Failed to set up PIN");
      }
    } catch (err: any) {
      console.error("PIN setup error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to set up PIN. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setPin("");
      setConfirmPin("");
      setError("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Up Your PIN</DialogTitle>
            <DialogDescription>
              Create a 4-digit PIN to secure your account. <b>This PIN will be required for all your future transactions, including every money transfer.</b> Please choose a PIN you can remember, but keep it confidential.
            </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">Enter PIN (4 digits)</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setPin(value);
              }}
              placeholder="0000"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <Input
              id="confirmPin"
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
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || pin.length !== 4 || confirmPin.length !== 4}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set PIN
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};