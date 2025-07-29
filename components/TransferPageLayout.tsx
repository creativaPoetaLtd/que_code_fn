"use client";

import React, { useState } from "react";
import Navigation from "./Navigation";
import { ArrowLeft, Scan, QrCode, Users, CreditCard, Search, Plus, Send, Smartphone } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  isOnline: boolean;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  action: () => void;
}

const TransferPageLayout = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Mock recent contacts
  const recentContacts: Contact[] = [
    { id: "1", name: "John Doe", phone: "+250 788 123 456", avatar: "/Images/Profile.png", isOnline: true },
    { id: "2", name: "Sarah Wilson", phone: "+250 788 654 321", avatar: "/Images/Profile.png", isOnline: false },
    { id: "3", name: "Mike Johnson", phone: "+250 788 987 654", avatar: "/Images/Profile.png", isOnline: true },
    { id: "4", name: "Emma Davis", phone: "+250 788 456 789", avatar: "/Images/Profile.png", isOnline: false },
  ];

  const quickActions: QuickAction[] = [
    { 
      icon: <QrCode className="w-6 h-6" />, 
      label: "Scan QR", 
      color: "bg-blue-600",
      action: () => alert("QR Scanner would open here")
    },
    { 
      icon: <Smartphone className="w-6 h-6" />, 
      label: "Phone", 
      color: "bg-green-600",
      action: () => setSearchQuery("+250 ")
    },
    { 
      icon: <CreditCard className="w-6 h-6" />, 
      label: "Card", 
      color: "bg-purple-600",
      action: () => alert("Card transfer would open here")
    },
    { 
      icon: <Plus className="w-6 h-6" />, 
      label: "New", 
      color: "bg-orange-600",
      action: () => alert("Add new contact would open here")
    },
  ];

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    // Store contact info and navigate to amount page
    sessionStorage.setItem('selectedRecipient', JSON.stringify(contact));
    router.push("/home/transfer/amount");
  };

  const filteredContacts = recentContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation />

      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-4 flex items-center lg:ml-20">
        <button onClick={() => router.back()} className="mr-3 p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Send Money</h1>
      </div>

      {/* Main Content */}
      <div className="lg:ml-20 p-6 max-w-4xl mx-auto">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-[#00313A] to-[#00252e] rounded-3xl p-6 mb-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm opacity-80 mb-1">Available Balance</p>
            <h2 className="text-3xl font-bold mb-4">RWF 30,000</h2>
            <div className="flex items-center space-x-2">
              <div className="bg-green-500/20 px-3 py-1 rounded-full">
                <span className="text-green-300 text-sm font-medium">+12.5% this month</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or phone number..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-gray-900 placeholder-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
              >
                <div className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <p className="text-sm font-medium text-gray-700">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Contacts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Contacts</h3>
            <button className="text-green-600 text-sm font-medium hover:text-green-700 transition">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className="w-full bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                        <Image
                          src={contact.avatar}
                          alt={contact.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      </div>
                      {contact.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-gray-900 group-hover:text-green-600 transition">
                        {contact.name}
                      </h4>
                      <p className="text-sm text-gray-500">{contact.phone}</p>
                    </div>
                    
                    <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition">
                      <Send className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                    </div>
                  </div>
                </button>
              ))
            ) : searchQuery ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No contacts found matching "{searchQuery}"</p>
                <button className="mt-2 text-green-600 font-medium hover:text-green-700 transition">
                  Add new contact
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent contacts</p>
                <button className="mt-2 text-green-600 font-medium hover:text-green-700 transition">
                  Add your first contact
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferPageLayout;
