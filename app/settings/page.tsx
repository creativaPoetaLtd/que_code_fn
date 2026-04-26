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
import { BackButton } from "@/components/shared/BackButton"

export default function SettingsPage() {
    const { isExpanded } = useSidebar();
    return (
        <Layout className="min-h-screen bg-gray-50 dark:bg-darkBg-main transition-colors duration-300 mobile-bottom-padding">
            <div className="flex min-h-screen">
                <Navigation />
                <main className={cn(
                    "flex-1 overflow-auto transition-all duration-300",
                    isExpanded ? "lg:ml-64" : "lg:ml-20"
                )}>
                    <div className="container max-w-6xl mx-auto py-4 sm:py-6 lg:py-10 px-3 sm:px-4 lg:px-6 mobile-bottom-padding">
                        <BackButton className="mb-6" />
                        <div className="flex flex-col gap-1 sm:gap-2 mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Manage your profile settings and preferences</p>
                        </div>

                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-6 sm:mb-8 w-full bg-white dark:bg-darkBg-card dark:border dark:border-darkBorder-light gap-1 sm:gap-0">
                                <TabsTrigger 
                                    value="profile" 
                                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm dark:text-gray-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white transition-colors"
                                >
                                    <User size={16} className="flex-shrink-0" />
                                    <span className="hidden sm:inline">Profile</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="security" 
                                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm dark:text-gray-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white transition-colors"
                                >
                                    <Shield size={16} className="flex-shrink-0" />
                                    <span className="hidden sm:inline">Security</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="notifications" 
                                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm dark:text-gray-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white transition-colors"
                                >
                                    <Bell size={16} className="flex-shrink-0" />
                                    <span className="hidden sm:inline">Notifications</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="payment" 
                                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm dark:text-gray-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white transition-colors"
                                >
                                    <CreditCard size={16} className="flex-shrink-0" />
                                    <span className="hidden sm:inline">Payment</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="privacy" 
                                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm dark:text-gray-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white transition-colors"
                                >
                                    <Lock size={16} className="flex-shrink-0" />
                                    <span className="hidden sm:inline">Privacy</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="focus-visible:outline-none">
                                <ProfileTab />
                            </TabsContent>

                            <TabsContent value="security" className="focus-visible:outline-none">
                                <SecurityTab />
                            </TabsContent>

                            <TabsContent value="notifications" className="focus-visible:outline-none">
                                <NotificationsTab />
                            </TabsContent>

                            <TabsContent value="payment" className="focus-visible:outline-none">
                                <PaymentTab />
                            </TabsContent>

                            <TabsContent value="privacy" className="focus-visible:outline-none">
                                <PrivacyTab />
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </Layout>
    )
}
