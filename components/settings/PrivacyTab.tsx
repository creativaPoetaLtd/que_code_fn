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
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Control who can see your information and activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Profile Visibility</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-profile">Profile Information</Label>
                <p className="text-sm text-gray-500">Who can see your profile information</p>
              </div>
              <select
                id="privacy-profile"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]"
                value={privacySettings.profileVisibility}
                onChange={(e) => updateSetting('profileVisibility', e.target.value as PrivacySettings['profileVisibility'])}
              >
                <option value="contacts">Contacts only</option>
                <option value="everyone">Everyone</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-activity">Activity Status</Label>
                <p className="text-sm text-gray-500">Show when you're active on the platform</p>
              </div>
              <Switch 
                id="privacy-activity" 
                checked={privacySettings.activityStatus}
                onCheckedChange={(checked) => updateSetting('activityStatus', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-search">Search Visibility</Label>
                <p className="text-sm text-gray-500">Allow others to find you by name or email</p>
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
          <h3 className="text-lg font-medium mb-3">Transaction Privacy</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-transactions">Transaction History</Label>
                <p className="text-sm text-gray-500">Who can see your transaction history</p>
              </div>
              <select
                id="privacy-transactions"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]"
                value={privacySettings.transactionHistoryVisibility}
                onChange={(e) => updateSetting('transactionHistoryVisibility', e.target.value as PrivacySettings['transactionHistoryVisibility'])}
              >
                <option value="only_me">Only me</option>
                <option value="participants">Transaction participants</option>
                <option value="contacts">Contacts</option>
              </select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-amounts">Hide Amounts</Label>
                <p className="text-sm text-gray-500">Hide transaction amounts from others</p>
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
          <h3 className="text-lg font-medium mb-3">Data Usage</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-analytics">Analytics</Label>
                <p className="text-sm text-gray-500">Allow us to collect anonymous usage data</p>
              </div>
              <Switch 
                id="privacy-analytics" 
                checked={privacySettings.analytics}
                onCheckedChange={(checked) => updateSetting('analytics', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-marketing">Marketing Communications</Label>
                <p className="text-sm text-gray-500">Receive marketing emails and offers</p>
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
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleDeleteAccount}
        >
          Delete account
        </Button>
        <Button 
          className="bg-[#00B512] hover:bg-[#009E10]"
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