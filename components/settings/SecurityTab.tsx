import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, CheckCircle, AlertCircle, Smartphone, Globe, LogOut } from 'lucide-react';
import Input from "@/components/ui/Input-ant";
import { Label } from "@/components/ui/label";
import { useSecuritySettings } from "@/hooks/use-security-settings";
import { LoadingSpinner } from "./shared";

export const SecurityTab: React.FC = () => {
  const {
    pinStatus,
    loadingPinStatus,
    changingPin,
    securityFormData,
    updateSecurityFormData,
    handleChangePassword,
    handleChangePin,
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

  const handleNumericInput = (value: string, field: 'currentPin' | 'newPin' | 'confirmNewPin') => {
    const numericValue = value.replace(/\D/g, "");
    updateSecurityFormData({ [field]: numericValue });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>PIN Status</CardTitle>
          <CardDescription>Your transaction PIN security status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingPinStatus ? (
            <LoadingSpinner size="sm" text="Loading PIN status..." />
          ) : pinStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">PIN Setup:</span>
                <div className="flex items-center space-x-2">
                  {pinStatus.hasPin ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Set up</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Not set up</span>
                    </>
                  )}
                </div>
              </div>

              {pinStatus.isLocked && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">Locked</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attempts Left:</span>
                <span className={`text-sm font-medium ${
                  pinStatus.attemptsLeft <= 1 ? 'text-red-600' :
                  pinStatus.attemptsLeft <= 2 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {pinStatus.attemptsLeft}/5
                </span>
              </div>

              {pinStatus.lockedUntil && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    <strong>PIN Locked:</strong> Too many failed attempts.
                    Try again after {pinStatus.lockedUntil.toLocaleTimeString()}.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Unable to load PIN status
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={securityFormData.showPassword ? "text" : "password"}
                value={securityFormData.currentPassword}
                onChange={(e) => updateSecurityFormData({ currentPassword: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={togglePasswordVisibility}
                type="button"
              >
                {securityFormData.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={securityFormData.newPassword}
              onChange={(e) => updateSecurityFormData({ newPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={securityFormData.confirmPassword}
              onChange={(e) => updateSecurityFormData({ confirmPassword: e.target.value })}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={onPasswordChange}
            className="bg-[#00B512] hover:bg-[#009E10]"
            disabled={!securityFormData.currentPassword || !securityFormData.newPassword || !securityFormData.confirmPassword}
          >
            Update password
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Transaction PIN</CardTitle>
          <CardDescription>Update your 4-digit PIN for secure transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-pin">Current PIN</Label>
            <div className="relative">
              <Input
                id="current-pin"
                type={securityFormData.showCurrentPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={securityFormData.currentPin}
                onChange={(e) => handleNumericInput(e.target.value, 'currentPin')}
                placeholder="••••"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={toggleCurrentPinVisibility}
                type="button"
              >
                {securityFormData.showCurrentPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pin">New PIN</Label>
            <div className="relative">
              <Input
                id="new-pin"
                type={securityFormData.showNewPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={securityFormData.newPin}
                onChange={(e) => handleNumericInput(e.target.value, 'newPin')}
                placeholder="••••"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={toggleNewPinVisibility}
                type="button"
              >
                {securityFormData.showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-pin">Confirm new PIN</Label>
            <Input
              id="confirm-new-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={securityFormData.confirmNewPin}
              onChange={(e) => handleNumericInput(e.target.value, 'confirmNewPin')}
              placeholder="••••"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={onPinChange}
            className="bg-[#00B512] hover:bg-[#009E10]"
            disabled={!securityFormData.currentPin || !securityFormData.newPin || !securityFormData.confirmNewPin || changingPin}
          >
            {changingPin ? "Updating..." : "Update PIN"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa-sms">SMS Authentication</Label>
                <p className="text-sm text-gray-500">Receive verification codes via SMS</p>
              </div>
              <Switch id="2fa-sms" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa-app">Authenticator App</Label>
                <p className="text-sm text-gray-500">Use an authenticator app for 2FA</p>
              </div>
              <Switch id="2fa-app" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa-biometric">Biometric Authentication</Label>
                <p className="text-sm text-gray-500">Use fingerprint or face recognition</p>
              </div>
              <Switch id="2fa-biometric" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Configure 2FA</Button>
        </CardFooter>
      </Card>

      {/* Login Sessions Card - Full Width */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Login Sessions</CardTitle>
          <CardDescription>Manage your active sessions across devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-green-600" />
                <div>
                  <p className="font-medium">Current device</p>
                  <p className="text-xs text-gray-500">
                    iPhone 13 • San Francisco, CA • Last active: Just now
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                Current
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-gray-500" />
                <div>
                  <p className="font-medium">Chrome on Windows</p>
                  <p className="text-xs text-gray-500">New York, NY • Last active: 2 days ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                Sign out
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-gray-500" />
                <div>
                  <p className="font-medium">Android App</p>
                  <p className="text-xs text-gray-500">Chicago, IL • Last active: 5 days ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                Sign out
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut size={16} className="mr-2" />
            Sign out of all devices
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};