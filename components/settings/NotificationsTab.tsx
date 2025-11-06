import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { NotificationSettings } from "@/types/settings.types";

export const NotificationsTab: React.FC = () => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    // Transaction Notifications
    notifySent: true,
    notifyReceived: true,
    notifyRequested: true,
    
    // Group Notifications
    notifyGroupActivity: true,
    notifyContribution: true,
    
    // Notification Channels
    channelPush: true,
    channelEmail: true,
    channelSms: false,
  });

  const [saving, setSaving] = useState(false);

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call to save notification preferences
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose how you want to be notified</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Transaction Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-sent">Money Sent</Label>
                <p className="text-sm text-gray-500">Get notified when you send money</p>
              </div>
              <Switch 
                id="notify-sent" 
                checked={notificationSettings.notifySent}
                onCheckedChange={(checked) => updateSetting('notifySent', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-received">Money Received</Label>
                <p className="text-sm text-gray-500">Get notified when you receive money</p>
              </div>
              <Switch 
                id="notify-received" 
                checked={notificationSettings.notifyReceived}
                onCheckedChange={(checked) => updateSetting('notifyReceived', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-requested">Money Requested</Label>
                <p className="text-sm text-gray-500">Get notified when someone requests money from you</p>
              </div>
              <Switch 
                id="notify-requested" 
                checked={notificationSettings.notifyRequested}
                onCheckedChange={(checked) => updateSetting('notifyRequested', checked)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Group Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-group-activity">Group Activity</Label>
                <p className="text-sm text-gray-500">Get notified about new messages in groups</p>
              </div>
              <Switch 
                id="notify-group-activity" 
                checked={notificationSettings.notifyGroupActivity}
                onCheckedChange={(checked) => updateSetting('notifyGroupActivity', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-contribution">Contribution Updates</Label>
                <p className="text-sm text-gray-500">Get notified about contribution group updates</p>
              </div>
              <Switch 
                id="notify-contribution" 
                checked={notificationSettings.notifyContribution}
                onCheckedChange={(checked) => updateSetting('notifyContribution', checked)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Notification Channels</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="channel-push">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications on your device</p>
              </div>
              <Switch 
                id="channel-push" 
                checked={notificationSettings.channelPush}
                onCheckedChange={(checked) => updateSetting('channelPush', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="channel-email">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch 
                id="channel-email" 
                checked={notificationSettings.channelEmail}
                onCheckedChange={(checked) => updateSetting('channelEmail', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="channel-sms">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </div>
              <Switch 
                id="channel-sms" 
                checked={notificationSettings.channelSms}
                onCheckedChange={(checked) => updateSetting('channelSms', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="bg-[#00B512] hover:bg-[#009E10]"
          onClick={handleSavePreferences}
          disabled={saving}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </div>
          ) : (
            'Save preferences'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};