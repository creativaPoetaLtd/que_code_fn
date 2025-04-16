"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Bell, CreditCard, Lock, Eye, EyeOff, Upload, ChevronRight, CheckCircle, AlertCircle, Smartphone, Globe, LogOut } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import Input from "@/components/ui/Input-ant"
import Label from "@/components/ui/Label"
import { Layout } from "antd"
import Navigation from "@/components/Navigation"

export default function SettingsPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const handleSaveProfile = () => {
        toast({
            title: "Profile updated",
            description: "Your profile information has been updated successfully.",
        })
    }

    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "New password and confirm password must match.",
                variant: "destructive",
            })
            return
        }

        toast({
            title: "Password changed",
            description: "Your password has been changed successfully.",
        })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
    }

    return (
        <Layout className="min-h-screen bg-gray-50 mobile-bottom-padding">
            <div className="flex min-h-screen">
                <Navigation />
                <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:py-10 mobile-bottom-padding">
                    <div className="flex flex-col gap-2 mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
                        <p className="text-gray-500">Manage your account settings and preferences</p>
                    </div>

                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-8">
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                                <User size={16} />
                                <span className="hidden sm:inline">Profile</span>
                            </TabsTrigger>
                            <TabsTrigger value="security" className="flex items-center gap-2">
                                <Shield size={16} />
                                <span className="hidden sm:inline">Security</span>
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="flex items-center gap-2">
                                <Bell size={16} />
                                <span className="hidden sm:inline">Notifications</span>
                            </TabsTrigger>
                            <TabsTrigger value="payment" className="flex items-center gap-2">
                                <CreditCard size={16} />
                                <span className="hidden sm:inline">Payment</span>
                            </TabsTrigger>
                            <TabsTrigger value="privacy" className="flex items-center gap-2">
                                <Lock size={16} />
                                <span className="hidden sm:inline">Privacy</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Profile Tab */}
                        <TabsContent value="profile">
                            <div className="grid gap-6 md:grid-cols-5">
                                <Card className="md:col-span-3">
                                    <CardHeader>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>Update your personal details</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="first-name">First name</Label>
                                                <Input id="first-name" defaultValue="John" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="last-name">Last name</Label>
                                                <Input id="last-name" defaultValue="Doe" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" defaultValue="john.doe@example.com" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone number</Label>
                                            <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input id="address" defaultValue="123 Main St, San Francisco, CA 94105" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end">
                                        <Button onClick={handleSaveProfile} className="bg-[#00B512] hover:bg-[#009E10]">
                                            Save changes
                                        </Button>
                                    </CardFooter>
                                </Card>

                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Profile Picture</CardTitle>
                                        <CardDescription>Update your profile image</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col items-center space-y-4">
                                        <Avatar className="h-24 w-24 border-2 border-gray-200">
                                            <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                                            <AvatarFallback>JD</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-center gap-2">
                                            <Button variant="outline" className="w-full">
                                                <Upload size={16} className="mr-2" />
                                                Upload new image
                                            </Button>
                                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full">
                                                Remove
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Account Verification</CardTitle>
                                    <CardDescription>Verify your identity to unlock all features</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle size={20} className="text-green-600" />
                                                <div>
                                                    <p className="font-medium">Email verification</p>
                                                    <p className="text-sm text-gray-500">Your email has been verified</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                                Verified
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle size={20} className="text-amber-600" />
                                                <div>
                                                    <p className="font-medium">ID verification</p>
                                                    <p className="text-sm text-gray-500">Upload a government-issued ID</p>
                                                </div>
                                            </div>
                                            <Button size="sm" className="bg-[#00B512] hover:bg-[#009E10]">
                                                Verify now
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle size={20} className="text-amber-600" />
                                                <div>
                                                    <p className="font-medium">Address verification</p>
                                                    <p className="text-sm text-gray-500">Confirm your residential address</p>
                                                </div>
                                            </div>
                                            <Button size="sm" className="bg-[#00B512] hover:bg-[#009E10]">
                                                Verify now
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security">
                            <div className="grid gap-6 md:grid-cols-2">
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
                                                    type={showPassword ? "text" : "password"}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password">New password</Label>
                                            <Input
                                                id="new-password"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirm-password">Confirm new password</Label>
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            onClick={handleChangePassword}
                                            className="bg-[#00B512] hover:bg-[#009E10]"
                                            disabled={!currentPassword || !newPassword || !confirmPassword}
                                        >
                                            Update password
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
                            </div>

                            <Card className="mt-6">
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
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications">
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
                                                <Switch id="notify-sent" defaultChecked />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="notify-received">Money Received</Label>
                                                    <p className="text-sm text-gray-500">Get notified when you receive money</p>
                                                </div>
                                                <Switch id="notify-received" defaultChecked />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="notify-requested">Money Requested</Label>
                                                    <p className="text-sm text-gray-500">Get notified when someone requests money from you</p>
                                                </div>
                                                <Switch id="notify-requested" defaultChecked />
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
                                                <Switch id="notify-group-activity" defaultChecked />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="notify-contribution">Contribution Updates</Label>
                                                    <p className="text-sm text-gray-500">Get notified about contribution group updates</p>
                                                </div>
                                                <Switch id="notify-contribution" defaultChecked />
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
                                                <Switch id="channel-push" defaultChecked />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="channel-email">Email Notifications</Label>
                                                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                                                </div>
                                                <Switch id="channel-email" defaultChecked />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="channel-sms">SMS Notifications</Label>
                                                    <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                                                </div>
                                                <Switch id="channel-sms" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="bg-[#00B512] hover:bg-[#009E10]">Save preferences</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* Payment Tab */}
                        <TabsContent value="payment">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Payment Methods</CardTitle>
                                        <CardDescription>Manage your payment methods</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded-md">
                                                    <CreditCard size={20} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Visa ending in 4242</p>
                                                    <p className="text-xs text-gray-500">Expires 12/25</p>
                                                </div>
                                            </div>
                                            <Badge>Default</Badge>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-purple-100 p-2 rounded-md">
                                                    <CreditCard size={20} className="text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Mastercard ending in 8888</p>
                                                    <p className="text-xs text-gray-500">Expires 09/24</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                Set default
                                            </Button>
                                        </div>

                                        <Button variant="outline" className="w-full">
                                            <CreditCard size={16} className="mr-2" />
                                            Add new payment method
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Bank Accounts</CardTitle>
                                        <CardDescription>Manage your linked bank accounts</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-100 p-2 rounded-md">
                                                    <CreditCard size={20} className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Chase Bank</p>
                                                    <p className="text-xs text-gray-500">Checking account ending in 1234</p>
                                                </div>
                                            </div>
                                            <Badge>Default</Badge>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-100 p-2 rounded-md">
                                                    <CreditCard size={20} className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Bank of America</p>
                                                    <p className="text-xs text-gray-500">Savings account ending in 5678</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                Set default
                                            </Button>
                                        </div>

                                        <Button variant="outline" className="w-full">
                                            <CreditCard size={16} className="mr-2" />
                                            Link new bank account
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Transaction Limits</CardTitle>
                                    <CardDescription>View and manage your transaction limits</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-lg border">
                                            <div>
                                                <p className="font-medium">Daily sending limit</p>
                                                <p className="text-sm text-gray-500">Maximum amount you can send in a day</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">$1,000</p>
                                                <Button variant="link" className="text-sm p-0 h-auto text-[#00B512]">
                                                    Increase limit
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg border">
                                            <div>
                                                <p className="font-medium">Monthly transaction limit</p>
                                                <p className="text-sm text-gray-500">Maximum amount you can transact in a month</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">$10,000</p>
                                                <Button variant="link" className="text-sm p-0 h-auto text-[#00B512]">
                                                    Increase limit
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg border">
                                            <div>
                                                <p className="font-medium">Single transaction limit</p>
                                                <p className="text-sm text-gray-500">Maximum amount for a single transaction</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">$500</p>
                                                <Button variant="link" className="text-sm p-0 h-auto text-[#00B512]">
                                                    Increase limit
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <p className="text-sm text-gray-500">
                                        Note: Increasing limits may require additional verification of your identity.
                                    </p>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        {/* Privacy Tab */}
                        <TabsContent value="privacy">
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
                                                >
                                                    <option>Contacts only</option>
                                                    <option>Everyone</option>
                                                    <option>Nobody</option>
                                                </select>
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="privacy-activity">Activity Status</Label>
                                                    <p className="text-sm text-gray-500">Show when you're active on the platform</p>
                                                </div>
                                                <Switch id="privacy-activity" defaultChecked />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="privacy-search">Search Visibility</Label>
                                                    <p className="text-sm text-gray-500">Allow others to find you by name or email</p>
                                                </div>
                                                <Switch id="privacy-search" defaultChecked />
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
                                                >
                                                    <option>Only me</option>
                                                    <option>Transaction participants</option>
                                                    <option>Contacts</option>
                                                </select>
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="privacy-amounts">Hide Amounts</Label>
                                                    <p className="text-sm text-gray-500">Hide transaction amounts from others</p>
                                                </div>
                                                <Switch id="privacy-amounts" />
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
                                                <Switch id="privacy-analytics" defaultChecked />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label htmlFor="privacy-marketing">Marketing Communications</Label>
                                                    <p className="text-sm text-gray-500">Receive marketing emails and offers</p>
                                                </div>
                                                <Switch id="privacy-marketing" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                        Delete account
                                    </Button>
                                    <Button className="bg-[#00B512] hover:bg-[#009E10]">Save privacy settings</Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </Layout>

    )
}

