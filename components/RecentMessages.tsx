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
            timestamp: "01/01/2025, 10:00 AM",
        },
        {
            id: 2,
            avatar: "/Images/Profile.png",
            senderName: "Jane Smith",
            subject: "Project Update",
            preview: "The project is progressing well; here are the latest updates...",
            timestamp: "31/12/2024, 4:00 PM",
        },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm">
            <div className="flex justify-between items-center p-4 sm:p-6">
                <h3 className="text-xl sm:text-2xl text-[#00313A] font-semibold">Recent Messages</h3>
                <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center gap-1">
                    <span className="hidden sm:inline">All messages</span>
                    <span className="inline sm:hidden">View all</span>
                    <span>→</span>
                </button>
            </div>

            <div className="hidden sm:block">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-gray-100">
                            <th className="px-6 py-3 text-sm font-medium text-gray-600">Messages</th>
                            <th className="px-6 py-3 text-sm font-medium text-gray-600 text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {messages.map((message) => (
                            <tr
                                key={message.id}
                                className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <Image
                                                src={message.avatar}
                                                alt={message.senderName}
                                                width={40}
                                                height={40}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-900">{message.senderName}</p>
                                            <p className="text-sm font-medium text-gray-700 truncate">{message.subject}</p>
                                            <p className="text-sm text-gray-500 line-clamp-1">{message.preview}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500 whitespace-nowrap">
                                    {message.timestamp}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="sm:hidden divide-y divide-gray-100">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className="p-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image
                                    src={message.avatar}
                                    alt={message.senderName}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-medium text-gray-900 truncate">{message.senderName}</p>
                                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                        {message.timestamp.split(',')[0]}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-gray-700 truncate">{message.subject}</p>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{message.preview}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentMessages;