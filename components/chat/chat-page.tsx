import RealChatPage from "@/components/chat/real-chat-page";
import ChatPageClean from "@/components/chat/chat-page-clean";

// Use real chat page for production, clean page for fallback
export default function ChatPage() {
    // You can add a feature flag here to switch between implementations
    const useRealChat = process.env.NODE_ENV === "development" || true; // Enable for all environments
    
    return useRealChat ? <RealChatPage /> : <ChatPageClean />;
}

// Export sample data for backward compatibility
export { SAMPLE_CONVERSATIONS, SAMPLE_MESSAGES } from "./chat-page-clean";
