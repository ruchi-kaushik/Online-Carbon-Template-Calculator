import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { PlusCircle, Trash2, Edit, Save, XCircle, FileDown, AreaChart, ArrowRight, Table } from 'lucide-react';
import Notification from './components/Notification';
import ConfirmationDialog from './components/ConfirmationDialog';
import WaterfallChart from './components/WaterfallChart';
import BubbleChart from './components/BubbleChart';

// --- CONSTANTS AND UTILITY FUNCTIONS (TOP LEVEL) ---
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const initialScopeData = {
    dataCategory: '',
    subCategory: '',
    fuelSourceType: '',
    unit: 'litres',
    quantity: 0,
    emissionFactor: 0,
    date: new Date().toISOString().slice(0, 10),
    emissionFactorSource: '',
    dataSource: '',
    collectionFrequency: 'Annually',
    dataQualityNotes: '',
    notes: '',
};

const editableKeys = [
    'dataCategory',
    'subCategory',
    'fuelSourceType',
    'unit',
    'quantity',
    'emissionFactor',    
];

const modalEditableKeys = Object.keys(initialScopeData);

const calculateEmissions = (item) => (parseFloat(item.quantity) || 0) * (parseFloat(item.emissionFactor) || 0);

// --- COMPONENT DEFINITIONS (MOVED OUTSIDE OF APP) ---

const GeneralInfoForm = ({ generalInfo, handleGeneralInfoChange }) => (
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

const ScopeTable = ({ title, data, setData, scopeColor, handleScopeChange, addRow, removeRow, startEditing }) => (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mt-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold" style={{ color: scopeColor }}>{title}</h2>
            <button
                type="button"
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
                            {editableKeys.map(key => (
                                <td key={key} className="px-4 py-3">
                                    {key === 'unit' ? (
                                        <select
                                            name={key}
                                            value={item[key] ?? ''}
                                            onChange={handleScopeChange(setData)(item.id)}
                                            className="w-full p-2 bg-transparent border-gray-200 rounded-md">
                                            <option>litres</option>
                                            <option>kg</option>
                                            <option>kWh</option>
                                            <option>tonnes</option>
                                            <option>m³</option>
                                            <option>km</option>
                                            <option>miles</option>
                                            <option>MWh</option>
                                            <option>GJ</option>
                                            <option>pounds</option>
                                            <option>gallons</option>
                                            <option>cubic feet</option>
                                            <option>hectares</option>
                                            <option>acres</option>
                                        </select>
                                    ) : (
                                        <input
                                            type={key === 'date' ? 'date' : ['quantity', 'emissionFactor'].includes(key) ? 'number' : 'text'}
                                            {...(['quantity', 'emissionFactor'].includes(key) && { min: "0", step: "any" })}
                                            name={key}
                                            value={item[key] ?? ''}
                                            onChange={handleScopeChange(setData)(item.id)}
                                            className="w-full p-2 bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none transition-colors"
                                            placeholder={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                        />
                                    )}
                                </td>
                            ))}
                            <td className="px-4 py-3 font-semibold text-gray-800">{calculateEmissions(item).toFixed(2)}</td>
                            <td className="px-4 py-3 flex items-center gap-2">
                                <button type="button" onClick={() => startEditing(item, setData)} className="text-blue-600 hover:text-blue-800 p-1"><Edit size={18} /></button>
                                <button type="button" onClick={() => removeRow(item.id, setData)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const EditingModal = ({ editingId, editingData, handleEditDataChange, saveEditing, cancelEditing }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Edit Emission Entry (ID: {editingId})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modalEditableKeys.map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <input
                            type={['quantity', 'emissionFactor'].includes(key) ? 'number' : 'text'}
                            {...(['quantity', 'emissionFactor'].includes(key) && { min: "0", step: "any" })}
                            name={key}
                            value={editingData[key] ?? ''}
                            onChange={handleEditDataChange}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-end gap-4">
                <button type="button" onClick={cancelEditing} className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <XCircle size={20} /> Cancel
                </button>
                <button type="button" onClick={saveEditing} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 shadow-md">
                    <Save size={20} /> Save Changes
                </button>
            </div>
        </div>
    </div>
);

const DataEntryView = ({ 
    generalInfo, handleGeneralInfoChange,
    scope1Data, setScope1Data,
    scope2Data, setScope2Data,
    scope3Data, setScope3Data,
    handleScopeChange, addRow, removeRow, startEditing,
    setStep, totalOverallEmissions
}) => (
    <>
        <GeneralInfoForm generalInfo={generalInfo} handleGeneralInfoChange={handleGeneralInfoChange} />
        <ScopeTable
            title="Scope 1 Emissions"
            data={scope1Data}
            setData={setScope1Data}
            scopeColor="#0088FE"
            handleScopeChange={handleScopeChange} addRow={addRow} removeRow={removeRow} startEditing={startEditing}
        />
        <ScopeTable
            title="Scope 2 Emissions"
            data={scope2Data}
            setData={setScope2Data}
            scopeColor="#00C49F"
            handleScopeChange={handleScopeChange} addRow={addRow} removeRow={removeRow} startEditing={startEditing}
        />
        <ScopeTable
            title="Scope 3 Emissions"
            data={scope3Data}
            setData={setScope3Data}
            scopeColor="#FFBB28"
            handleScopeChange={handleScopeChange} addRow={addRow} removeRow={removeRow} startEditing={startEditing}
        />
        <div className="mt-10 flex justify-center">
            <button
                type="button"
                onClick={() => setStep(2)}
                disabled={totalOverallEmissions === 0}
                className="flex items-center gap-3 text-lg font-semibold px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300">
                Generate Dashboard <AreaChart size={24} />
            </button>
        </div>
    </>
);

const DataTable = ({ title, data }) => (
    <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        {['Data Category', 'Sub Category', 'Fuel/Source', 'Quantity', 'Unit', 'Emission Factor', 'Emissions'].map(h =>
                            <th key={h} className="px-4 py-2">{h}</th>)}
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

const DashboardView = ({
    setStep, exportToPdf, page1Ref,
    totalOverallEmissions, totalEmissions,
    scopeChartData, emissionsBySource, tablesRef,
    scope1Data, scope2Data, scope3Data,
    waterfallRef, bubbleRef
}) => (
    <div>
        <div className="flex justify-between items-center mb-8">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                <ArrowRight className="transform rotate-180" size={20} /> Back to Data Entry
            </button>
            <h1 className="text-4xl font-extrabold text-gray-800 text-center">Emissions Dashboard</h1>
            <button type="button" onClick={exportToPdf} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 shadow-md">
                <FileDown size={20} /> Export PDF
            </button>
        </div>
        <div className="p-4 bg-gray-50 rounded-2xl">
            <div ref={page1Ref}>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
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
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-700 mb-4">Top Emission Sources</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={emissionsBySource} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 20 }}>
                                <XAxis type="number" label={{ value: 'Emissions (Kg/CO2e)', position: 'insideBottom', offset: -40 }} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} label={{ value: 'Sub-Category', angle: -90, position: 'insideLeft', offset: -80 }} />
                                <Tooltip formatter={(value) => `${value.toFixed(2)} Kg/CO2e`} />
                                <Legend />
                                <Bar dataKey="emissions" name="Emissions (Kg/CO2e)" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <div ref={waterfallRef} className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <WaterfallChart scope1Data={scope1Data} scope2Data={scope2Data} scope3Data={scope3Data} />
            </div>
            <div ref={bubbleRef} className="mt-8 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                <BubbleChart scope1Data={scope1Data} scope2Data={scope2Data} scope3Data={scope3Data} />
            </div>
        </div>
        <div ref={tablesRef} className="mt-8 bg-white p-4">
            {/* <h2 className="text-2xl font-bold text-gray-800 my-4">Detailed  Data</h2> */}
            <DataTable title="Scope 1" data={scope1Data} />
            <DataTable title="Scope 2" data={scope2Data} />
            <DataTable title="Scope 3" data={scope3Data} />
        </div>
    </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
    const [step, setStep] = useState(1);
    const [generalInfo, setGeneralInfo] = useState({
        reportingYear: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        organisationName: '',
        reportingBoundary: '',
        contactPerson: '',
        contactEmail: '',
        dataCollectionMethod: '',
        lastUpdateDate: new Date().toISOString().slice(0, 10),
    });

    const [scope1Data, setScope1Data] = useState([
        { id: '1', dataCategory: 'Stationary Combustion', subCategory: 'Natural Gas', fuelSourceType: 'Natural Gas', unit: 'kWh', quantity: 1200, emissionFactor: 0.2, date: '2023-01-15' },
        { id: '2', dataCategory: 'Mobile Combustion', subCategory: 'Company Vehicles', fuelSourceType: 'Diesel', unit: 'litres', quantity: 500, emissionFactor: 2.7, date: '2023-02-20' },
    ]);
    const [scope2Data, setScope2Data] = useState([
        { id: '3', dataCategory: 'Purchased Electricity', subCategory: 'Grid Electricity', fuelSourceType: 'Grid Mix', unit: 'kWh', quantity: 8000, emissionFactor: 0.4, date: '2023-03-10' },
    ]);
    const [scope3Data, setScope3Data] = useState([
        { id: '4', dataCategory: 'Upstream', subCategory: 'Business Travel', fuelSourceType: 'Flights', unit: 'km', quantity: 15000, emissionFactor: 0.15, date: '2023-04-05' },
        { id: '5', dataCategory: 'Upstream', subCategory: 'Employee Commuting', fuelSourceType: 'Car', unit: 'km', quantity: 50000, emissionFactor: 0.12, date: '2023-05-12' },
        { id: '6', dataCategory: 'Downstream', subCategory: 'Waste from Operations', fuelSourceType: 'Landfill', unit: 'kg', quantity: 1200, emissionFactor: 1.5, date: '2023-06-25' },
        { id: '7', dataCategory: 'Upstream', subCategory: 'Purchased Goods', fuelSourceType: 'Office Supplies', unit: 'kg', quantity: 300, emissionFactor: 0.5, date: '2023-07-18' },
    ]);

    const [editingId, setEditingId] = useState(null);
    const [editingData, setEditingData] = useState({});
    const [tag, setTag] = useState('');
    const [notification, setNotification] = useState(null);
    const [recentTags, setRecentTags] = useState([]);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const page1Ref = useRef(null);
    const tablesRef = useRef(null);
    const waterfallRef = useRef(null);
    const bubbleRef = useRef(null);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const response = await fetch('/api/tags');
            if (response.ok) {
                const tags = await response.json();
                setRecentTags(tags);
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
    };

    const saveState = async () => {
        if (!tag) {
            showNotification('Please enter a tag to save your progress.', 'error');
            return;
        }
        const appState = {
            generalInfo,
            scope1Data,
            scope2Data,
            scope3Data,
            step,
        };
        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tag, data: appState }),
            });
            if (response.ok) {
                showNotification(`Progress saved with tag: ${tag}`, 'success');
                fetchTags(); // Refresh the tags list
            } else {
                showNotification('Failed to save progress.', 'error');
            }
        } catch (error) {
            console.error('Error saving state:', error);
            showNotification('Error saving progress.', 'error');
        }
    };

    const loadState = async () => {
        if (!tag) {
            showNotification('Please enter a tag to load your progress.', 'error');
            return;
        }
        try {
            const response = await fetch(`/api/load/${tag}`);
            if (response.ok) {
                const appState = await response.json();
                if (Object.keys(appState).length > 0) {
                    setGeneralInfo(appState.generalInfo || generalInfo);
                    setScope1Data(appState.scope1Data || []);
                    setScope2Data(appState.scope2Data || []);
                    setScope3Data(appState.scope3Data || []);
                    setStep(appState.step || 1);
                    showNotification(`Progress loaded for tag: ${tag}`, 'success');
                } else {
                    showNotification(`No saved data found for tag: ${tag}`, 'info');
                }
            } else {
                showNotification('Failed to load progress.', 'error');
            }
        } catch (error) {
            console.error('Error loading state:', error);
            showNotification('Error loading progress.', 'error');
        }
    };

    const clearData = async () => {
        if (!tag) {
            showNotification('Please enter a tag to clear.', 'error');
            return;
        }
        setShowClearConfirm(true);
    };

    const handleClearConfirm = async () => {
        try {
            const response = await fetch(`/api/delete/${tag}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                showNotification(`Data for tag "${tag}" has been cleared.`, 'success');
                setTag('');
                fetchTags(); // Refresh the tags list
            } else {
                showNotification('Failed to clear data.', 'error');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            showNotification('Error clearing data.', 'error');
        }
        setShowClearConfirm(false);
    };

    const handleGeneralInfoChange = (e) => {
        const { name, value } = e.target;
        setGeneralInfo(prev => ({ ...prev, [name]: value }));
    };

    const addRow = (scopeSetter) => {
        const newRow = {
            ...initialScopeData,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5)
        };
        scopeSetter(prev => [...prev, newRow]);
    };

    const handleScopeChange = (setter) => (id) => (e) => {
        const { name, value } = e.target;
        setter(prev =>
            prev.map(item => item.id === id ? { ...item, [name]: value } : item)
        );
    };

    const removeRow = (id, scopeSetter) => {
        scopeSetter(prev => prev.filter(item => item.id !== id));
    };

    const startEditing = (item, scopeSetter) => {
        setEditingId(item.id);
        setEditingData({ ...item, scopeSetter });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingData({});
    };

    const saveEditing = () => {
        const { id, scopeSetter, ...dataToSave } = editingData;
        scopeSetter(prev => prev.map(item => (item.id === id ? { ...item, ...dataToSave } : item)));
        setEditingId(null);
        setEditingData({});
    };

    const handleEditDataChange = (e) => {
        const { name, value } = e.target;
        setEditingData(prev => ({ ...prev, [name]: value }));
    };

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

    const emissionsTrend = useMemo(() => {
        const allData = [...scope1Data, ...scope2Data, ...scope3Data];
        const trendMap = {};
        allData.forEach(item => {
            const month = new Date(item.date).toLocaleString('default', { month: 'short' });
            const emissions = calculateEmissions(item);
            trendMap[month] = (trendMap[month] || 0) + emissions;
        });
        return Object.entries(trendMap).map(([month, emissions]) => ({ month, emissions }));
    }, [scope1Data, scope2Data, scope3Data]);

    const emissionsByFuelType = useMemo(() => {
        const allData = [...scope1Data, ...scope2Data, ...scope3Data];
        const fuelMap = {};
        allData.forEach(item => {
            const fuel = item.fuelSourceType || 'Uncategorized';
            const emissions = calculateEmissions(item);
            fuelMap[fuel] = (fuelMap[fuel] || 0) + emissions;
        });
        return Object.entries(fuelMap).map(([name, emissions]) => ({ name, emissions }));
    }, [scope1Data, scope2Data, scope3Data]);

    const scopeChartData = [
        { name: 'Scope 1', value: totalEmissions.scope1 },
        { name: 'Scope 2', value: totalEmissions.scope2 },
        { name: 'Scope 3', value: totalEmissions.scope3 },
    ].filter(d => d.value > 0);

    const exportToPdf = async () => {
        const page1Element = page1Ref.current;
        const tablesElement = tablesRef.current;
        const waterfallElement = waterfallRef.current;
        const bubbleElement = bubbleRef.current;

        if (!page1Element || !tablesElement || !waterfallElement || !bubbleElement) {
            console.error("PDF export failed: a ref was not found.");
            showNotification("Could not export to PDF, an element was not found.", "error");
            return;
        }

        // Use a loading indicator if you have one
        // setLoading(true);

        try {
            const canvasOptions = { scale: 2, useCORS: true, backgroundColor: '#ffffff' };
            const page1Canvas = await html2canvas(page1Element, canvasOptions);
            const tablesCanvas = await html2canvas(tablesElement, canvasOptions);
            const waterfallCanvas = await html2canvas(waterfallElement, canvasOptions);
            const bubbleCanvas = await html2canvas(bubbleElement, canvasOptions);

            const page1ImgData = page1Canvas.toDataURL('image/png');
            const tablesImgData = tablesCanvas.toDataURL('image/png');
            const waterfallImgData = waterfallCanvas.toDataURL('image/png');
            const bubbleImgData = bubbleCanvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const addImageToPage = (imgData, title) => {
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                pdf.addPage();
                pdf.setFontSize(16);
                pdf.text(title, 14, 15);
                pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, imgHeight);
            };

            // Page 1: Header and Summary
            pdf.setFontSize(20);
            pdf.text(`${generalInfo.organisationName} - Carbon Footprint Report`, 14, 22);
            pdf.setFontSize(12);
            pdf.text(`Reporting Year: ${generalInfo.reportingYear}`, 14, 30);
            const page1ImgProps = pdf.getImageProperties(page1ImgData);
            const page1ImgHeight = (page1ImgProps.height * pdfWidth) / page1ImgProps.width;
            pdf.addImage(page1ImgData, 'PNG', 0, 40, pdfWidth, page1ImgHeight);

            // Subsequent pages for each chart
            addImageToPage(waterfallImgData, "Waterfall Chart");
            addImageToPage(bubbleImgData, "Bubble Chart");

            // Detailed Data Tables
            pdf.addPage();
            pdf.setFontSize(20);
            pdf.text('Detailed Emissions Data', 14, 22);
            let position = 30;

            const tablesImgProps = pdf.getImageProperties(tablesImgData);
            const tablesImgHeight = (tablesImgProps.height * pdfWidth) / tablesImgProps.width;
            let heightLeft = tablesImgHeight;

            while (heightLeft > 0) {
                pdf.addImage(tablesImgData, 'PNG', 0, position, pdfWidth, tablesImgHeight);
                heightLeft -= (pdfHeight - position);

                if (heightLeft > 0) {
                    pdf.addPage();
                    position = -heightLeft;
                }
            }
            
            pdf.save(`${generalInfo.organisationName}_Carbon_Report_${generalInfo.reportingYear}.pdf`);

        } catch (error) {
            console.error("An error occurred during PDF generation:", error);
            showNotification("Sorry, there was an error creating the PDF. Please check the console for details.", "error");
        } finally {
            // setLoading(false);
        }
    };

    // --- RENDER LOGIC ---

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onDismiss={() => setNotification(null)}
                />
            )}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 text-center md:text-left">
                        Carbon Footprint Calculator
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <input
                            type="text"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            placeholder="Enter a tag..."
                            className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={saveState} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-md">
                            Save
                        </button>
                        <button onClick={loadState} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                            Load
                        </button>
                        <button onClick={clearData} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105 shadow-md">
                            Clear
                        </button>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className={`flex items-center space-x-2 ${step === 1 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                            <Table size={24} /> <span>Data Entry</span>
                        </div>
                        <div className="text-gray-300"><ArrowRight /></div>
                        <div className={`flex items-center space-x-2 ${step === 2 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                            <AreaChart size={24} /> <span>Dashboard</span>
                        </div>
                    </div>
                </div>
                {recentTags.length > 0 && (
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center space-x-2">
                        <span className="font-semibold">Recent Tags:</span>
                        {recentTags.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTag(t)}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 text-sm"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                )}
            </header>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {showClearConfirm && (
                    <ConfirmationDialog
                        message={`Are you sure you want to delete the data for tag "${tag}"? This action cannot be undone.`}
                        onConfirm={handleClearConfirm}
                        onCancel={() => setShowClearConfirm(false)}
                    />
                )}
                {step === 1 && (
                    <DataEntryView
                        generalInfo={generalInfo} handleGeneralInfoChange={handleGeneralInfoChange}
                        scope1Data={scope1Data} setScope1Data={setScope1Data}
                        scope2Data={scope2Data} setScope2Data={setScope2Data}
                        scope3Data={scope3Data} setScope3Data={setScope3Data}
                        handleScopeChange={handleScopeChange} addRow={addRow} removeRow={removeRow} startEditing={startEditing}
                        setStep={setStep} totalOverallEmissions={totalOverallEmissions}
                    />
                )}
                {step === 2 && (
                    <DashboardView
                        setStep={setStep} exportToPdf={exportToPdf} page1Ref={page1Ref}
                        totalOverallEmissions={totalOverallEmissions} totalEmissions={totalEmissions}
                        scopeChartData={scopeChartData} emissionsBySource={emissionsBySource} tablesRef={tablesRef}
                        scope1Data={scope1Data} scope2Data={scope2Data} scope3Data={scope3Data}
                        waterfallRef={waterfallRef}
                        bubbleRef={bubbleRef}
                    />
                )}
            </main>
            {editingId &&
                <EditingModal
                    editingId={editingId}
                    editingData={editingData}
                    handleEditDataChange={handleEditDataChange}
                    saveEditing={saveEditing}
                    cancelEditing={cancelEditing}
                />
            }
            <footer className="text-center py-6 text-gray-500 text-sm">
                <p>Built with React, Tailwind CSS, and Recharts. © {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
}
