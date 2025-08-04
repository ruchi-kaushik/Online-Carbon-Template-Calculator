import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

const calculateEmissions = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.emissionFactor) || 0);

const BubbleChart = ({ scope1Data, scope2Data, scope3Data }) => {
    const bubbleData = useMemo(() => {
        const processData = (data, scopeName) => {
            return data.map(item => ({
                name: item.subCategory || 'Uncategorized',
                scope: scopeName,
                quantity: parseFloat(item.quantity) || 0,
                emissionFactor: parseFloat(item.emissionFactor) || 0,
                emissions: calculateEmissions(item),
            }));
        };

        return [
            ...processData(scope1Data, 'Scope 1'),
            ...processData(scope2Data, 'Scope 2'),
            ...processData(scope3Data, 'Scope 3'),
        ];
    }, [scope1Data, scope2Data, scope3Data]);

    const scopeColors = {
        'Scope 1': '#0000FF',
        'Scope 2': '#008000',
        'Scope 3': '#FFBF00',
    };

    return (
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Emissions Bubble Chart</h3>
            <ResponsiveContainer width="100%" height={500}>
                <ScatterChart
                    margin={{
                        top: 30,
                        right: 20,
                        bottom: 40,
                        left: 20,
                    }}
                >
                    <CartesianGrid />
                    <XAxis
                        type="number"
                        dataKey="quantity"
                        name="Quantity"
                        unit=""                                            
                        label={{ value: 'Quantity', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis type="number" dataKey="emissionFactor" name="Emission Factor" unit="" label={{ value: 'Emission Factor', angle: -90, position: 'insideLeft', offset: -10 }} />
                    <ZAxis type="number" dataKey="emissions" range={[100, 1000]} name="Emissions" unit="Kg/CO2e" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    {Object.keys(scopeColors).map(scope => (
                        <Scatter key={scope} name={scope} data={bubbleData.filter(d => d.scope === scope)} fill={scopeColors[scope]}>
                            <LabelList dataKey="name" position="top" />
                        </Scatter>
                    ))}
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BubbleChart;
