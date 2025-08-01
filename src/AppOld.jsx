import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import React, { useState, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusCircle, Trash2, Edit, Save, XCircle, FileDown, AreaChart, ArrowRight, Table } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];
const initialScopeData = {
    dataCategory: '',
    subCategory: '',
    fuelSourceType: '',
    unit: 'litres',
    quantity: 0,
    emissionFactor: 0,
    emissionFactorSource: '',
    dataSource: '',
    collectionFrequency: 'Annually',
    dataQualityNotes: '',
    notes: '',
};

const editableKeys = Object.keys(initialScopeData).filter(
  key => !['id', 'emissionFactorSource', 'dataSource', 'collectionFrequency', 'dataQualityNotes', 'notes'].includes(key)
);

export default function App() {
    const [step, setStep] = useState(1);
    const [generalInfo, setGeneralInfo] = useState({
        reportingYear: new Date().getFullYear(),
        startDate: '', endDate: '', organisationName: '', reportingBoundary: '',
        contactPerson: '', contactEmail: '', dataCollectionMethod: '',
        lastUpdateDate: new Date().toISOString().slice(0, 10),
    });
    const [scope1Data, setScope1Data] = useState([]);
    const [scope2Data, setScope2Data] = useState([]);
    const [scope3Data, setScope3Data] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editingData, setEditingData] = useState({});
    const dashboardRef = useRef(null);
    const tablesRef = useRef(null);

    const handleGeneralInfoChange = (e) => {
        const { name, value } = e.target;
        setGeneralInfo(prev => ({ ...prev, [name]: value }));
    };

    const addRow = (scopeSetter) => {
        scopeSetter(prev => [...prev, { ...initialScopeData, id: Date.now() + Math.random() }]);
    };

    const handleScopeChange = (id, e, scopeData, scopeSetter) => {
        const { name, value } = e.target;
        const updatedData = scopeData.map(item =>
            item.id === id ? { ...item, [name]: value } : item
        );
        scopeSetter(updatedData);
    };

    const removeRow = (id, scopeSetter) => {
        scopeSetter(prev => prev.filter(item => item.id !== id));
        console.log('Row removed:', id);
    };

    const startEditing = (item, scope, scopeSetter) => {
        setEditingId(item.id);
        setEditingData({ ...item, scope, scopeSetter });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingData({});
    };

    const saveEditing = () => {
        const { id, scope, scopeSetter, ...dataToSave } = editingData;
        const updatedData = scope.map(item =>
            item.id === id ? { ...item, ...dataToSave } : item
        );
        scopeSetter(updatedData);
        setEditingId(null);
        setEditingData({});
        console.log('Row saved:', id);
    };

    const handleEditDataChange = (e) => {
        const { name, value } = e.target;
        setEditingData(prev => ({ ...prev, [name]: value }));
    };

    const calculateEmissions = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.emissionFactor) || 0);

    const totalEmissions = useMemo(() => {
        const sum = (data) => data.reduce((acc, item) => acc + calculateEmissions(item), 0);
        return {
            scope1: sum(scope1Data),
            scope2: sum(scope2Data),
            scope3: sum(scope3Data),
        };
    }, [scope1Data, scope2Data, scope3Data]);

    const totalOverallEmissions = totalEmissions.scope1 + totalEmissions.scope2 + totalEmissions.scope3;

    const emissionsBySource = useMemo(() => {
        const allData = [...scope1Data, ...scope2Data, ...scope3Data];
        const sourceMap = {};
        allData.forEach(item => {
            const source = item.subCategory || 'Uncategorized';
            const emissions = calculateEmissions(item);
            sourceMap[source] = (sourceMap[source] || 0) + emissions;
        });
        return Object.entries(sourceMap)
            .map(([name, value]) => ({ name, emissions: value }))
            .sort((a, b) => b.emissions - a.emissions)
            .slice(0, 10);
    }, [scope1Data, scope2Data, scope3Data]);

    const scopeChartData = [
        { name: 'Scope 1', value: totalEmissions.scope1 },
        { name: 'Scope 2', value: totalEmissions.scope2 },
        { name: 'Scope 3', value: totalEmissions.scope3 },
    ].filter(d => d.value > 0);

    const exportToPdf = async () => {
        if (!html2canvas || !jsPDF) {
            console.error("PDF generation libraries not found on window object.");
            alert("Error: Could not generate PDF. Please try again later.");
            return;
        }

        const dashboardCanvas = await html2canvas(dashboardRef.current, { scale: 2 });
        const tablesCanvas = await html2canvas(tablesRef.current, { scale: 2 });

        const dashboardImgData = dashboardCanvas.toDataURL('image/png');
        const tablesImgData = tablesCanvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.setFontSize(20);
        pdf.text(`${generalInfo.organisationName} - Carbon Footprint Report`, 14, 22);
        pdf.setFontSize(12);
        pdf.text(`Reporting Year: ${generalInfo.reportingYear}`, 14, 30);

        const dashboardImgProps = pdf.getImageProperties(dashboardImgData);
        const dashboardImgHeight = (dashboardImgProps.height * pdfWidth) / dashboardImgProps.width;
        pdf.addImage(dashboardImgData, 'PNG', 0, 40, pdfWidth, dashboardImgHeight);

        pdf.addPage();
        pdf.setFontSize(20);
        pdf.text('Detailed Emissions Data', 14, 22);

        const tablesImgProps = pdf.getImageProperties(tablesImgData);
        const tablesImgHeight = (tablesImgProps.height * pdfWidth) / tablesImgProps.width;

        if (tablesImgHeight > (pdfHeight - 30)) {
            pdf.addImage(tablesImgData, 'PNG', 0, 30, pdfWidth, pdfHeight - 30);
            pdf.addPage();
            pdf.addImage(tablesImgData, 'PNG', 0, -(pdfHeight - 30), pdfWidth, tablesImgHeight);
        } else {
            pdf.addImage(tablesImgData, 'PNG', 0, 30, pdfWidth, tablesImgHeight);
        }

        pdf.save(`${generalInfo.organisationName}_Carbon_Report_${generalInfo.reportingYear}.pdf`);
    };

    // --- UI Components ---
    const GeneralInfoForm = () => (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Organisation Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(generalInfo).map(([key, value]) => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <input
                            type={key.includes('Date') ? 'date' : (key.includes('Email') ? 'email' : 'text')}
                            name={key}
                            value={value}
                            onChange={handleGeneralInfoChange}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
    
    const ScopeTable = ({ title, data, setData, scopeColor }) => (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mt-8 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold`} style={{ color: scopeColor }}>{title}</h2>
                <button
                    onClick={() => addRow(setData)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-md">
                    <PlusCircle size={20} /> Add Row
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm text-left text-gray-600">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 rounded-t-lg">
                        <tr>
                            {['Data Category', 'Sub Category', 'Fuel/Source Type', 'Unit', 'Quantity', 'Emission Factor', 'Emissions (Kg/CO2)', 'Actions'].map(h => 
                                <th key={h} scope="col" className="px-4 py-3">{h}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(item => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                {Object.keys(initialScopeData).filter(k => !['id', 'emissionFactorSource', 'dataSource', 'collectionFrequency', 'dataQualityNotes', 'notes'].includes(k)).map(key => (
                                    <td key={key} className="px-4 py-3">
                                        {key === 'unit' ? (
                                            <select name={key} value={item[key]} onChange={(e) => handleScopeChange(item.id, e, data, setData)} className="w-full p-2 bg-transparent border-gray-200 rounded-md">
                                                <option>litres</option><option>kg</option><option>kWh</option><option>tonnes</option><option>m³</option>
                                            </select>
                                        ) : (
                                            <input
                                                type={['quantity', 'emissionFactor'].includes(key) ? 'number' : 'text'}
                                                name={key}
                                                value={item[key]}
                                                onChange={(e) => handleScopeChange(item.id, e, data, setData)}
                                                className="w-full p-2 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none transition-colors"
                                                placeholder={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                            />
                                        )}
                                    </td>
                                ))}
                                <td className="px-4 py-3 font-semibold text-gray-800">{calculateEmissions(item).toFixed(2)}</td>
                                <td className="px-4 py-3 flex items-center gap-2">
                                     <button onClick={() => startEditing(item, data, setData)} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={18} /></button>
                                     <button onClick={() => removeRow(item.id, setData)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const EditingModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Edit Emission Entry</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.keys(initialScopeData).map(key => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input
                                type={['quantity', 'emissionFactor'].includes(key) ? 'number' : 'text'}
                                name={key}
                                value={editingData[key] || ''}
                                onChange={handleEditDataChange}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={cancelEditing} className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                        <XCircle size={20} /> Cancel
                    </button>
                    <button onClick={saveEditing} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 shadow-md">
                        <Save size={20} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );

    const DataEntryView = () => (
        <>
            <GeneralInfoForm />
            <ScopeTable title="Scope 1 Emissions" data={scope1Data} setData={setScope1Data} scopeColor="#0088FE" />
            <ScopeTable title="Scope 2 Emissions" data={scope2Data} setData={setScope2Data} scopeColor="#00C49F" />
            <ScopeTable title="Scope 3 Emissions" data={scope3Data} setData={setScope3Data} scopeColor="#FFBB28" />

            <div className="mt-10 flex justify-center">
                <button 
                    onClick={() => setStep(2)} 
                    disabled={totalOverallEmissions === 0}
                    className="flex items-center gap-3 text-lg font-semibold px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300">
                    Generate Dashboard <AreaChart size={24}/>
                </button>
            </div>
        </>
    );

    const DashboardView = () => (
        <div>
            <div className="flex justify-between items-center mb-8">
                 <button onClick={() => setStep(1)} className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                    <ArrowRight className="transform rotate-180" size={20} /> Back to Data Entry
                </button>
                <h1 className="text-4xl font-extrabold text-gray-800 text-center">Emissions Dashboard</h1>
                 <button onClick={exportToPdf} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 shadow-md">
                    <FileDown size={20} /> Export PDF
                </button>
            </div>

            <div ref={dashboardRef} className="p-4 bg-gray-50 rounded-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* KPI Cards */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-center items-center lg:col-span-1">
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">Total Emissions</h3>
                        <p className="text-5xl font-bold text-gray-800">{totalOverallEmissions.toFixed(2)}</p>
                        <p className="text-gray-500 mt-1">Kg/CO2e</p>
                    </div>
                     <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">Scope 1</h3>
                        <p className="text-4xl font-bold text-blue-500">{totalEmissions.scope1.toFixed(2)}</p>
                        <p className="text-gray-500 mt-1">Kg/CO2e</p>
                    </div>
                     <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">Scope 2</h3>
                        <p className="text-4xl font-bold text-green-500">{totalEmissions.scope2.toFixed(2)}</p>
                         <p className="text-gray-500 mt-1">Kg/CO2e</p>
                    </div>
                     <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">Scope 3</h3>
                        <p className="text-4xl font-bold text-amber-500">{totalEmissions.scope3.toFixed(2)}</p>
                         <p className="text-gray-500 mt-1">Kg/CO2e</p>
                    </div>

                    {/* Pie Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Emissions by Scope</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={scopeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {scopeChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value.toFixed(2)} Kg/CO2e`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar Chart */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-700 mb-4">Top Emission Sources</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={emissionsBySource} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => `${value.toFixed(2)} Kg/CO2e`} />
                                <Legend />
                                <Bar dataKey="emissions" name="Emissions (Kg/CO2e)" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div ref={tablesRef} className="mt-8 bg-white p-4">
                <h2 className="text-2xl font-bold text-gray-800 my-4">Detailed Data</h2>
                <DataTable title="Scope 1" data={scope1Data} />
                <DataTable title="Scope 2" data={scope2Data} />
                <DataTable title="Scope 3" data={scope3Data} />
            </div>

        </div>
    );

    const DataTable = ({ title, data }) => (
        <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            {['Data Category', 'Sub Category', 'Fuel/Source', 'Quantity', 'Unit', 'Emission Factor', 'Emissions'].map(h => <th key={h} className="px-4 py-2">{h}</th>)}
                        </tr>
                     </thead>
                     <tbody>
                        {data.map(item => (
                            <tr key={item.id} className="border-b">
                                <td className="px-4 py-2">{item.dataCategory}</td>
                                <td className="px-4 py-2">{item.subCategory}</td>
                                <td className="px-4 py-2">{item.fuelSourceType}</td>
                                <td className="px-4 py-2">{item.quantity}</td>
                                <td className="px-4 py-2">{item.unit}</td>
                                <td className="px-4 py-2">{item.emissionFactor}</td>
                                <td className="px-4 py-2 font-bold">{calculateEmissions(item).toFixed(2)}</td>
                            </tr>
                        ))}
                     </tbody>
                </table>
            </div>
        </div>
    );
    

    // --- Main Render ---
    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500">
                        Carbon Footprint Calculator
                    </h1>
                     <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 ${step === 1 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                           <Table size={24} />
                           <span>Data Entry</span>
                        </div>
                        <div className="text-gray-300"> <ArrowRight/> </div>
                         <div className={`flex items-center space-x-2 ${step === 2 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                           <AreaChart size={24}/>
                           <span>Dashboard</span>
                        </div>
                     </div>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {step === 1 && <DataEntryView />}
                {step === 2 && <DashboardView />}
            </main>
            {editingId && <EditingModal />}
            <footer className="text-center py-6 text-gray-500 text-sm">
                <p>Built with React, Tailwind CSS, and Recharts. © {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
}
