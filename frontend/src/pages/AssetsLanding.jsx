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
  
  const navigate = useNavigate();
  const askConfirmation = useConfirm();
  const showSnackbar = useSnackbar();

  useEffect(() => { fetchAssetTypes(); }, []);

  const fetchAssetTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/asset-types');
      setAssetTypes(response.data);
    } catch (err) { console.error("Error fetching asset types:", err); }
  };

  const handleAddAssetType = async (e) => {
    e.preventDefault();
    askConfirmation("Add Category", `Add ${newTypeName} to inventory?`, async () => {
        try {
          await axios.post('http://localhost:5000/api/asset-types', { name: newTypeName });
          showSnackbar("Category added!", "success");
          setShowAddModal(false);
          setNewTypeName('');
          fetchAssetTypes();
        } catch (err) { showSnackbar("Failed to add", "error"); }
      }
    );  
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white p-8'>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Asset Inventory</h1>
            <p className="text-gray-400 mt-1">Select to view and add details</p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all"
          >
            <Plus size={20} /> Add Asset Type
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {assetTypes.map((type) => (
    <div 
      key={type.id} 
      onClick={() => navigate(`/assets/${type.name}`)} 
      className="group bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:bg-gray-700 hover:border-gray-500 transition-all cursor-pointer shadow-xl"
    >
      <div className="flex flex-col items-center text-center mb-4">
        <h3 className="font-bold text-xl">{type.name}</h3>
        {/* <p className="text-gray-500 text-[10px] uppercase font-bold mt-1 tracking-widest">Manage Items</p> */}
      </div>

      <div className="space-y-2 mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex justify-between items-center text-sm">
    <span className="text-gray-400">Total Capacity</span>
    <span className="font-mono font-bold text-red-400">{type.total_limit}</span>
  </div>
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-400">Inventory</span>
    <span className="font-mono font-bold text-green-400">
      {type.inventory_count}
    </span>
  </div>
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-400">Assigned</span>
    <span className="font-mono font-bold text-blue-400">
      {type.assigned_count}
    </span>
  </div>
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-400">Total Repairs</span>
    <span className="font-mono font-bold text-orange-400">{type.repair_count}</span>
  </div>
  
</div>

    </div>
  ))}
</div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleAddAssetType} className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
              <h3 className="text-xl font-bold mb-6">New Category</h3>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-400 mb-2">Category Name</label>
                <input 
                  autoFocus required
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-gray-400 hover:text-white transition">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">Create</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetsLanding;