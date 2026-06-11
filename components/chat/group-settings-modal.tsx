'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useGetGroupByIdQuery, useUpdateGroupMutation } from '@/states/groupSlice';
import { useAuthToken } from '@/hooks/use-auth-token';
import { toast } from '@/hooks/use-toast';
import { Loader2, Settings, Lock, Target, Info, Wallet, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getGroupWallet } from '@/helpers/api';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
}

export default function GroupSettingsModal({ isOpen, onClose, groupId }: GroupSettingsModalProps) {
  const { getToken } = useAuthToken();
  const token = getToken();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 100,
    hasFundraising: false,
    fundraisingTarget: 0,
    expirationDate: '',
    hasAdditionalInfo: false,
    additionalInfoPrompt: '',
  });

  const { data: groupData, isLoading: loadingGroup } = useGetGroupByIdQuery(
    { groupId: groupId!, token: token! },
    { skip: !groupId || !token }
  );

  const [updateGroup, { isLoading: updating }] = useUpdateGroupMutation();

  const group = groupData?.data;

  const [walletData, setWalletData] = useState<{ balance: number; currency: string; transactions: any[] } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const fetchWallet = async () => {
    if (!groupId) return;
    setWalletLoading(true);
    try {
      const res = await getGroupWallet(groupId);
      setWalletData(res?.data?.data ?? null);
    } catch {
      toast({ variant: 'destructive', description: 'Failed to load wallet data' });
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        isPrivate: group.isPrivate || false,
        maxMembers: group.maxMembers || 100,
        hasFundraising: group.hasFundraising || false,
        fundraisingTarget: group.fundraisingTarget || 0,
        expirationDate: group.expirationDate 
          ? new Date(group.expirationDate).toISOString().split('T')[0] 
          : '',
        hasAdditionalInfo: group.hasAdditionalInfo || false,
        additionalInfoPrompt: group.additionalInfoPrompt || '',
      });
    }
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupId || !token) {
      toast({
        title: 'Error',
        description: 'Missing group ID or authentication token',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updateData: any = {
        name: formData.name,
        description: formData.description,
        isPrivate: formData.isPrivate,
        maxMembers: formData.maxMembers,
        hasFundraising: formData.hasFundraising,
      };

      if (formData.hasFundraising) {
        updateData.fundraisingTarget = formData.fundraisingTarget;
      }

      if (formData.expirationDate) {
        updateData.expirationDate = new Date(formData.expirationDate);
      }

      if (formData.hasAdditionalInfo) {
        updateData.additionalInfoPrompt = formData.additionalInfoPrompt;
      }

      await updateGroup({
        groupId,
        updateData,
        token,
      }).unwrap();

      toast({
        title: 'Success',
        description: 'Group settings updated successfully',
      });

      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to update group settings',
        variant: 'destructive',
      });
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!groupId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-darkBg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings className="w-5 h-5" />
            Group Settings
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Manage your group settings and preferences
          </DialogDescription>
        </DialogHeader>

        {loadingGroup ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green dark:text-brand-gold" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-darkBg-interactive">
                <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-card">
                  <Info className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
                <TabsTrigger value="privacy" className="data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-card">
                  <Lock className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Privacy</span>
                </TabsTrigger>
                <TabsTrigger value="fundraising" className="data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-card">
                  <Target className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Fundraising</span>
                </TabsTrigger>
                <TabsTrigger value="wallet" className="data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-card" onClick={fetchWallet}>
                  <Wallet className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Wallet</span>
                </TabsTrigger>
              </TabsList>

              {/* General Settings */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Group Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter group name"
                    required
                    className="bg-white dark:bg-darkBg-main border-gray-300 dark:border-darkBorder-light text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Enter group description"
                    rows={3}
                    className="bg-white dark:bg-darkBg-main border-gray-300 dark:border-darkBorder-light text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxMembers" className="text-gray-700 dark:text-gray-300">Maximum Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={formData.maxMembers}
                    onChange={(e) => handleChange('maxMembers', parseInt(e.target.value))}
                    min={1}
                    className="bg-white dark:bg-darkBg-main border-gray-300 dark:border-darkBorder-light text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expirationDate" className="text-gray-700 dark:text-gray-300">Expiration Date (Optional)</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => handleChange('expirationDate', e.target.value)}
                    className="bg-white dark:bg-darkBg-main border-gray-300 dark:border-darkBorder-light text-gray-900 dark:text-white"
                  />
                </div>
              </TabsContent>

              {/* Privacy Settings */}
              <TabsContent value="privacy" className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-darkBg-interactive rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="isPrivate" className="text-gray-700 dark:text-gray-300 font-medium">
                      Private Group
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Only invited members can join this group
                    </p>
                  </div>
                  <Switch
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onCheckedChange={(checked) => handleChange('isPrivate', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-darkBg-interactive rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="hasAdditionalInfo" className="text-gray-700 dark:text-gray-300 font-medium">
                      Require Additional Information
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ask for extra info when users join
                    </p>
                  </div>
                  <Switch
                    id="hasAdditionalInfo"
                    checked={formData.hasAdditionalInfo}
                    onCheckedChange={(checked) => handleChange('hasAdditionalInfo', checked)}
                  />
                </div>

                {formData.hasAdditionalInfo && (
                  <div className="space-y-2 pl-4">
                    <Label htmlFor="additionalInfoPrompt" className="text-gray-700 dark:text-gray-300">
                      Information Prompt
                    </Label>
                    <Textarea
                      id="additionalInfoPrompt"
                      value={formData.additionalInfoPrompt}
                      onChange={(e) => handleChange('additionalInfoPrompt', e.target.value)}
                      placeholder="What information would you like to collect?"
                      rows={2}
                      className="bg-white dark:bg-darkBg-main border-gray-300 dark:border-darkBorder-light text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </TabsContent>

              {/* Fundraising Settings */}
              <TabsContent value="fundraising" className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-darkBg-interactive rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="hasFundraising" className="text-gray-700 dark:text-gray-300 font-medium">
                      Enable Fundraising
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Turn this group into a fundraising campaign
                    </p>
                  </div>
                  <Switch
                    id="hasFundraising"
                    checked={formData.hasFundraising}
                    onCheckedChange={(checked) => handleChange('hasFundraising', checked)}
                  />
                </div>

                {formData.hasFundraising && (
                  <div className="space-y-2 pl-4">
                    <Label htmlFor="fundraisingTarget" className="text-gray-700 dark:text-gray-300">
                      Fundraising Target Amount
                    </Label>
                    <Input
                      id="fundraisingTarget"
                      type="number"
                      value={formData.fundraisingTarget}
                      onChange={(e) => handleChange('fundraisingTarget', parseFloat(e.target.value))}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="bg-white dark:bg-darkBg-main border-gray-300 dark:border-darkBorder-light text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Current balance: {group?.walletBalance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                )}

                {formData.hasFundraising && (
                  <div className="p-4 bg-brand-green/5 dark:bg-brand-gold/5 border border-brand-green/20 dark:border-brand-gold/20 rounded-lg">
                    <p className="text-sm text-brand-green dark:text-brand-gold">
                      <strong>Note:</strong> Enabling fundraising will allow members to donate directly to this group's wallet.
                      The progress will be visible in the chat header.
                    </p>
                  </div>
                )}
              </TabsContent>
              {/* Wallet */}
              <TabsContent value="wallet" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Group Wallet</h3>
                  <button
                    type="button"
                    onClick={fetchWallet}
                    disabled={walletLoading}
                    className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 hover:text-brand-green dark:hover:text-brand-gold transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${walletLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {walletLoading && !walletData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-green dark:text-brand-gold" />
                  </div>
                ) : walletData ? (
                  <>
                    {/* Balance card */}
                    <div className="rounded-xl bg-brand-green/10 dark:bg-brand-gold/10 border border-brand-green/20 dark:border-brand-gold/20 px-5 py-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Available Balance</p>
                      <p className="text-2xl font-bold text-brand-green dark:text-brand-gold">
                        {new Intl.NumberFormat('en-RW', { style: 'currency', currency: walletData.currency || 'RWF', minimumFractionDigits: 0 }).format(walletData.balance)}
                      </p>
                    </div>

                    {/* Transaction list */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Recent Transactions</p>
                      {walletData.transactions.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No transactions yet</p>
                      ) : (
                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {walletData.transactions.map((tx: any) => {
                            const isIn = tx.direction === 'in';
                            const senderName = tx.senderWallet?.user
                              ? `${tx.senderWallet.user.firstName} ${tx.senderWallet.user.lastName}`
                              : tx.senderWallet?.groupId ? 'Group wallet' : 'External';
                            const receiverName = tx.receiverWallet?.user
                              ? `${tx.receiverWallet.user.firstName} ${tx.receiverWallet.user.lastName}`
                              : tx.receiverWallet?.groupId ? 'Group wallet' : 'External';
                            return (
                              <li key={tx.id} className="flex items-center justify-between bg-gray-50 dark:bg-darkBg-interactive rounded-lg px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className={`p-1.5 rounded-full ${isIn ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                    {isIn
                                      ? <ArrowDownLeft className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                      : <ArrowUpRight className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">
                                      {tx.description || (isIn ? `From ${senderName}` : `To ${receiverName}`)}
                                    </p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                      {new Date(tx.createdAt).toLocaleDateString('en-RW', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-xs font-semibold ${isIn ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                  {isIn ? '+' : '-'}{new Intl.NumberFormat('en-RW', { minimumFractionDigits: 0 }).format(Number(tx.amount))} RWF
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Click Refresh to load wallet data</p>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-darkBorder-light">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updating}
                className="dark:border-darkBorder-light dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updating}
                className="bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
