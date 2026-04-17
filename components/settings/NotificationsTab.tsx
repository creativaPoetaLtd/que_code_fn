import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Volume2, VolumeX, Smartphone, BellRing } from "lucide-react";
import { NotificationSettings } from "@/types/settings.types";
import { savePrefs, getPrefs } from "@/services/soundService";
import { notificationService } from "@/services/notificationService";
import { syncExistingWebPushSubscription } from "@/services/webPushService";
import { useAuthToken } from "@/hooks/use-auth-token";

export const NotificationsTab: React.FC = () => {
  const { getToken } = useAuthToken();
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

    // Sound & Vibration — loaded from localStorage
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const [saving, setSaving] = useState(false);

  // Hydrate sound/vibration from localStorage on mount
  useEffect(() => {
    const prefs = getPrefs();
    setNotificationSettings((prev) => ({
      ...prev,
      soundEnabled: prefs.soundEnabled,
      vibrationEnabled: prefs.vibrationEnabled,
    }));
  }, []);

  const syncPushPreferences = () => {
    const token = getToken();
    if (!token) {
      return;
    }

    void syncExistingWebPushSubscription(token).catch((error) => {
      console.error("Failed to sync push notification preferences:", error);
    });
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }));

    // Sound & vibration take effect instantly — no Save button needed
    if (key === "soundEnabled") {
      savePrefs({ soundEnabled: value });
      notificationService.syncFromPrefs();
      syncPushPreferences();
      // Play a preview when enabling so the user hears what to expect
      if (value) {
        import("@/services/soundService").then(({ soundService }) => {
          soundService.playMessageSound();
        });
      }
    }
    if (key === "vibrationEnabled") {
      savePrefs({ vibrationEnabled: value });
      notificationService.syncFromPrefs();
      syncPushPreferences();
      // Short vibration preview when enabling
      if (value) {
        import("@/services/soundService").then(({ soundService }) => {
          soundService.vibrate([60]);
        });
      }
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call to save notification preferences
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated successfully.",
      });
    } catch {
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
    <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
      <CardHeader>
        <CardTitle className="dark:text-white">Notification Preferences</CardTitle>
        <CardDescription className="dark:text-gray-400">
          Choose how you want to be notified
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* ── Transaction Notifications ─────────────────────────────────────── */}
        <div>
          <h3 className="text-base sm:text-lg font-medium mb-3 dark:text-white">
            Transaction Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="notify-sent" className="dark:text-gray-300">Money Sent</Label>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Get notified when you send money
                </p>
              </div>
              <Switch
                id="notify-sent"
                checked={notificationSettings.notifySent}
                onCheckedChange={(v) => updateSetting("notifySent", v)}
              />
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="notify-received" className="dark:text-gray-300">Money Received</Label>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Get notified when you receive money
                </p>
              </div>
              <Switch
                id="notify-received"
                checked={notificationSettings.notifyReceived}
                onCheckedChange={(v) => updateSetting("notifyReceived", v)}
              />
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="notify-requested" className="dark:text-gray-300">Money Requested</Label>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Get notified when someone requests money from you
                </p>
              </div>
              <Switch
                id="notify-requested"
                checked={notificationSettings.notifyRequested}
                onCheckedChange={(v) => updateSetting("notifyRequested", v)}
              />
            </div>
          </div>
        </div>

        {/* ── Group Notifications ───────────────────────────────────────────── */}
        <div>
          <h3 className="text-base sm:text-lg font-medium mb-3 dark:text-white">
            Group Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="notify-group-activity" className="dark:text-gray-300">Group Activity</Label>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Get notified about new messages in groups
                </p>
              </div>
              <Switch
                id="notify-group-activity"
                checked={notificationSettings.notifyGroupActivity}
                onCheckedChange={(v) => updateSetting("notifyGroupActivity", v)}
              />
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="notify-contribution" className="dark:text-gray-300">Contribution Updates</Label>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Get notified about contribution group updates
                </p>
              </div>
              <Switch
                id="notify-contribution"
                checked={notificationSettings.notifyContribution}
                onCheckedChange={(v) => updateSetting("notifyContribution", v)}
              />
            </div>
          </div>
        </div>

        {/* ── Notification Channels ─────────────────────────────────────────── */}
        <div>
          <h3 className="text-base sm:text-lg font-medium mb-3 dark:text-white">
            Notification Channels
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="channel-push" className="dark:text-gray-300">Push Notifications</Label>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Receive notifications on your device
                </p>
              </div>
              <Switch
                id="channel-push"
                checked={notificationSettings.channelPush}
                onCheckedChange={(v) => updateSetting("channelPush", v)}
              />
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="channel-email" className="dark:text-gray-300">Email Notifications</Label>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="channel-email"
                checked={notificationSettings.channelEmail}
                onCheckedChange={(v) => updateSetting("channelEmail", v)}
              />
            </div>
            <Separator className="dark:bg-darkBorder-light" />
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="channel-sms" className="dark:text-gray-300">SMS Notifications</Label>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Receive notifications via SMS
                </p>
              </div>
              <Switch
                id="channel-sms"
                checked={notificationSettings.channelSms}
                onCheckedChange={(v) => updateSetting("channelSms", v)}
              />
            </div>
          </div>
        </div>

        {/* ── Sound & Vibration ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BellRing size={18} className="text-brand-green dark:text-brand-gold flex-shrink-0" />
            <h3 className="text-base sm:text-lg font-medium dark:text-white">Sound & Vibration</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
            These settings take effect immediately for in-app alerts and sync to push notifications on supported browsers and devices.
          </p>

          <div className="space-y-3">
            {/* Sound toggle */}
            <div className="flex items-center justify-between gap-3 rounded-xl p-3 bg-gray-50 dark:bg-darkBg-interactive border border-gray-100 dark:border-darkBorder-light">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  notificationSettings.soundEnabled
                    ? "bg-brand-green/10 dark:bg-brand-gold/10"
                    : "bg-gray-200 dark:bg-darkBg-card"
                }`}>
                  {notificationSettings.soundEnabled
                    ? <Volume2 size={18} className="text-brand-green dark:text-brand-gold" />
                    : <VolumeX size={18} className="text-gray-400 dark:text-gray-500" />
                  }
                </div>
                <div className="space-y-0.5 min-w-0">
                  <Label htmlFor="sound-enabled" className="dark:text-gray-300 cursor-pointer">
                    Notification Sound
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {notificationSettings.soundEnabled ? "A gentle tone plays on new messages" : "Silent — no sound on new messages"}
                  </p>
                </div>
              </div>
              <Switch
                id="sound-enabled"
                checked={notificationSettings.soundEnabled}
                onCheckedChange={(v) => updateSetting("soundEnabled", v)}
              />
            </div>

            <Separator className="dark:bg-darkBorder-light" />

            {/* Vibration toggle */}
            <div className="flex items-center justify-between gap-3 rounded-xl p-3 bg-gray-50 dark:bg-darkBg-interactive border border-gray-100 dark:border-darkBorder-light">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  notificationSettings.vibrationEnabled
                    ? "bg-brand-green/10 dark:bg-brand-gold/10"
                    : "bg-gray-200 dark:bg-darkBg-card"
                }`}>
                  <Smartphone
                    size={18}
                    className={notificationSettings.vibrationEnabled
                      ? "text-brand-green dark:text-brand-gold"
                      : "text-gray-400 dark:text-gray-500"
                    }
                  />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <Label htmlFor="vibration-enabled" className="dark:text-gray-300 cursor-pointer">
                    Vibration
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {notificationSettings.vibrationEnabled
                      ? "Device vibrates on new messages"
                      : "No vibration on new messages"}
                  </p>
                </div>
              </div>
              <Switch
                id="vibration-enabled"
                checked={notificationSettings.vibrationEnabled}
                onCheckedChange={(v) => updateSetting("vibrationEnabled", v)}
              />
            </div>

            <p className="text-[11px] text-gray-400 dark:text-gray-500 px-1">
              Vibration is only available on supported mobile devices. Sound requires interaction with the page before it plays.
            </p>
          </div>
        </div>

      </CardContent>

      <CardFooter>
        <Button
          className="bg-[#00B512] hover:bg-[#009E10] dark:bg-brand-gold dark:hover:bg-brand-goldHover text-white dark:text-[#00313A]"
          onClick={handleSavePreferences}
          disabled={saving}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span>Saving...</span>
            </div>
          ) : (
            "Save preferences"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
