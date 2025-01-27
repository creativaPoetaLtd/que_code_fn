import Image from "next/image";

interface Transaction {
    id: number;
    image: string;
    name: string;
    type: string;
    amount: string;
    date: string;
}

export const RecentTransactions: React.FC = () => {
    const transactions: Transaction[] = [
        {
            id: 1,
            image: "/Images/spotify.png",
            name: "Spotify",
            type: "Monthly Subscription",
            amount: "-$15.00",
            date: "23/10/2024",
        },
        {
            id: 2,
            image: "/Images/paypal.png",
            name: "PayPal",
            type: "Earnings",
            amount: "$25.00",
            date: "24/10/2024",
        },
        {
            id: 3,
            image: "/Images/spotify.png",
            name: "Spotify",
            type: "Monthly Subscription",
            amount: "-$15.00",
            date: "23/10/2024",
        },
        {
            id: 4,
            image: "/Images/spotify.png",
            name: "Spotify",
            type: "Monthly Subscription",
            amount: "-$15.00",
            date: "23/10/2024",
        },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6">
                <h3 className="text-xl sm:text-2xl text-[#00313A] font-semibold">Recent Transactions</h3>
                <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center gap-1">
                    <span className="hidden sm:inline">All transactions</span>
                    <span className="inline sm:hidden">View all</span>
                    <span>→</span>
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-gray-100">
                            <th className="px-6 py-3 text-sm font-medium text-gray-600">Transactions</th>
                            <th className="px-6 py-3 text-sm font-medium text-gray-600 text-right">Amount</th>
                            <th className="px-6 py-3 text-sm font-medium text-gray-600 text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            <Image
                                                src={transaction.image}
                                                alt={transaction.name}
                                                width={40}
                                                height={40}
                                                className="object-contain"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{transaction.name}</p>
                                            <p className="text-sm text-gray-500">{transaction.type}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right font-medium">
                                    <span className={transaction.amount.startsWith('-') ? 'text-red-600' : 'text-green-600'}>
                                        {transaction.amount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-gray-500">{transaction.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile List View */}
            <div className="sm:hidden divide-y divide-gray-100">
                {transactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="p-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <Image
                                        src={transaction.image}
                                        alt={transaction.name}
                                        width={40}
                                        height={40}
                                        className="object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{transaction.name}</p>
                                    <p className="text-sm text-gray-500">{transaction.type}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-500">{transaction.date}</span>
                            <span className={`font-medium ${transaction.amount.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                                {transaction.amount}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentTransactions;