import Image from "next/image";

interface Message {
    id: number;
    avatar: string;
    senderName: string;
    subject: string;
    preview: string;
    timestamp: string;
}

export const RecentMessages: React.FC = () => {
    const messages: Message[] = [
        {
            id: 1,
            avatar: "/Images/Profile.png",
            senderName: "John Doe",
            subject: "Meeting Reminder",
            preview: "Don't forget about the meeting scheduled for tomorrow at 10 AM.",
            timestamp: "10:45",
        },
        {
            id: 2,
            avatar: "/Images/Profile.png",
            senderName: "Jane Smith",
            subject: "Project Update",
            preview: "The project is progressing well; here are the latest updates...",
            timestamp: "09:38",
        },
        {
            id: 3,
            avatar: "/Images/Profile.png",
            senderName: "Bob Johnson",
            subject: "Follow-up",
            preview: "Just checking in on the status of the proposal.",
            timestamp: "Yesterday",
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100">
                <h3 className="text-base sm:text-lg text-[#00313A] font-semibold">
                    Recent messages
                </h3>
                <button className="text-sm text-[#00B512] hover:text-[#00B512]/80 transition-colors duration-200 font-medium">
                    View all
                </button>
            </div>

            <div className="divide-y divide-gray-100">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className="p-2.5 sm:p-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                        <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden flex-shrink-0 text-white font-semibold text-xs">
                                {message.senderName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-0">
                                    <p className="font-semibold text-gray-900 truncate text-xs">{message.senderName}</p>
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                        {message.timestamp}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-1">{message.preview}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentMessages;