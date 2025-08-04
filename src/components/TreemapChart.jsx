import React, { useMemo } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d0ed57', '#a4de6c', '#8dd1e1', '#83a6ed', '#8e44ad', '#c0392b'];

const calculateEmissions = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.emissionFactor) || 0);

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const { name, value, children } = payload[0].payload;
        const totalValue = children ? children.reduce((acc, child) => acc + child.value, 0) : value;
        return (
            <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
                <p className="font-bold">{name}</p>
                <p>Emissions: {totalValue.toFixed(2)} Kg/CO2e</p>
            </div>
        );
    }
    return null;
};

const TreemapChart = ({ scope1Data, scope2Data, scope3Data }) => {
    const treemapData = useMemo(() => {
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

        const scope3Children = Object.entries(scope3ByCategory).map(([name, value]) => ({
            name,
            value,
        }));

        return [
            {
                name: 'Scope 1',
                value: scope1Total,
                children: [{ name: 'Scope 1', value: scope1Total }],
            },
            {
                name: 'Scope 2',
                value: scope2Total,
                children: [{ name: 'Scope 2', value: scope2Total }],
            },
            {
                name: 'Scope 3',
                children: scope3Children,
            },
        ].filter(item => (item.value > 0 || (item.children && item.children.length > 0)));
    }, [scope1Data, scope2Data, scope3Data]);

    return (
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Emissions Treemap</h3>
            <ResponsiveContainer width="100%" height={300}>
                <Treemap
                    data={treemapData}
                    dataKey="value"
                    ratio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                    content={<CustomizedContent colors={COLORS} />}
                >
                    <Tooltip content={<CustomTooltip />} />
                </Treemap>
            </ResponsiveContainer>
        </div>
    );
};

const CustomizedContent = ({ root, depth, x, y, width, height, index, colors, name }) => {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: colors[index % colors.length],
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            {width > 80 && height > 20 && (
                <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14}>
                    {name}
                </text>
            )}
        </g>
    );
};

export default TreemapChart;
