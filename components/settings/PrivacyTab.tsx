import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { PrivacySettings } from "@/types/settings.types";

export const PrivacyTab: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: "contacts",
    activityStatus: true,
    searchVisibility: true,
    transactionHistoryVisibility: "only_me",
    hideAmounts: false,
    analytics: true,
    marketingCommunications: false,
  });

  const [saving, setSaving] = useState(false);

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePrivacySettings = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call to save privacy settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Privacy settings saved",
        description: "Your privacy settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save privacy settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion workflow
    toast({
      title: "Account deletion",
      description: "This feature will be available soon. Please contact support for assistance.",
      variant: "destructive",
    });
  };

  return (
    <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
      <CardHeader>
        <CardTitle className="dark:text-white">Privacy Settings</CardTitle>
        <CardDescription className="dark:text-gray-400">Control who can see your information and activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3 dark:text-white">Profile Visibility</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-profile" className="dark:text-gray-300">Profile Information</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Who can see your profile information</p>
              </div>
              <select
                id="privacy-profile"
                className="rounded-md border border-gray-300 dark:border-darkBorder-light dark:bg-darkBg-card dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]"
                value={privacySettings.profileVisibility}
                onChange={(e) => updateSetting('profileVisibility', e.target.value as PrivacySettings['profileVisibility'])}
              >
                <option value="contacts">Contacts only</option>
                <option value="everyone">Everyone</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-activity" className="dark:text-gray-300">Activity Status</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Show when you're active on the platform</p>
              </div>
              <Switch 
                id="privacy-activity" 
                checked={privacySettings.activityStatus}
                onCheckedChange={(checked) => updateSetting('activityStatus', checked)}
              />
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-search" className="dark:text-gray-300">Search Visibility</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow others to find you by name or email</p>
              </div>
              <Switch 
                id="privacy-search" 
                checked={privacySettings.searchVisibility}
                onCheckedChange={(checked) => updateSetting('searchVisibility', checked)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3 dark:text-white">Transaction Privacy</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-transactions" className="dark:text-gray-300">Transaction History</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Who can see your transaction history</p>
              </div>
              <select
                id="privacy-transactions"
                className="rounded-md border border-gray-300 dark:border-darkBorder-light dark:bg-darkBg-card dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]"
                value={privacySettings.transactionHistoryVisibility}
                onChange={(e) => updateSetting('transactionHistoryVisibility', e.target.value as PrivacySettings['transactionHistoryVisibility'])}
              >
                <option value="only_me">Only me</option>
                <option value="participants">Transaction participants</option>
                <option value="contacts">Contacts</option>
              </select>
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-amounts" className="dark:text-gray-300">Hide Amounts</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Hide transaction amounts from others</p>
              </div>
              <Switch 
                id="privacy-amounts" 
                checked={privacySettings.hideAmounts}
                onCheckedChange={(checked) => updateSetting('hideAmounts', checked)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3 dark:text-white">Data Usage</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-analytics" className="dark:text-gray-300">Analytics</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow us to collect anonymous usage data</p>
              </div>
              <Switch 
                id="privacy-analytics" 
                checked={privacySettings.analytics}
                onCheckedChange={(checked) => updateSetting('analytics', checked)}
              />
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-marketing" className="dark:text-gray-300">Marketing Communications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive marketing emails and offers</p>
              </div>
              <Switch 
                id="privacy-marketing" 
                checked={privacySettings.marketingCommunications}
                onCheckedChange={(checked) => updateSetting('marketingCommunications', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between dark:bg-darkBg-card dark:border-t dark:border-darkBorder-light">
        <Button 
          variant="outline" 
          className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-darkBorder-light"
          onClick={handleDeleteAccount}
        >
          Delete account
        </Button>
        <Button 
          className="bg-[#00B512] hover:bg-[#009E10] dark:bg-brand-gold dark:hover:bg-brand-goldHover text-white dark:text-[#00313A]"
          onClick={handleSavePrivacySettings}
          disabled={saving}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save privacy settings'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};