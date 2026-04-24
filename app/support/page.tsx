"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Headphones, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { useSidebar } from "@/context/SidebarContext";
import { socketService } from "@/services/socketService";
import { useAuthToken } from "@/hooks/use-auth-token";
import {
  useCreateOrGetSupportChatMutation,
  useGetSupportChatMessagesQuery,
  useSendSupportMessageMutation,
  useMarkSupportChatAsReadMutation,
} from "@/states/chatSlice";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SupportMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: string;
  status: string;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export default function SupportPage() {
  const router = useRouter();
  const { getToken, getUserId } = useAuthToken();
  const userId = getUserId();

  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const { isExpanded } = useSidebar();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [createOrGetSupportChat] = useCreateOrGetSupportChatMutation();
  const [sendSupportMessage] = useSendSupportMessageMutation();
  const [markSupportChatAsRead] = useMarkSupportChatAsReadMutation();

  const {
    data: messagesData,
    refetch: refetchMessages,
    isFetching: isLoadingMessages,
  } = useGetSupportChatMessagesQuery(
    { chatId: chatId!, page: 1, limit: 100 },
    { skip: !chatId }
  );

  // Initialize support chat on mount
  useEffect(() => {
    const init = async () => {
      try {
        const result = await createOrGetSupportChat({}).unwrap();
        const id = result?.data?.id;
        if (id) {
          setChatId(id);
        }
      } catch (err) {
        toast({ title: "Error", description: "Could not start support chat.", variant: "destructive" });
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // Populate messages from RTK Query and mark as read
  useEffect(() => {
    if (messagesData?.data?.messages) {
      setMessages(messagesData.data.messages);
      // Mark as read whenever fresh messages arrive (chat is open)
      if (chatId) {
        markSupportChatAsRead({ chatId }).catch(() => {});
      }
    }
  }, [messagesData, chatId]);

  // Socket: join chat room and listen for new messages
  useEffect(() => {
    if (!chatId || !userId) return;

    const token = getToken();
    const socket = socketService.connect(userId, token ?? undefined);

    const joinSupportRoom = () => {
      socketService.joinChat(chatId);
    };

    if (socket.connected) {
      joinSupportRoom();
    }

    const handleNewMessage = (msg: SupportMessage) => {
      if (msg.chatId === chatId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          return exists ? prev : [...prev, msg];
        });
        // User is viewing the chat — mark as read immediately
        markSupportChatAsRead({ chatId }).catch(() => {});
      }
    };

    socket.on("connect", joinSupportRoom);
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("connect", joinSupportRoom);
      socket.off("new_message", handleNewMessage);
      socketService.leaveChat(chatId);
      socketService.disconnect();
    };
  }, [chatId, userId]);

  // Polling fallback for missed websocket events
  useEffect(() => {
    if (!chatId) return;

    const interval = setInterval(() => {
      refetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [chatId, refetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when the bottom sentinel comes into view (user scrolled to bottom)
  useEffect(() => {
    if (!chatId || !bottomRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          markSupportChatAsRead({ chatId }).catch(() => {});
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [chatId, messages]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !chatId || isSending) return;

    setInputText("");
    setIsSending(true);

    try {
      await sendSupportMessage({ chatId, content: text, messageType: "text" }).unwrap();
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
      setInputText(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, chatId, isSending, sendSupportMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const isOwnMessage = (msg: SupportMessage) => msg.senderId === userId;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          <p className="text-sm">Connecting to support…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <main
        className={cn(
          "flex flex-col flex-1 min-h-screen",
          isExpanded ? "lg:ml-64" : "lg:ml-20"
        )}
      >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Support Team</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">We typically reply within a few hours</p>
          </div>
        </div>
        <button
          onClick={() => refetchMessages()}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Refresh"
          disabled={isLoadingMessages}
        >
          <RefreshCw className={cn("w-4 h-4 text-gray-500", isLoadingMessages && "animate-spin")} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-32 lg:pb-24">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Headphones className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold">Start a conversation</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xs">
              Send a message and our support team will get back to you as soon as possible.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const own = isOwnMessage(msg);
          return (
            <div key={msg.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                  own
                    ? "bg-green-500 text-white rounded-br-sm"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
                )}
              >
                {!own && msg.sender && (
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">
                    {msg.sender.firstName} {msg.sender.lastName}
                  </p>
                )}
                <p className="break-words leading-relaxed">{msg.content}</p>
                <p className={cn("text-[10px] mt-1 text-right", own ? "text-green-100" : "text-gray-400 dark:text-gray-500")}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className={cn(
          "fixed bottom-16 lg:bottom-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3",
          isExpanded ? "lg:left-64" : "lg:left-20",
          "left-0"
        )}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-2xl border border-gray-200 dark:border-gray-600",
              "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white",
              "px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400",
              "max-h-32 overflow-y-auto"
            )}
            style={{ minHeight: "40px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isSending}
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              inputText.trim() && !isSending
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      </main>
    </div>
  );
}
