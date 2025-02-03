import { Card } from "../ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const Analytics = () => {
    const data = [
        { name: 'Jan', value: 35000 },
        { name: 'Feb', value: 28000 },
        { name: 'Mar', value: 30000 },
        { name: 'Apr', value: 35000 },
        { name: 'May', value: 40000 },
        { name: 'Jun', value: 25000 },
        { name: 'Jul', value: 22000 },
        { name: 'Aug', value: 20000 },
    ];

    return (
        <Card className="bg-white p-6 rounded-lg">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Analytics</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-sm">Income</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <span className="text-sm">Outcome</span>
                    </div>
                </div>
            </div>
            <div className="h-64">
                {/* <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#2563eb"
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer> */}
            </div>
        </Card>
    );
};
