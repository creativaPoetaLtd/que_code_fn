import Image from "next/image";

interface Message {
    id: number;
    avatar: string; // Path to the sender's avatar
    senderName: string;
    subject: string;
    preview: string; // A short preview of the message content
    timestamp: string;
}

export const RecentMessages: React.FC = () => {
    const messages: Message[] = [
        {
            id: 1,
            avatar: "/Images/Profile.png", // Replace with your image path
            senderName: "John Doe",
            subject: "Meeting Reminder",
            preview: "Don't forget about the meeting scheduled for tomorrow at 10 AM.",
            timestamp: "01/01/2025, 10:00 AM",
        },
        {
            id: 2,
            avatar: "/Images/Profile.png", // Replace with your image path
            senderName: "Jane Smith",
            subject: "Project Update",
            preview: "The project is progressing well; here are the latest updates...",
            timestamp: "31/12/2024, 4:00 PM",
        },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl text-[#00313A] font-semibold">Recent Messages</h3>
                <button className="text-sm text-gray-500 hover:underline">
                    All messages →
                </button>
            </div>

            {/* Messages Table */}
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 text-gray-600">Messages</th>
                        <th className="p-2 text-gray-600 text-right">Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    {messages.map((message) => (
                        <tr key={message.id} className="border-t">
                            <td className="p-2 flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    <Image
                                        src={message.avatar}
                                        alt={message.senderName}
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="font-medium">{message.senderName}</p>
                                    <p className="text-sm text-gray-500">{message.subject}</p>
                                    <p className="text-xs text-gray-400">{message.preview}</p>
                                </div>
                            </td>
                            <td className="p-2 text-right text-sm text-gray-500">{message.timestamp}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
