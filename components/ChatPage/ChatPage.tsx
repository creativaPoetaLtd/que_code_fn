'use client';
import React, { useEffect, useState } from "react";
import { Navigation } from "../Navigation";
import ConversationList from "./ConversationList";
import ChatArea from "./ChatArea";

// Sample data for conversations
export const SAMPLE_CONVERSATIONS = [
    {
        id: 1,
        name: "Design Team",
        isGroup: true,
        lastMessage: "Let's finalize the mockups by EOD",
        timestamp: "10:45 AM",
        unread: 3,
        avatar: "/api/placeholder/40/40",
        members: 8,
        online: 5
    },
    {
        id: 2,
        name: "Marketing Campaign",
        isGroup: true,
        lastMessage: "I've shared the social media calendar",
        timestamp: "Yesterday",
        unread: 0,
        avatar: "/api/placeholder/40/40",
        members: 6,
        online: 2
    },
    {
        id: 3,
        name: "Sarah Johnson",
        isGroup: false,
        lastMessage: "Can we schedule a call tomorrow?",
        timestamp: "Yesterday",
        unread: 1,
        avatar: "/api/placeholder/40/40",
        online: true
    },
    {
        id: 4,
        name: "Product Launch",
        isGroup: true,
        lastMessage: "The MVP is ready for testing",
        timestamp: "Monday",
        unread: 0,
        avatar: "/api/placeholder/40/40",
        members: 12,
        online: 7
    },
    {
        id: 5,
        name: "Michael Chen",
        isGroup: false,
        lastMessage: "I've reviewed your proposal",
        timestamp: "Monday",
        unread: 0,
        avatar: "/api/placeholder/40/40",
        online: false
    }
];

// Sample messages for the active conversation
export const SAMPLE_MESSAGES = [
    {
        id: 1,
        sender: "Sarah Johnson",
        message: "Hi team! I've created a new invitation for our project kickoff.",
        timestamp: "10:30 AM",
        isMe: false,
        avatar: "/api/placeholder/40/40"
    },
    {
        id: 2,
        sender: "You",
        message: "Thanks Sarah! I'll check it out right away.",
        timestamp: "10:32 AM",
        isMe: true,
        avatar: "/api/placeholder/40/40"
    },
    {
        id: 3,
        sender: "David Wong",
        message: "I've already accepted the invitation. Looking forward to working with everyone!",
        timestamp: "10:35 AM",
        isMe: false,
        avatar: "/api/placeholder/40/40"
    },
    {
        id: 4,
        sender: "You",
        message: "Great! Let's start brainstorming some ideas before the meeting.",
        timestamp: "10:36 AM",
        isMe: true,
        avatar: "/api/placeholder/40/40"
    },
    {
        id: 5,
        sender: "Sarah Johnson",
        message: "Perfect! I'll prepare an agenda and share it with everyone.",
        timestamp: "10:40 AM",
        isMe: false,
        avatar: "/api/placeholder/40/40"
    }
];

const ChatPage = () => {
    const [activeConversation, setActiveConversation] = useState(SAMPLE_CONVERSATIONS[0]);
    const [showMobileConversationList, setShowMobileConversationList] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // 768px is the breakpoint for md in Tailwind
        };

        // Initial check
        handleResize();

        // Add event listener for window resize
        window.addEventListener("resize", handleResize);

        // Cleanup event listener
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleConversationSelect = (conversation: any) => {
        setActiveConversation(conversation);
        if (isMobile) {
            setShowMobileConversationList(false); // Only hide conversation list on mobile
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <main className="flex-1 flex flex-col lg:ml-20 transition-all duration-300">
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Conversation List - Hidden on mobile when in chat view */}
                    <ConversationList
                        conversations={SAMPLE_CONVERSATIONS}
                        activeConversation={activeConversation}
                        onConversationSelect={handleConversationSelect}
                        showOnMobile={showMobileConversationList}
                    />

                    {/* Chat Area - Shown on mobile when not showing conversation list */}
                    <ChatArea
                        conversation={activeConversation}
                        messages={SAMPLE_MESSAGES}
                        showOnMobile={!showMobileConversationList}
                        onBackClick={() => setShowMobileConversationList(true)}
                    />
                </div>
            </main>

            {/* Bottom Navigation for small devices */}
            <div className="lg:hidden">
                <Navigation />
            </div>
        </div>
    );
};

export default ChatPage;