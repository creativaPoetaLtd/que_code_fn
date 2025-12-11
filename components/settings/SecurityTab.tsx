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
                  pinStatus.attemptsLeft <= 1 ? 'text-red-600 dark:text-red-400' :
                  pinStatus.attemptsLeft <= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
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
                onChange={(e) => updateSecurityFormData({ currentPassword: e.target.value })}
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
              onChange={(e) => updateSecurityFormData({ newPassword: e.target.value })}
              className="dark:bg-darkBg-main dark:text-white dark:border-darkBorder-light"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="dark:text-gray-300">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={securityFormData.confirmPassword}
              onChange={(e) => updateSecurityFormData({ confirmPassword: e.target.value })}
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
                onChange={(e) => handleNumericInput(e.target.value, 'currentPin')}
                placeholder="••••"
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
                onChange={(e) => handleNumericInput(e.target.value, 'newPin')}
                placeholder="••••"
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
              onChange={(e) => handleNumericInput(e.target.value, 'confirmNewPin')}
              placeholder="••••"
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

      {/* Login Sessions Card - Full Width */}
      <Card className="md:col-span-2 dark:bg-darkBg-card dark:border-darkBorder-light">
        <CardHeader>
          <CardTitle className="dark:text-white">Login Sessions</CardTitle>
          <CardDescription className="dark:text-gray-400">Manage your active sessions across devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg dark:border dark:border-green-800">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-medium dark:text-gray-200">Current device</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    iPhone 13 • San Francisco, CA • Last active: Just now
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                Current
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-main/50">
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-medium dark:text-gray-200">Chrome on Windows</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">New York, NY • Last active: 2 days ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20">
                Sign out
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-main/50">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="font-medium dark:text-gray-200">Android App</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chicago, IL • Last active: 5 days ago</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20">
                Sign out
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="dark:border-t dark:border-darkBorder-light">
          <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:border-darkBorder-light dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20">
            <LogOut size={16} className="mr-2" />
            Sign out of all devices
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};