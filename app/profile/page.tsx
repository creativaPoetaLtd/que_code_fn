"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CreditCard,
    BarChart2,
    Users,
    Shield,
    CheckCircle,
    AlertCircle,
} from "lucide-react"

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState("overview")

    // Mock transaction data
    const recentTransactions = [
        {
            id: 1,
            type: "sent",
            amount: 75.0,
            recipient: "Sarah Johnson",
            date: "Today, 10:30 AM",
            status: "completed",
        },
        {
            id: 2,
            type: "received",
            amount: 250.0,
            sender: "Design Team Group",
            date: "Yesterday, 2:15 PM",
            status: "completed",
        },
        {
            id: 3,
            type: "sent",
            amount: 42.5,
            recipient: "Coffee Shop",
            date: "Mar 15, 9:20 AM",
            status: "completed",
        },
        {
            id: 4,
            type: "received",
            amount: 180.0,
            sender: "Michael Chen",
            date: "Mar 12, 4:45 PM",
            status: "completed",
        },
        {
            id: 5,
            type: "sent",
            amount: 120.0,
            recipient: "Marketing Campaign",
            date: "Mar 10, 11:30 AM",
            status: "completed",
        },
    ]

    // Mock contribution groups
    const contributionGroups = [
        {
            id: 1,
            name: "Marketing Campaign",
            progress: 50,
            contributed: 250,
            target: 2000,
            deadline: "Apr 30, 2023",
            members: 6,
        },
        {
            id: 2,
            name: "Product Launch",
            progress: 75,
            contributed: 750,
            target: 5000,
            deadline: "May 15, 2023",
            members: 12,
        },
        {
            id: 3,
            name: "Team Retreat",
            progress: 30,
            contributed: 150,
            target: 1500,
            deadline: "Jun 20, 2023",
            members: 8,
        },
    ]

    return (
        <div className="container max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:py-10 mobile-bottom-padding">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Sidebar */}
                <div className="md:w-1/3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                                        <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                                        <AvatarFallback>JD</AvatarFallback>
                                    </Avatar>
                                    <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <h2 className="mt-4 text-xl font-bold">John Doe</h2>
                                <p className="text-gray-500">@johndoe</p>
                                <Badge className="mt-2 bg-[#00B512]">Verified</Badge>

                                <div className="w-full mt-6 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Mail size={16} className="text-gray-500" />
                                        <span className="text-sm">john.doe@example.com</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-gray-500" />
                                        <span className="text-sm">+1 (555) 123-4567</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-gray-500" />
                                        <span className="text-sm">San Francisco, CA</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-gray-500" />
                                        <span className="text-sm">Joined January 2023</span>
                                    </div>
                                </div>

                                <div className="w-full mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="font-medium mb-3">Account Balance</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={20} className="text-[#00B512]" />
                                            <span className="text-2xl font-bold">$1,250.75</span>
                                        </div>
                                        <Button size="sm" className="bg-[#00B512] hover:bg-[#009E10]">
                                            Add Money
                                        </Button>
                                    </div>
                                </div>

                                <div className="w-full mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="font-medium mb-3">Verification Status</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle size={16} className="text-green-500" />
                                                <span className="text-sm">Email verified</span>
                                            </div>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Complete
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle size={16} className="text-green-500" />
                                                <span className="text-sm">Phone verified</span>
                                            </div>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Complete
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle size={16} className="text-amber-500" />
                                                <span className="text-sm">ID verification</span>
                                            </div>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                Pending
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="md:w-2/3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-3 mb-6">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="transactions">Transactions</TabsTrigger>
                            <TabsTrigger value="contributions">Contributions</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Monthly Activity</CardTitle>
                                        <CardDescription>Your transaction summary</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ArrowUpRight size={16} className="text-green-600" />
                                                    <span className="text-sm font-medium text-green-600">Money Sent</span>
                                                </div>
                                                <p className="text-2xl font-bold">$237.50</p>
                                                <p className="text-xs text-gray-500">5 transactions</p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ArrowDownLeft size={16} className="text-blue-600" />
                                                    <span className="text-sm font-medium text-blue-600">Money Received</span>
                                                </div>
                                                <p className="text-2xl font-bold">$430.00</p>
                                                <p className="text-xs text-gray-500">3 transactions</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                                        <CardDescription>Common tasks</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" className="justify-start">
                                                <DollarSign size={16} className="mr-2" />
                                                Send Money
                                            </Button>
                                            <Button variant="outline" className="justify-start">
                                                <Users size={16} className="mr-2" />
                                                Add Contact
                                            </Button>
                                            <Button variant="outline" className="justify-start">
                                                <CreditCard size={16} className="mr-2" />
                                                Add Payment
                                            </Button>
                                            <Button variant="outline" className="justify-start">
                                                <Shield size={16} className="mr-2" />
                                                Security
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Transactions</CardTitle>
                                    <CardDescription>Your latest activity</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentTransactions.slice(0, 3).map((transaction) => (
                                            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`p-2 rounded-full ${transaction.type === "sent" ? "bg-green-100" : "bg-blue-100"
                                                            }`}
                                                    >
                                                        {transaction.type === "sent" ? (
                                                            <ArrowUpRight size={16} className="text-green-600" />
                                                        ) : (
                                                            <ArrowDownLeft size={16} className="text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {transaction.type === "sent"
                                                                ? `Sent to ${transaction.recipient}`
                                                                : `Received from ${transaction.sender}`}
                                                        </p>
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            <Clock size={12} className="mr-1" />
                                                            {transaction.date}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`font-medium ${transaction.type === "sent" ? "text-red-600" : "text-green-600"}`}
                                                    >
                                                        {transaction.type === "sent" ? "-" : "+"}${transaction.amount.toFixed(2)}
                                                    </p>
                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                        {transaction.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="link" className="mt-4 w-full text-[#00B512]">
                                        View all transactions
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Contribution Groups</CardTitle>
                                    <CardDescription>Groups you're contributing to</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {contributionGroups.slice(0, 2).map((group) => (
                                            <div key={group.id} className="p-3 rounded-lg border">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-medium">{group.name}</h4>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {group.members} members
                                                    </Badge>
                                                </div>
                                                <div className="mb-2">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span>Progress</span>
                                                        <span>
                                                            ${group.contributed} of ${group.target}
                                                        </span>
                                                    </div>
                                                    <Progress value={group.progress} className="h-2" />
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Calendar size={12} className="mr-1" />
                                                        Deadline: {group.deadline}
                                                    </div>
                                                    <Button size="sm" className="bg-[#00B512] hover:bg-[#009E10]">
                                                        Contribute
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="link" className="mt-4 w-full text-[#00B512]">
                                        View all groups
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Transactions Tab */}
                        <TabsContent value="transactions">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>Transaction History</CardTitle>
                                            <CardDescription>View all your past transactions</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <select className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]">
                                                <option>All Types</option>
                                                <option>Sent</option>
                                                <option>Received</option>
                                            </select>
                                            <select className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]">
                                                <option>Last 30 days</option>
                                                <option>Last 90 days</option>
                                                <option>This year</option>
                                                <option>All time</option>
                                            </select>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentTransactions.map((transaction) => (
                                            <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`p-2 rounded-full ${transaction.type === "sent" ? "bg-green-100" : "bg-blue-100"
                                                            }`}
                                                    >
                                                        {transaction.type === "sent" ? (
                                                            <ArrowUpRight size={16} className="text-green-600" />
                                                        ) : (
                                                            <ArrowDownLeft size={16} className="text-blue-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {transaction.type === "sent"
                                                                ? `Sent to ${transaction.recipient}`
                                                                : `Received from ${transaction.sender}`}
                                                        </p>
                                                        <div className="flex items-center text-xs text-gray-500">
                                                            <Clock size={12} className="mr-1" />
                                                            {transaction.date}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`font-medium ${transaction.type === "sent" ? "text-red-600" : "text-green-600"}`}
                                                    >
                                                        {transaction.type === "sent" ? "-" : "+"}${transaction.amount.toFixed(2)}
                                                    </p>
                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                        {transaction.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center mt-6">
                                        <Button variant="outline" size="sm">
                                            Previous
                                        </Button>
                                        <div className="text-sm text-gray-500">Page 1 of 5</div>
                                        <Button variant="outline" size="sm">
                                            Next
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Transaction Analytics</CardTitle>
                                    <CardDescription>Insights into your spending and receiving patterns</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1">
                                            <h4 className="font-medium mb-3">Monthly Summary</h4>
                                            <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <BarChart2 size={32} className="text-gray-400" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">Total Sent</p>
                                                    <p className="text-xl font-bold text-red-600">$1,250.75</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Total Received</p>
                                                    <p className="text-xl font-bold text-green-600">$2,430.50</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-medium mb-3">Top Categories</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Contribution Groups</span>
                                                        <span className="text-sm font-medium">35%</span>
                                                    </div>
                                                    <Progress value={35} className="h-2" />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Personal Transfers</span>
                                                        <span className="text-sm font-medium">28%</span>
                                                    </div>
                                                    <Progress value={28} className="h-2" />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Shopping</span>
                                                        <span className="text-sm font-medium">20%</span>
                                                    </div>
                                                    <Progress value={20} className="h-2" />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm">Food & Dining</span>
                                                        <span className="text-sm font-medium">17%</span>
                                                    </div>
                                                    <Progress value={17} className="h-2" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Contributions Tab */}
                        <TabsContent value="contributions">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>Your Contribution Groups</CardTitle>
                                            <CardDescription>Groups you're contributing to</CardDescription>
                                        </div>
                                        <Button className="bg-[#00B512] hover:bg-[#009E10]">
                                            <Users size={16} className="mr-2" />
                                            Create Group
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {contributionGroups.map((group) => (
                                            <div key={group.id} className="p-4 rounded-lg border">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="text-lg font-medium">{group.name}</h4>
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {group.members} members
                                                    </Badge>
                                                </div>
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span>Progress</span>
                                                        <span>
                                                            ${group.contributed} of ${group.target}
                                                        </span>
                                                    </div>
                                                    <Progress value={group.progress} className="h-2" />
                                                </div>
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Calendar size={14} className="mr-1" />
                                                            Deadline: {group.deadline}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <DollarSign size={14} className="mr-1" />
                                                            Your contribution: ${group.contributed}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline">
                                                            View Details
                                                        </Button>
                                                        <Button size="sm" className="bg-[#00B512] hover:bg-[#009E10]">
                                                            Contribute
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle>Contribution History</CardTitle>
                                    <CardDescription>Your past contributions to groups</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-green-100">
                                                    <ArrowUpRight size={16} className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Marketing Campaign</p>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Clock size={12} className="mr-1" />
                                                        Mar 15, 2023
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-red-600">-$100.00</p>
                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                    completed
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-green-100">
                                                    <ArrowUpRight size={16} className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Product Launch</p>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Clock size={12} className="mr-1" />
                                                        Mar 10, 2023
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-red-600">-$250.00</p>
                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                    completed
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full bg-green-100">
                                                    <ArrowUpRight size={16} className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">Team Retreat</p>
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <Clock size={12} className="mr-1" />
                                                        Feb 28, 2023
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-red-600">-$150.00</p>
                                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                    completed
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
