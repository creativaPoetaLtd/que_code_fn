import Image from "next/image";

interface Transaction {
    id: number;
    image: string; // Path to the image
    name: string;
    type: string;
    amount: string;
    date: string;
}

export const RecentTransactions: React.FC = () => {
    const transactions: Transaction[] = [
        {
            id: 1,
            image: "/Images/spotify.png", // Replace with your image path
            name: "Spotify",
            type: "Monthly Subscription",
            amount: "-$15.00",
            date: "23/10/2024",
        },
        {
            id: 2,
            image: "/Images/paypal.png", // Replace with your image path
            name: "PayPal",
            type: "Earnings",
            amount: "$25.00",
            date: "24/10/2024",
        },
        {
            id: 1,
            image: "/Images/spotify.png", // Replace with your image path
            name: "Spotify",
            type: "Monthly Subscription",
            amount: "-$15.00",
            date: "23/10/2024",
        },
        {
            id: 1,
            image: "/Images/spotify.png", // Replace with your image path
            name: "Spotify",
            type: "Monthly Subscription",
            amount: "-$15.00",
            date: "23/10/2024",
        },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl text-[#00313A] font-semibold">Recent Transactions</h3>
                <button className="text-sm text-gray-500 hover:underline">
                    All transactions →
                </button>
            </div>

            {/* Transactions Table */}
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="p-2 text-gray-600">Transactions</th>
                        <th className="p-2 text-gray-600 text-right">Amount</th>
                        <th className="p-2 text-gray-600 text-right">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-t">
                            <td className="p-2 flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                    <Image
                                        src={transaction.image}
                                        alt={transaction.name}
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="font-medium">{transaction.name}</p>
                                    <p className="text-sm text-gray-500">{transaction.type}</p>
                                </div>
                            </td>
                            <td className="p-2 text-right font-medium">{transaction.amount}</td>
                            <td className="p-2 text-right text-sm text-gray-500">{transaction.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
