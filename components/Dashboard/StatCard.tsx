import { Card } from "../ui/card";

interface StatCardProps {
    title: string;
    amount: string;
    percentage: number;
    type?: 'income' | 'outcome'
}

export const StatCard = ({ title, amount, percentage, type }: StatCardProps) => {
    return (
        <Card className="bg-white p-6 rounded-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <h3 className="text-2xl font-semibold mt-1">${amount}</h3>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                    {percentage}%
                </div>
            </div>
        </Card>
    )
}
