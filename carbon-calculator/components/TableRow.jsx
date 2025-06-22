import React, { useState, useCallback } from 'react';
import TableRow from './TableRow';

const initialData = {
  id: '',
  dataCategory: '',
  subCategory: '',
  fuelSourceType: '',
  unit: 'litres',
  quantity: 0,
  emissionFactor: 0,
};

export default function App() {
  const [scopeData, setScopeData] = useState([]);

  const addRow = () => {
    const newRow = {
      ...initialData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5)
    };
    setScopeData(prev => [...prev, newRow]);
  };

  const handleChange = useCallback(
    (id) => (key) => (e) => {
      const value = e.target.value;
      setScopeData(prev =>
        prev.map(row =>
          row.id === id ? { ...row, [key]: value } : row
        )
      );
    }, []
  );

  const handleDelete = (id) => {
    setScopeData(prev => prev.filter(row => row.id !== id));
  };

  const handleEdit = (id) => {
    console.log('Edit clicked for', id);
  };

  return (
    <div className="p-4">
      <button onClick={addRow} className="mb-4 px-4 py-2 bg-blue-600 text-white rounded">Add Row</button>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th>Data Category</th>
            <th>Sub Category</th>
            <th>Fuel Source Type</th>
            <th>Unit</th>
            <th>Quantity</th>
            <th>Emission Factor</th>
            <th>Emissions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {scopeData.map(item => (
            <TableRow
              key={item.id}
              item={item}
              onChange={handleChange(item.id)}
              onEdit={() => handleEdit(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
