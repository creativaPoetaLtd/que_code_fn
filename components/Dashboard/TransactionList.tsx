import { Card } from "../ui/card";
import { Search } from "lucide-react";


export const TransactionList = () => {
    const transactions = [
        { id: 1, name: 'Spotify', date: 'Sat,20 Apr 2020', amount: 80.09, status: 'Deposited' },
        { id: 2, name: 'PayPal', date: 'Fri,19 Apr 2020', amount: 7.03, status: 'Deposited' },
        { id: 3, name: 'Spotify', date: 'tue,19 Apr 2020', amount: 30.09, status: 'Deposited' },
    ];

    return (
        <Card className="bg-white p-6 rounded-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Transaction</h2>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search for anything..."
                            className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>10 May - 20 May</option>
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-gray-600">
                            <th className="pb-4">Name</th>
                            <th className="pb-4">Date</th>
                            <th className="pb-4">Amount</th>
                            <th className="pb-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr key={transaction.id} className="border-t">
                                <td className="py-4">{transaction.name}</td>
                                <td className="py-4 text-gray-600">{transaction.date}</td>
                                <td className="py-4">${transaction.amount}</td>
                                <td className="py-4">
                                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                                        {transaction.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
