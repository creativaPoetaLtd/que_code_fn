import { Card } from "../ui/card";

export const ExpenseStats = () => {
    const data = [
        { name: 'Entertainment', value: 30, color: '#1e40af' },
        { name: 'Bill Expense', value: 15, color: '#f97316' },
        { name: 'Investment', value: 20, color: '#e11d48' },
        { name: 'Others', value: 35, color: '#2563eb' },
    ];

    return (
        <Card className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Expense Statistics</h2>
            <div className="flex justify-center">
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {data.reduce<{ elements: JSX.Element[], total: number }>((acc, item) => {
                            const prevTotal = acc.total;
                            const total = prevTotal + item.value;

                            acc.elements.push(
                                <circle
                                    key={item.name}
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke={item.color}
                                    strokeWidth="20"
                                    strokeDasharray={`${item.value * 2.51} 251`}
                                    strokeDashoffset={-prevTotal * 2.51}
                                    className="transition-all duration-1000"
                                />
                            );
                            acc.total = total;
                            return acc;
                        }, { elements: [], total: 0 }).elements}
                    </svg>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.name} ({item.value}%)</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};