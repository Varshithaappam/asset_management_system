import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, History, Monitor, Cpu, Layers, UserPlus, CheckCircle, Wrench, Plus } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext'; 
import { Dialog, DialogTitle, TextField, DialogContent, DialogActions, Button, Typography, ThemeProvider, createTheme } from '@mui/material';
import { theme } from '../theme';

const orangeMuiTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#ea580c' },
        background: { paper: '#ffffff', default: '#ffffff' }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: '12px', fontWeight: 'bold', textTransform: 'none' }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } }
            }
        }
    }
});

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
    const [showRepairForm, setShowRepairForm] = useState(false);
    
    const [newAssignForm, setNewAssignForm] = useState({
        employee_id: '',
        employee_name: '',
        from_date: new Date().toISOString().split('T')[0]
    });

    const [repairData, setRepairData] = useState({
        issue: '',
        amount: '',
        date_reported: new Date().toISOString().split('T')[0]
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
        <ThemeProvider theme={orangeMuiTheme}>
            <div className={`min-h-screen ${theme.pageBg} ${theme.mainText} pt-5 p-4`}>
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className={`p-2 hover:${theme.iconBg} rounded-full ${theme.iconText} transition`}>
                                <ArrowLeft size={25} />
                            </button>
                            <h1 className="text-2xl font-semibold uppercase tracking-tight">Asset History</h1>
                        </div>
                    </div>

                    <div className={`bg-white border-2 ${theme.cardBorder} rounded-2xl p-8 mb-4 ${theme.cardShadowHover} relative overflow-hidden`}>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className={`${theme.iconText} font-mono text-sm uppercase tracking-widest mb-1 font-bold`}>Asset ID</p>
                                    <h2 className="text-2xl font-semibold">{assetId}</h2>
                                </div>
                                <div className="text-right">
                                    <p className={`${theme.mutedText} text-sm mb-1 uppercase font-bold tracking-tighter`}>Current Device</p>
                                    <h3 className={`text-xl font-semibold ${theme.mainText}`}>{details?.brand} {details?.model}</h3>
                                </div>
                            </div>

                            {details?.ram && (
                                <div className={`grid grid-cols-2 md:grid-cols-5 gap-6 mt-6 pt-6 border-t ${theme.tableRowBorder}`}>
                                    <div className="flex items-center gap-3">
                                        <Cpu className={theme.iconText} size={15} />
                                        <div>
                                            <p className={`text-[10px] ${theme.mutedText} uppercase font-bold`}>Processor</p>
                                            <p className={`text-sm font-semibold ${theme.mainText}`}>{details.processor || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Layers className="text-purple-600" size={15} />
                                        <div>
                                            <p className={`text-[10px] ${theme.mutedText} uppercase font-bold`}>Memory</p>
                                            <p className={`text-sm font-semibold ${theme.mainText}`}>{details.ram || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-orange-500 text-sm">💾</span>
                                        <div>
                                            <p className={`text-[10px] ${theme.mutedText} uppercase font-bold`}>Storage</p>
                                            <p className={`text-sm font-semibold ${theme.mainText}`}>{details.storage_capacity || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Monitor className="text-green-600" size={15} />
                                        <div>
                                            <p className={`text-[10px] ${theme.mutedText} uppercase font-bold`}>Display</p>
                                            <p className={`text-sm font-semibold ${theme.mainText}`}>{details.screen_size || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-yellow-600 text-sm">⚙️</span>
                                        <div>
                                            <p className={`text-[10px] ${theme.mutedText} uppercase font-bold`}>OS</p>
                                            <p className={`text-sm font-semibold ${theme.mainText}`}>{details.os || '-'}</p>
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
                                className={`${theme.btnPrimary} px-3 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-100`}
                            >
                                <UserPlus size={15} /> Assign Asset to New Employee
                            </button>
                        </div>
                    )}

                    {isAssigning && (
                        <div className={`bg-orange-50 border-2 ${theme.cardBorderHover} p-8 rounded-3xl shadow-xl mb-8`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-black ${theme.iconText} uppercase tracking-tighter`}>New Assignment</h3>
                                <button onClick={() => setIsAssigning(false)} className={`${theme.mutedText} hover:${theme.mainText} text-xs font-bold uppercase underline`}>Cancel</button>
                            </div>
                            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    required
                                    placeholder="Employee ID"
                                    className={`bg-white border-2 ${theme.cardBorder} rounded-xl p-3 text-sm ${theme.mainText} outline-none focus:border-orange-500`}
                                    onChange={(e) => setNewAssignForm({ ...newAssignForm, employee_id: e.target.value })}
                                />
                                <input
                                    required
                                    placeholder="Employee Name"
                                    className={`bg-white border-2 ${theme.cardBorder} rounded-xl p-3 text-sm ${theme.mainText} outline-none focus:border-orange-500`}
                                    onChange={(e) => setNewAssignForm({ ...newAssignForm, employee_name: e.target.value })}
                                />
                                <button type="submit" className={`${theme.btnPrimary} rounded-xl font-bold text-xs uppercase tracking-widest`}>
                                    Confirm Assignment
                                </button>
                            </form>
                        </div>
                    )}

                    <div className={`bg-white rounded-2xl ${theme.cardShadowHover} overflow-hidden border-2 ${theme.cardBorder}`}>
                        <div className={`p-6 ${theme.tableHeaderBg} border-b ${theme.cardBorder} flex items-center justify-between`}>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <History size={20} className={theme.iconText} />
                                    <span className={`font-semibold uppercase tracking-tight ${theme.mainText}`}>
                                        {viewMode === 'assignment' ? 'Assignment History' : 'Repair History'}
                                    </span>
                                </div>
                                <div className={`flex bg-white p-1 rounded-lg border ${theme.cardBorder}`}>
                                    <button onClick={() => setViewMode('assignment')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${viewMode === 'assignment' ? theme.btnPrimary : theme.mutedText}`}>Assignments</button>
                                    <button onClick={() => setViewMode('repair')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${viewMode === 'repair' ? theme.btnPrimary : theme.mutedText}`}>Repairs</button>
                                </div>
                            </div>
                            {viewMode === 'repair' && (
                                <button onClick={() => setShowRepairForm(true)} className={`${theme.btnPrimary} px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all`}>
                                    <Plus size={16} /> Add Repair
                                </button>
                            )}
                        </div>

                        <table className="w-full text-left">
                            {viewMode === 'assignment' ? (
                                <>
                                    <thead className={`${theme.tableHeaderBg} text-xs font-bold ${theme.tableHeaderText} uppercase`}>
                                        <tr>
                                            <th className="px-6 py-4">Employee Name</th>
                                            <th className="px-6 py-4">Employee ID</th>
                                            <th className="px-6 py-4">From Date</th>
                                            <th className="px-6 py-4">To Date</th>
                                            <th className="px-6 py-4">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${theme.tableRowBorder}`}>
                                        {history.map((entry, index) => (
                                            <tr key={index}
                                                onClick={() => navigate(`/assets/deep-view/${assetId}/${entry.employee_id}`)}
                                                className={`${theme.tableRowHover} cursor-pointer transition-all`}
                                            >
                                                <td className={`px-6 py-4 font-semibold ${theme.mainText}`}>{entry.employee_name}</td>
                                                <td className={`px-6 py-4 ${theme.mutedText} font-mono text-sm`}>{entry.employee_id}</td>
                                                <td className={`px-6 py-4 ${theme.mainText} opacity-70`}>{entry.from_date}</td>
                                                <td className={`px-6 py-4 ${theme.mainText} opacity-70`}>
                                                    {entry.to_date ? entry.to_date : <span className={`${theme.statusActive} px-3 py-1 rounded-full font-black text-[10px] uppercase`}>Active</span>}
                                                </td>
                                                <td className={`px-6 py-4 text-sm ${theme.mutedText} italic`}>{entry.remarks || "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            ) : (
                                <>
                                    <thead className={`${theme.tableHeaderBg} text-xs font-bold ${theme.tableHeaderText} uppercase`}>
                                        <tr>
                                            <th className="px-6 py-4">Employee Name</th>
                                            <th className="px-6 py-4">Issue</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Date Reported</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${theme.tableRowBorder}`}>
                                        {repairs.length > 0 ? repairs.map((repair, index) => (
                                            <tr key={index} className={`${theme.tableRowHover} transition-all`}>
                                                <td className={`px-6 py-4 font-semibold ${theme.mainText}`}>{repair.employee_name}</td>
                                                <td className={`px-6 py-4 ${theme.mainText} opacity-80`}>{repair.issue_reported}</td>
                                                <td className={`px-6 py-4 font-semibold ${theme.statusRepairs}`}>₹{repair.amount}</td>
                                                <td className={`px-6 py-4 ${theme.mutedText} font-mono text-sm`}>{repair.date_reported}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className={`px-6 py-10 text-center ${theme.mutedText} font-bold uppercase tracking-widest italic`}>No repair history found.</td></tr>
                                        )}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>
                </div>

                <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} PaperProps={{ sx: { borderRadius: '24px' } }}>
                    <DialogTitle sx={{ fontWeight: '900', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle className="text-green-600" /> Confirm Assignment
                    </DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: '500' }}>
                            Are you sure you want to assign asset <b className="text-orange-600">{assetId}</b> to <b className="text-orange-600">{newAssignForm.employee_name} ({newAssignForm.employee_id})</b>?
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setShowConfirmDialog(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                        <Button onClick={processAssignment} variant="contained" color="primary">Yes, Confirm</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={showRepairForm} onClose={() => setShowRepairForm(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
                    <DialogTitle sx={{ fontWeight: '900', textTransform: 'uppercase' }}>Log New Repair</DialogTitle>
                    <DialogContent>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block', fontWeight: 'bold' }}>
                            Current Holder: <span className="text-orange-600">{history.find(h => h.to_date === null)?.employee_name || 'N/A'}</span>
                        </Typography>
                        <div className="space-y-4 mt-2">
                            <TextField fullWidth label="Issue Description" multiline rows={3} variant="outlined" value={repairData.issue} onChange={(e) => setRepairData({...repairData, issue: e.target.value})} />
                            <TextField fullWidth label="Repair Amount (₹)" type="number" variant="outlined" value={repairData.amount} onChange={(e) => setRepairData({...repairData, amount: e.target.value})} />
                        </div>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setShowRepairForm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                        <Button onClick={handleRepairSubmit} variant="contained" sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }} disabled={!repairData.issue || !repairData.amount}>Save Repair Log</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </ThemeProvider>
    );
};

export default AssetHistory;