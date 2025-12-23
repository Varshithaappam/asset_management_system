import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext';
import { useConfirm } from '../context/ConfirmContext';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid 
} from '@mui/material';

const AssetDetails = () => {
  const { typeName } = useParams();
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();
  const askConfirmation = useConfirm();

  const [assets, setAssets] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const [assignData, setAssignData] = useState({
    asset_id: '',
    brand: '',
    model: '',
    employee_id: '',
    employee_name: '',
    from_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAssets();
  }, [typeName]);

  const fetchAssets = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/assets/details/${typeName}`);
      setAssets(res.data);
    } catch (err) {
      showSnackbar("Error fetching asset details", "error");
    }
  };

  const handleAssignSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!assignData.asset_id || !assignData.brand || !assignData.employee_id) {
      showSnackbar("Please fill Asset ID, Brand, and Employee details", "warning");
      return;
    }

    askConfirmation(
      "Create & Assign Asset",
      `This will register ${assignData.asset_id} and assign it to ${assignData.employee_name}. Proceed?`,
      async () => {
        try {
          await axios.post('http://localhost:5000/api/assignments', {
            ...assignData,
            typeName: typeName
          });
          
          showSnackbar("Asset registered and assigned successfully!", "success");
          setShowAssignModal(false);
          
          // Reset form
          setAssignData({
            asset_id: '',
            brand: '',
            model: '',
            employee_id: '',
            employee_name: '',
            from_date: new Date().toISOString().split('T')[0]
          });
          
          fetchAssets(); // Refresh table
        } catch (err) {
          showSnackbar(err.response?.data?.error || "Assignment failed", "error");
        }
      }
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{typeName} Inventory</h1>
            <p className="text-gray-500">View and add new {typeName} assignments</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAssignModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={20} /> Assign New {typeName}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-4">Asset ID</th>
              <th className="px-6 py-4">Device Specs</th>
              <th className="px-6 py-4">Employee ID</th>
              <th className="px-6 py-4">Employee Name</th>
              <th className="px-6 py-4">Assign Date</th>
              <th className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assets.length > 0 ? assets.map((asset) => (
              <tr key={asset.asset_id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-bold text-blue-600">{asset.asset_id}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-800">{asset.brand} {asset.model}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{asset.employee_id || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                  {asset.employee_name || <span className="text-gray-400 italic">Unassigned</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{asset.assign_date || '-'}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700`}>
                    {asset.status || 'Assigned'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-400 italic">
                  No {typeName}s recorded. Click "Assign New {typeName}" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* REFACTORED MODAL: Creates New Asset and Assigns it */}
      <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Register & Assign New {typeName}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Device Detail Section */}
            <Grid item xs={12}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Device Details</p>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth label="Asset ID (e.g., LPT-001)" 
                value={assignData.asset_id}
                onChange={(e) => setAssignData({...assignData, asset_id: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth label="Brand (e.g., Dell)" 
                value={assignData.brand}
                onChange={(e) => setAssignData({...assignData, brand: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Model (e.g., Latitude 5420)" 
                value={assignData.model}
                onChange={(e) => setAssignData({...assignData, model: e.target.value})}
              />
            </Grid>

            {/* Employee Section */}
            <Grid item xs={12} sx={{ mt: 2 }}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assignment Details</p>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth label="Employee ID" 
                value={assignData.employee_id}
                onChange={(e) => setAssignData({...assignData, employee_id: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth label="Employee Name" 
                value={assignData.employee_name}
                onChange={(e) => setAssignData({...assignData, employee_name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth type="date" label="Assignment Date" InputLabelProps={{ shrink: true }}
                value={assignData.from_date}
                onChange={(e) => setAssignData({...assignData, from_date: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowAssignModal(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAssignSubmit} variant="contained" color="secondary" startIcon={<Save />}>
            Register & Assign
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AssetDetails;