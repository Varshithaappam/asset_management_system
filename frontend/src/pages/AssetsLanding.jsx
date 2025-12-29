import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import { Laptop, Mouse, Keyboard, Monitor, Plus, Package } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';
import { useSnackbar } from '../context/SnackbarContext';
import { theme } from '../theme';

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
    <div className={`min-h-screen ${theme.pageBg} ${theme.mainText} p-7`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-2xl font-semibold uppercase tracking-tight">Asset Inventory</h1>
            <p className={`${theme.mutedText} mt-1`}>Select to view and add details</p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className={`${theme.btnPrimary} px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all`}
          >
            <Plus size={18} /> Add Asset Type
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {assetTypes.map((type) => (
            <div 
              key={type.id} 
              onClick={() => navigate(`/assets/${type.name}`)} 
              className={`group ${theme.cardBg} p-4 rounded-2xl border-2 ${theme.cardBorder} hover:${theme.tableRowHover} hover:${theme.cardBorderHover} transition-all cursor-pointer ${theme.cardShadow} hover:${theme.cardShadowHover}`}
            >
              <div className="flex flex-col items-center text-center mb-4">
                {/* <div className={`${theme.iconText} mb-4 p-4 ${theme.iconBg} rounded-2xl group-hover:scale-110 transition-transform`}>
                  {iconMap[type.name] || iconMap.Default}
                </div> */}
                <h3 className={`font-semibold text-lg uppercase tracking-tight ${theme.mainText}`}>{type.name}</h3>
              </div>

              <div className={`space-y-2 mt-4 pt-2 border-t ${theme.tableRowBorder}`}>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className={`${theme.mutedText} uppercase text-[10px] font-bold`}>Total Capacity</span>
                  <span className={`font-mono font-bold ${theme.statusCapacity}`}>{type.total_limit}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className={`${theme.mutedText} uppercase text-[10px] font-bold`}>Inventory</span>
                  <span className={`font-mono font-bold text-green-600`}>
                    {type.inventory_count}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className={`${theme.mutedText} uppercase text-[10px] font-bold`}>Assigned</span>
                  <span className={`font-mono font-bold ${theme.statusAssigned}`}>
                    {type.assigned_count}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className={`${theme.mutedText} uppercase text-[10px] font-bold`}>Total Repairs</span>
                  <span className={`font-mono font-bold ${theme.statusRepairs}`}>{type.repair_count}</span>
                </div>
              </div>
              
              <div className={`mt-4 w-full ${theme.progressBarTrack} h-1.5 rounded-full overflow-hidden`}>
                <div 
                  className={`${theme.progressBarFill} h-full transition-all duration-500`}
                  style={{ width: `${(type.assigned_count / (type.total_limit || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleAddAssetType} className={`${theme.cardBg} p-8 rounded-3xl shadow-2xl max-w-md w-full border ${theme.cardBorder}`}>
              <h3 className={`text-2xl font-black mb-6 uppercase tracking-tight ${theme.mainText}`}>New Category</h3>
              <div className="mb-6">
                <label className={`block text-xs font-bold ${theme.mutedText} mb-2 uppercase tracking-wider`}>Category Name</label>
                <input 
                  autoFocus required
                  className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl px-4 py-3 ${theme.mainText} focus:${theme.cardBorderHover} outline-none transition-all`}
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className={`px-5 py-2.5 ${theme.mutedText} font-bold hover:${theme.mainText} transition`}>Cancel</button>
                <button type="submit" className={`px-6 py-2.5 ${theme.btnPrimary} rounded-xl font-bold shadow-md transition`}>Create</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetsLanding;