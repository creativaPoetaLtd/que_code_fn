import RealChatPage from "@/components/chat/real-chat-page";
import ChatPageClean from "@/components/chat/chat-page-clean";

export default function ChatPage() {
    const useRealChat = process.env.NODE_ENV === "development" || true;
    
    return useRealChat ? <RealChatPage /> : <ChatPageClean />;
}
