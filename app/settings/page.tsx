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
import { useSidebar } from "@/context/SidebarContext"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
    const { isExpanded } = useSidebar();
    return (
        <Layout className="min-h-screen bg-gray-50 dark:bg-transparent transition-colors duration-300 mobile-bottom-padding">
            <div className="flex min-h-screen">
                <Navigation />
                <div className={cn(
                    "container max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:py-10 mobile-bottom-padding transition-all duration-300",
                    isExpanded ? "lg:ml-64" : "lg:ml-20"
                )}>
                    <div className="flex flex-col gap-2 mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage your profile settings and preferences</p>
                    </div>

                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-8 dark:bg-darkBg-card dark:border dark:border-darkBorder-light">
                            <TabsTrigger value="profile" className="flex items-center gap-2 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white dark:text-gray-300">
                                <User size={16} />
                                <span className="hidden sm:inline">Profile</span>
                            </TabsTrigger>
                            <TabsTrigger value="security" className="flex items-center gap-2 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white dark:text-gray-300">
                                <Shield size={16} />
                                <span className="hidden sm:inline">Security</span>
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="flex items-center gap-2 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white dark:text-gray-300">
                                <Bell size={16} />
                                <span className="hidden sm:inline">Notifications</span>
                            </TabsTrigger>
                            <TabsTrigger value="payment" className="flex items-center gap-2 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white dark:text-gray-300">
                                <CreditCard size={16} />
                                <span className="hidden sm:inline">Payment</span>
                            </TabsTrigger>
                            <TabsTrigger value="privacy" className="flex items-center gap-2 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white dark:text-gray-300">
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
