import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, CheckCircle, AlertCircle, Smartphone, Globe, RotateCw, ShieldOff } from "lucide-react";
import Input from "@/components/ui/Input-ant";
import { Label } from "@/components/ui/label";
import { useSecuritySettings } from "@/hooks/use-security-settings";
import { LoadingSpinner } from "./shared";

export const SecurityTab: React.FC = () => {
  const {
    pinStatus,
    loadingPinStatus,
    changingPin,
    secureDevices,
    loadingSecureDevices,
    revokingSecureDeviceId,
    currentSecureDeviceId,
    securityFormData,
    updateSecurityFormData,
    handleChangePassword,
    handleChangePin,
    fetchSecureDevices,
    handleRevokeSecureDevice,
    togglePasswordVisibility,
    toggleCurrentPinVisibility,
    toggleNewPinVisibility,
  } = useSecuritySettings();

  const onPasswordChange = () => {
    handleChangePassword();
  };

  const onPinChange = async () => {
    await handleChangePin();
  };

  const handleNumericInput = (value: string, field: "currentPin" | "newPin" | "confirmNewPin") => {
    const numericValue = value.replace(/\D/g, "");
    updateSecurityFormData({ [field]: numericValue });
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "Never synced";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
        <CardHeader>
          <CardTitle className="dark:text-white">PIN Status</CardTitle>
          <CardDescription className="dark:text-gray-400">Your transaction PIN security status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPinStatus ? (
            <LoadingSpinner size="sm" text="Loading PIN status..." />
          ) : pinStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-gray-300">PIN Setup:</span>
                <div className="flex items-center space-x-2">
                  {pinStatus.hasPin ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-600 dark:text-green-400">Set up</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm text-red-600 dark:text-red-400">Not set up</span>
                    </>
                  )}
                </div>
              </div>

              {pinStatus.isLocked && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-gray-300">Status:</span>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-600 dark:text-red-400">Locked</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-gray-300">Attempts Left:</span>
                <span className={`text-sm font-medium ${
                  pinStatus.attemptsLeft <= 1 ? "text-red-600 dark:text-red-400" :
                  pinStatus.attemptsLeft <= 2 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
                }`}>
                  {pinStatus.attemptsLeft}/5
                </span>
              </div>

              {pinStatus.lockedUntil && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>PIN Locked:</strong> Too many failed attempts.
                    Try again after {pinStatus.lockedUntil.toLocaleTimeString()}.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Unable to load PIN status
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
        <CardHeader>
          <CardTitle className="dark:text-white">Change Password</CardTitle>
          <CardDescription className="dark:text-gray-400">Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="dark:text-gray-300">Current password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={securityFormData.showPassword ? "text" : "password"}
                value={securityFormData.currentPassword}
                onChange={(event) => updateSecurityFormData({ currentPassword: event.target.value })}
                className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-transparent"
                onClick={togglePasswordVisibility}
                type="button"
              >
                {securityFormData.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="dark:text-gray-300">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={securityFormData.newPassword}
              onChange={(event) => updateSecurityFormData({ newPassword: event.target.value })}
              className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="dark:text-gray-300">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={securityFormData.confirmPassword}
              onChange={(event) => updateSecurityFormData({ confirmPassword: event.target.value })}
              className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
            />
          </div>
        </CardContent>
        <CardFooter className="dark:border-t dark:border-darkBorder-light">
          <Button
            onClick={onPasswordChange}
            className="bg-[#00B512] hover:bg-[#009E10] dark:bg-brand-gold dark:hover:bg-brand-goldHover text-white dark:text-[#00313A]"
            disabled={!securityFormData.currentPassword || !securityFormData.newPassword || !securityFormData.confirmPassword}
          >
            Update password
          </Button>
        </CardFooter>
      </Card>

      <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
        <CardHeader>
          <CardTitle className="dark:text-white">Change Transaction PIN</CardTitle>
          <CardDescription className="dark:text-gray-400">Update your 4-digit PIN for secure transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pin" className="dark:text-gray-300">Current PIN</Label>
            <div className="relative">
              <Input
                id="current-pin"
                type={securityFormData.showCurrentPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={securityFormData.currentPin}
                onChange={(event) => handleNumericInput(event.target.value, "currentPin")}
                placeholder="****"
                className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-transparent"
                onClick={toggleCurrentPinVisibility}
                type="button"
              >
                {securityFormData.showCurrentPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pin" className="dark:text-gray-300">New PIN</Label>
            <div className="relative">
              <Input
                id="new-pin"
                type={securityFormData.showNewPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={securityFormData.newPin}
                onChange={(event) => handleNumericInput(event.target.value, "newPin")}
                placeholder="****"
                className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-transparent"
                onClick={toggleNewPinVisibility}
                type="button"
              >
                {securityFormData.showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-pin" className="dark:text-gray-300">Confirm new PIN</Label>
            <Input
              id="confirm-new-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={securityFormData.confirmNewPin}
              onChange={(event) => handleNumericInput(event.target.value, "confirmNewPin")}
              placeholder="****"
              className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
            />
          </div>
        </CardContent>
        <CardFooter className="dark:border-t dark:border-darkBorder-light">
          <Button
            onClick={onPinChange}
            className="bg-[#00B512] hover:bg-[#009E10] dark:bg-brand-gold dark:hover:bg-brand-goldHover text-white dark:text-[#00313A]"
            disabled={!securityFormData.currentPin || !securityFormData.newPin || !securityFormData.confirmNewPin || changingPin}
          >
            {changingPin ? "Updating..." : "Update PIN"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
        <CardHeader>
          <CardTitle className="dark:text-white">Two-Factor Authentication</CardTitle>
          <CardDescription className="dark:text-gray-400">Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa-sms" className="dark:text-gray-300">SMS Authentication</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive verification codes via SMS</p>
              </div>
              <Switch id="2fa-sms" defaultChecked />
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa-app" className="dark:text-gray-300">Authenticator App</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use an authenticator app for 2FA</p>
              </div>
              <Switch id="2fa-app" />
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa-biometric" className="dark:text-gray-300">Biometric Authentication</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use fingerprint or face recognition</p>
              </div>
              <Switch id="2fa-biometric" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-gray-800">Configure 2FA</Button>
        </CardFooter>
      </Card>

      <Card className="md:col-span-2 dark:bg-darkBg-card dark:border-darkBorder-light">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="dark:text-white">Secure Chat Devices</CardTitle>
              <CardDescription className="dark:text-gray-400">Manage devices allowed to receive end-to-end encrypted messages</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchSecureDevices}
              disabled={loadingSecureDevices}
              className="dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <RotateCw size={14} className="mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSecureDevices ? (
            <LoadingSpinner size="sm" text="Loading secure devices..." />
          ) : secureDevices.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500 dark:border-darkBorder-light dark:text-gray-400">
              No secure chat device is registered for this account yet.
            </div>
          ) : (
            <div className="space-y-3">
              {secureDevices.map((device) => {
                const isCurrent = device.deviceId === currentSecureDeviceId;
                const isRevoking = revokingSecureDeviceId === device.deviceId;
                const isBrowserLike = /web|win|mac|linux|browser|chrome|edge|firefox/i.test(
                  `${device.platform || ""} ${device.deviceName || ""}`,
                );

                return (
                  <div
                    key={device.deviceId}
                    className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                      isCurrent
                        ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-main/50"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      {isBrowserLike ? (
                        <Globe size={20} className={isCurrent ? "mt-0.5 text-green-600 dark:text-green-400" : "mt-0.5 text-gray-500 dark:text-gray-400"} />
                      ) : (
                        <Smartphone size={20} className={isCurrent ? "mt-0.5 text-green-600 dark:text-green-400" : "mt-0.5 text-gray-500 dark:text-gray-400"} />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium dark:text-gray-200">
                            {device.deviceName || "Secure device"}
                          </p>
                          {isCurrent && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                              Current
                            </Badge>
                          )}
                          {!device.isActive && (
                            <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                              Revoked
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {device.platform || "unknown"} - Last active: {formatDate(device.lastSeenAt)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Signed prekey #{device.bundle?.signedPreKeyId || "n/a"} - {device.availableOneTimePreKeys} one-time keys
                        </p>
                        <p className="mt-1 max-w-full truncate font-mono text-[11px] text-gray-400 dark:text-gray-500">
                          {device.deviceId}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isCurrent || isRevoking || !device.isActive}
                      onClick={() => handleRevokeSecureDevice(device.deviceId)}
                      className="self-start text-red-500 hover:text-red-600 hover:bg-red-50 disabled:text-gray-400 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 sm:self-center"
                    >
                      <ShieldOff size={14} className="mr-2" />
                      {isRevoking ? "Revoking..." : "Revoke"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="dark:border-t dark:border-darkBorder-light">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Revoked devices cannot receive new secure chat envelopes. Existing local message history on that device is not remotely erased.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
