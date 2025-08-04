import React, { useMemo } from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

const calculateEmissions = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.emissionFactor) || 0);

const SCOPE_COLORS = {
    'Scope 1': '#0000FF',
    'Scope 2': '#008000',
    'Scope 3': '#FFBF00',
};

const shadeColor = (color, percent) => {
    let f = parseInt(color.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = f >> 16,
        G = (f >> 8) & 0x00ff,
        B = f & 0x0000ff;
    return (
        '#' +
        (
            0x1000000 +
            (Math.round((t - R) * p) + R) * 0x10000 +
            (Math.round((t - G) * p) + G) * 0x100 +
            (Math.round((t - B) * p) + B)
        )
            .toString(16)
            .slice(1)
    );
};

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
        const processScopeData = (data, scopeName) => {
            const byCategory = data.reduce((acc, item) => {
                const category = item.subCategory || 'Uncategorized';
                const emissions = calculateEmissions(item);
                if (!acc[category]) {
                    acc[category] = 0;
                }
                acc[category] += emissions;
                return acc;
            }, {});

            const children = Object.entries(byCategory).map(([name, value]) => ({
                name,
                value,
            }));

            const total = children.reduce((acc, child) => acc + child.value, 0);

            return {
                name: scopeName,
                value: total,
                children,
            };
        };

        return [
            processScopeData(scope1Data, 'Scope 1'),
            processScopeData(scope2Data, 'Scope 2'),
            processScopeData(scope3Data, 'Scope 3'),
        ].filter(item => item.value > 0);
    }, [scope1Data, scope2Data, scope3Data]);

    return (
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Emissions Treemap</h3>
            <ResponsiveContainer width="100%" height={500}>
                <Treemap
                    data={treemapData}
                    dataKey="value"
                    ratio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                    content={<CustomizedContent />}
                >
                    <Tooltip content={<CustomTooltip />} />
                </Treemap>
            </ResponsiveContainer>
        </div>
    );
};

const CustomizedContent = ({ root, depth, x, y, width, height, index, name }) => {
    const parentName = root.children[index]?.name;
    const baseColor = SCOPE_COLORS[name] || (depth === 1 ? SCOPE_COLORS[parentName] : '#8884d8');
    
    const shade = depth < 2 ? 0 : (index % 5) * 0.15;
    const color = shadeColor(baseColor, shade);

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: color,
                    stroke: '#fff',
                    strokeWidth: 2 / (depth + 1e-10),
                    strokeOpacity: 1 / (depth + 1e-10),
                }}
            />
            <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={14}>
                {name}
            </text>
        </g>
    );
};

export default TreemapChart;
