import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

const calculateEmissions = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.emissionFactor) || 0);

const WaterfallChart = ({ scope1Data, scope2Data, scope3Data }) => {
    const waterfallData = useMemo(() => {
        const sum = (data) => data.reduce((acc, item) => acc + calculateEmissions(item), 0);

        const scope1Total = sum(scope1Data);
        const scope2Total = sum(scope2Data);

        const scope3ByCategory = scope3Data.reduce((acc, item) => {
            const category = item.subCategory || 'Uncategorized';
            const emissions = calculateEmissions(item);
            if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category] += emissions;
            return acc;
        }, {});

        let cumulative = 0;
        const data = [
            { name: 'Scope 1', value: scope1Total, range: [cumulative, cumulative += scope1Total] },
            { name: 'Scope 2', value: scope2Total, range: [cumulative, cumulative += scope2Total] },
        ];

        Object.entries(scope3ByCategory).forEach(([name, value]) => {
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
                    <Bar dataKey="range" name="Emissions" fill="#8884d8">
                        {waterfallData.map((entry, index) => (
                            <LabelList
                                key={index}
                                dataKey="value"
                                position="right"
                                formatter={(value) => (entry.name === 'Total' ? '' : value.toFixed(2))}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WaterfallChart;
