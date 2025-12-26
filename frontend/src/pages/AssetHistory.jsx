import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, History, Monitor, Cpu, Layers, UserPlus, CheckCircle, Wrench,Plus } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext'; 
import { Dialog, DialogTitle, TextField,DialogContent, DialogActions, Button, Typography } from '@mui/material';

const AssetHistory = () => {
    const { assetId } = useParams();
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    
    const [history, setHistory] = useState([]);
    const [repairs, setRepairs] = useState([]); 
    const [details, setDetails] = useState(null);
    const [viewMode, setViewMode] = useState('assignment'); 

    const [isAssigning, setIsAssigning] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false); 
    const [newAssignForm, setNewAssignForm] = useState({
        employee_id: '',
        employee_name: '',
        from_date: new Date().toISOString().split('T')[0]
    });

    const fetchAssetData = async () => {
        try {
            const detRes = await axios.get(`http://localhost:5000/api/assets/id/${assetId}`);
            setDetails(detRes.data);
            const histRes = await axios.get(`http://localhost:5000/api/assets/history/${assetId}`);
            setHistory(histRes.data);
            const repairRes = await axios.get(`http://localhost:5000/api/assets/repairs/${assetId}`);
            setRepairs(repairRes.data);
        } catch (err) {
            console.error("Error loading asset data:", err);
        }
    };

    useEffect(() => {
        fetchAssetData();
    }, [assetId]);

    const isAssetFree = history.length === 0 || (history[0] && history[0].to_date !== null && history[0].to_date !== "-");
    
    const handleFormSubmit = (e) => {
        e.preventDefault();
        setShowConfirmDialog(true);
    };

    const processAssignment = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/assets/reassign', {
                asset_id: assetId,
                new_employee_id: newAssignForm.employee_id,
                new_employee_name: newAssignForm.employee_name,
                remarks: "Initial Assignment",
                old_employee_id: null
            });
            showSnackbar(response.data.message, "success");
            setShowConfirmDialog(false);
            setIsAssigning(false);
            fetchAssetData();
        } catch (err) {
            showSnackbar("Assignment failed", "error");
            setShowConfirmDialog(false);
        }
    };
    const [showRepairForm, setShowRepairForm] = useState(false);
const [repairData, setRepairData] = useState({
    issue: '',
    amount: '',
    date_reported: new Date().toISOString().split('T')[0]
});

const handleRepairSubmit = async (e) => {
    e.preventDefault();
    const activeEmployee = history.find(h => h.to_date === null);
    
    if (!activeEmployee) {
        showSnackbar("No active employee found to assign repair to.", "error");
        return;
    }

    try {
        await axios.post('http://localhost:5000/api/assets/add-repair', {
            asset_id: assetId,
            date_reported: repairData.date_reported,
            issue_reported: repairData.issue,
            amount: repairData.amount,
            resolver_comments: `Reported by ${activeEmployee.employee_name}` 
        });

        showSnackbar("Repair record added successfully", "success");
        setShowRepairForm(false);
        setRepairData({ issue: '', amount: '', date_reported: new Date().toISOString().split('T')[0] });
        fetchAssetData();
    } catch (err) {
        showSnackbar("Failed to add repair", "error");
    }
};

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full text-blue-500 transition">
                            <ArrowLeft size={28} />
                        </button>
                        <h1 className="text-3xl font-bold">Asset History</h1>
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-blue-400 font-mono text-sm uppercase tracking-widest mb-1">Asset ID</p>
                                <h2 className="text-5xl font-black">{assetId}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-sm mb-1 uppercase font-bold tracking-tighter">Current Device</p>
                                <h3 className="text-2xl font-bold text-white">{details?.brand} {details?.model}</h3>
                            </div>
                        </div>

                        {details?.ram && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-6 pt-6 border-t border-gray-700/50">
                                <div className="flex items-center gap-3">
                                    <Cpu className="text-blue-500" size={20} />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Processor</p>
                                        <p className="text-sm font-semibold text-gray-200">{details.processor || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Layers className="text-purple-500" size={20} />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Memory</p>
                                        <p className="text-sm font-semibold text-gray-200">{details.ram || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-orange-500 text-lg">💾</span>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Storage</p>
                                        <p className="text-sm font-semibold text-gray-200">{details.storage_capacity || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Monitor className="text-green-500" size={20} />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Display</p>
                                        <p className="text-sm font-semibold text-gray-200">{details.screen_size || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-yellow-500 text-lg">⚙️</span>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">OS</p>
                                        <p className="text-sm font-semibold text-gray-200">{details.os || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {details && !isAssigning && isAssetFree && (
                    <div className="mb-6 flex justify-end">
                        <button
                            onClick={() => setIsAssigning(true)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
                        >
                            <UserPlus size={20} /> Assign Asset to New Employee
                        </button>
                    </div>
                )}

                {isAssigning && (
                    <div className="bg-gray-800 border border-green-500/50 p-8 rounded-3xl shadow-2xl mb-8 animate-in fade-in zoom-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-green-400 uppercase tracking-tighter">New Assignment</h3>
                            <button onClick={() => setIsAssigning(false)} className="text-gray-500 hover:text-white text-xs underline">Cancel</button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                required
                                placeholder="Employee ID"
                                className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white outline-none focus:ring-1 focus:ring-green-500"
                                onChange={(e) => setNewAssignForm({ ...newAssignForm, employee_id: e.target.value })}
                            />
                            <input
                                required
                                placeholder="Employee Name"
                                className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white outline-none focus:ring-1 focus:ring-green-500"
                                onChange={(e) => setNewAssignForm({ ...newAssignForm, employee_name: e.target.value })}
                            />
                            <button type="submit" className="bg-green-600 hover:bg-green-700 rounded-xl font-bold text-xs uppercase tracking-widest">
                                Confirm Assignment
                            </button>
                        </form>
                    </div>
                )}

                <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                    <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <History size={20} className="text-blue-500" />
                                <span className="font-bold">
                                    {viewMode === 'assignment' ? 'Assignment History' : 'Repair History'}
                                </span>
                            </div>
                            <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
                                <button 
                                    onClick={() => setViewMode('assignment')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'assignment' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                                >
                                    Assignments
                                </button>
                                <button 
                                    onClick={() => setViewMode('repair')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'repair' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}
                                >
                                    Repairs
                                </button>
                            </div>
                        </div>
                        {viewMode === 'repair' && (
        <button 
            onClick={() => setShowRepairForm(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
        >
            <Plus size={16} /> Add Repair
        </button>
    )}
                    </div>

                    <table className="w-full text-left">
                        {viewMode === 'assignment' ? (
                            <>
                                <thead className="bg-gray-900/50 text-sm font-semibold text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4">Employee Name</th>
                                        <th className="px-6 py-4">Employee ID</th>
                                        <th className="px-6 py-4">From Date</th>
                                        <th className="px-6 py-4">To Date</th>
                                        <th className="px-6 py-4">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {history.map((entry, index) => (
                                        <tr key={index}
                                            onClick={() => navigate(`/assets/deep-view/${assetId}/${entry.employee_id}`)}
                                            className="hover:bg-gray-700/50 cursor-pointer transition-all border-b border-gray-700/50"
                                        >
                                            <td className="px-6 py-4 font-medium text-white">{entry.employee_name}</td>
                                            <td className="px-6 py-4 text-gray-400 font-mono text-sm">{entry.employee_id}</td>
                                            <td className="px-6 py-4 text-gray-300">{entry.from_date}</td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {entry.to_date ? entry.to_date : <span className="text-green-500 font-bold px-2 py-1 bg-green-500/10 rounded">Active / Present</span>}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 italic">{entry.remarks || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        ) : (
                            <>
                                <thead className="bg-gray-900/50 text-sm font-semibold text-gray-400">
                                    <tr>
                                        <th className="px-6 py-4">Employee Name</th>
                                        <th className="px-6 py-4">Issue</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Date Reported</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {repairs.length > 0 ? repairs.map((repair, index) => (
                                        <tr key={index} className="hover:bg-gray-700/50 transition-all border-b border-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-white">{repair.employee_name}</td>
                                            <td className="px-6 py-4 text-gray-300">{repair.issue_reported}</td>
                                            <td className="px-6 py-4 text-orange-400 font-bold">₹{repair.amount}</td>
                                            <td className="px-6 py-4 text-gray-400 font-mono text-sm">{repair.date_reported}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-500 italic">No repair history found for this device.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </>
                        )}
                    </table>
                </div>
            </div>

            <Dialog open={showRepairForm} onClose={() => setShowRepairForm(false)} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ bgcolor: '#111827', color: 'white', fontWeight: 'bold' }}>
        Log New Repair
    </DialogTitle>
    <DialogContent sx={{ bgcolor: '#111827', pt: 2 }}>
        <Typography variant="caption" sx={{ color: '#9ca3af', mb: 2, display: 'block' }}>
            Current Holder: <b>{history.find(h => h.to_date === null)?.employee_name || 'N/A'}</b>
        </Typography>
        <div className="space-y-4 mt-2">
            <TextField
                fullWidth label="Issue Description" multiline rows={3} variant="outlined"
                value={repairData.issue}
                onChange={(e) => setRepairData({...repairData, issue: e.target.value})}
                sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: '#374151' } }, '& .MuiInputLabel-root': { color: '#9ca3af' } }}
            />
            <TextField
                fullWidth label="Repair Amount (₹)" type="number" variant="outlined"
                value={repairData.amount}
                onChange={(e) => setRepairData({...repairData, amount: e.target.value})}
                sx={{ '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: '#374151' } }, '& .MuiInputLabel-root': { color: '#9ca3af' } }}
            />
        </div>
    </DialogContent>
    <DialogActions sx={{ bgcolor: '#111827', p: 2 }}>
        <Button onClick={() => setShowRepairForm(false)} sx={{ color: '#9ca3af' }}>Cancel</Button>
        <Button 
            onClick={handleRepairSubmit} 
            variant="contained" 
            color="warning" 
            sx={{ fontWeight: 'bold' }}
            disabled={!repairData.issue || !repairData.amount}
        >
            Save Repair Log
        </Button>
    </DialogActions>
</Dialog>
        </div>
    );
};

export default AssetHistory;