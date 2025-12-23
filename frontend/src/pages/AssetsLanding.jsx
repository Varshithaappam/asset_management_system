import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { Laptop, Mouse, Keyboard, Monitor, Plus, Package } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useSnackbar } from '../context/SnackbarContext';

const iconMap = {
  Laptop: <Laptop size={40} />,
  Keyboard: <Keyboard size={40} />,
  Mouse: <Mouse size={40} />,
  Monitor: <Monitor size={40} />,
  Default: <Package size={40} />
};

const AssetsLanding = () => {
  const [assetTypes, setAssetTypes] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  
  const navigate = useNavigate(); // Initialize navigation
  const askConfirmation = useConfirm();
  const showSnackbar = useSnackbar();

  useEffect(() => {
    fetchAssetTypes();
  }, []);

  const fetchAssetTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/asset-types');
      setAssetTypes(response.data);
    } catch (err) {
      console.error("Error fetching asset types:", err);
    }
  };

  const handleAddAssetType = async (e) => {
    e.preventDefault();
    askConfirmation(
      "Add Category", 
      `Are you sure you want to add ${newTypeName}?`, 
      async () => {
        try {
          await axios.post('http://localhost:5000/api/asset-types', { name: newTypeName });
          showSnackbar("Category added!", "success");
          setShowAddModal(false);
          setNewTypeName('');
          fetchAssetTypes();
        } catch (err) {
          showSnackbar("Failed to add", "error");
        }
      }
    );  
  };

  return (
    <div className=''>
      <div className="p-8 max-w-7xl mx-auto ">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-500 mt-1">Select a category to view present details and manage assets</p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-green-200 transition-all"
          >
            <Plus size={20} /> Add Asset Type
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {assetTypes.map((type) => (
            <div 
              key={type.id} 
              onClick={() => navigate(`/assets/${type.name}`)} 
              className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center"
            >
              {/* <div className="text-blue-600 mb-6 bg-blue-50 p-5 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {iconMap[type.name] || iconMap.Default}
              </div> */}
              <h3 className="font-bold text-xl text-gray-800">{type.name}</h3>
              <p className="text-gray-400 text-sm mt-2">Click to View and Add</p>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleAddAssetType} className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-6 text-gray-800">Add New Category</h3>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
                <input 
                  autoFocus required
                  placeholder="e.g. Printer, Tablet, Webcam"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md shadow-blue-100">Create</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetsLanding;