import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';

const calculateEmissions = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.emissionFactor) || 0);

const WATERFALL_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d0ed57', '#a4de6c', '#8dd1e1', '#83a6ed', '#8e44ad', '#c0392b'];

const WaterfallChart = ({ scope1Data, scope2Data, scope3Data }) => {
    const waterfallData = useMemo(() => {
        const processScope = (data) => {
            const byCategory = data.reduce((acc, item) => {
                const category = item.subCategory || 'Uncategorized';
                const emissions = calculateEmissions(item);
                if (!acc[category]) {
                    acc[category] = 0;
                }
                acc[category] += emissions;
                return acc;
            }, {});
            return Object.entries(byCategory).map(([name, value]) => ({ name, value }));
        };

        const scope1Categories = processScope(scope1Data);
        const scope2Categories = processScope(scope2Data);
        const scope3Categories = processScope(scope3Data);

        let cumulative = 0;
        const data = [];

        scope1Categories.forEach(({ name, value }) => {
            data.push({ name, value, range: [cumulative, cumulative += value] });
        });
        scope2Categories.forEach(({ name, value }) => {
            data.push({ name, value, range: [cumulative, cumulative += value] });
        });
        scope3Categories.forEach(({ name, value }) => {
            data.push({ name, value, range: [cumulative, cumulative += value] });
        });

        data.push({ name: 'Total', value: cumulative, range: [0, cumulative] });

        return data;
    }, [scope1Data, scope2Data, scope3Data]);

    return (
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Emissions Waterfall</h3>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={waterfallData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value, name, props) => {
                        if (props.payload.name === 'Total') {
                            return `${props.payload.value.toFixed(2)} Kg/CO2e`;
                        }
                        return `${props.payload.value.toFixed(2)} Kg/CO2e`;
                    }} />
                    <Legend />
                    <Bar dataKey="range" name="Emissions">
                        {waterfallData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Total' ? '#555' : WATERFALL_COLORS[index % WATERFALL_COLORS.length]} />
                        ))}
                        <LabelList
                            dataKey="value"
                            position="right"
                            formatter={(value) => (value > 0 ? value.toFixed(2) : '')}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WaterfallChart;
