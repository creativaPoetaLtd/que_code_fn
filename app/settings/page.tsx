"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Shield, Bell, CreditCard, Lock } from 'lucide-react'
import { Layout } from "antd"
import Navigation from "@/components/Navigation"
import { ProfileTab } from "@/components/settings/ProfileTab"
import { SecurityTab } from "@/components/settings/SecurityTab"
import { NotificationsTab } from "@/components/settings/NotificationsTab"
import { PaymentTab } from "@/components/settings/PaymentTab"
import { PrivacyTab } from "@/components/settings/PrivacyTab"

export default function SettingsPage() {
    return (
        <Layout className="min-h-screen bg-gray-50 mobile-bottom-padding">
            <div className="flex min-h-screen">
                <Navigation />
                <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:py-10 mobile-bottom-padding">
                    <div className="flex flex-col gap-2 mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
                        <p className="text-gray-500">Manage your profile settings and preferences</p>
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

                        <TabsContent value="profile">
                            <ProfileTab />
                        </TabsContent>

                        <TabsContent value="security">
                            <SecurityTab />
                        </TabsContent>

                        <TabsContent value="notifications">
                            <NotificationsTab />
                        </TabsContent>

                        <TabsContent value="payment">
                            <PaymentTab />
                        </TabsContent>

                        <TabsContent value="privacy">
                            <PrivacyTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </Layout>
    )
}
