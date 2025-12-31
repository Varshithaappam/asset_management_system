import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2, Search, Edit2, XCircle } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext';
import { useConfirm } from '../context/ConfirmContext';
import { theme } from '../theme';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Grid, MenuItem, createTheme, ThemeProvider, Box
} from '@mui/material';

const orangeMuiTheme = createTheme({
    palette: { primary: { main: '#ea580c' } },
    components: {
        MuiButton: { styleOverrides: { root: { borderRadius: '12px', fontWeight: 'bold', textTransform: 'none' } } },
        MuiTextField: { styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: '12px' } } } }
    }
});

const AssetDetails = () => {
    const { typeName } = useParams();
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const askConfirmation = useConfirm();

    const [assets, setAssets] = useState([]);
    const [activeTab, setActiveTab] = useState('Inventory');
    const [allEmployees, setAllEmployees] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [showRepairModal, setShowRepairModal] = useState(false);
    const [showSolveModal, setShowSolveModal] = useState(false);
    const [showEndModal, setShowEndModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [empSearch, setEmpSearch] = useState('');
    const [returnRemarks, setReturnRemarks] = useState('');

    const [registerData, setRegisterData] = useState({
        asset_id: '', brand: '', model: '', bought_on: '',
        ram: '', processor: '', screen_size: '', os: '', storage_capacity: ''
    });

    const [assignData, setAssignData] = useState({
        employee_id: '', employee_name: '',
        from_date: new Date().toISOString().split('T')[0]
    });

    const [repairData, setRepairData] = useState({
        issue: '', date: new Date().toISOString().split('T')[0]
    });

    const [solveData, setSolveData] = useState({
        main_issue: '',
        cost: '',
        solved_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchAssets();
        fetchEmployees();
    }, [typeName, activeTab]);

    const fetchAssets = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/assets/status/${typeName}/${activeTab}`);
            setAssets(res.data);
        } catch (err) { showSnackbar("Error fetching assets", "error"); }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users');
            setAllEmployees(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAddAsset = async () => {
        try {
            if (isEditing) {
                await axios.put(`http://localhost:5000/api/assets/${selectedAsset.asset_id}`, registerData);
                showSnackbar("Asset updated successfully", "success");
            } else {
                const payload = { ...registerData, typeName };
                await axios.post('http://localhost:5000/api/assets', payload);
                showSnackbar("Asset registered to Inventory!", "success");
            }
            setShowRegisterModal(false);
            setIsEditing(false);
            setRegisterData({ asset_id: '', brand: '', model: '', bought_on: '', ram: '', processor: '', screen_size: '', os: '', storage_capacity: '' });
            fetchAssets();
        } catch (err) { showSnackbar("Operation failed", "error"); }
    };

    const handleRetireAsset = (assetId) => {
        askConfirmation("Retire Asset", `Move ${assetId} to Retired? This device will be removed from the current list.`, async () => {
            try {
                await axios.put(`http://localhost:5000/api/assets/status-update/${assetId}`, { status: 'Retired' });
                showSnackbar("Asset retired successfully", "success");
                fetchAssets();
            } catch (err) { showSnackbar("Failed to retire asset", "error"); }
        });
    };

    const handleRestoreAsset = (assetId) => {
        askConfirmation("Restore Asset", `Are you sure you want to move ${assetId} back to Inventory?`, async () => {
            try {
                await axios.put(`http://localhost:5000/api/assets/restore/${assetId}`);
                showSnackbar("Asset moved back to Inventory", "success");
                fetchAssets();
            } catch (err) { showSnackbar("Failed to restore asset", "error"); }
        });
    };

    const handleDeleteAsset = (assetId) => {
        askConfirmation("Delete Asset", `Permanently delete ${assetId}?`, async () => {
            try {
                await axios.delete(`http://localhost:5000/api/assets/${assetId}`);
                showSnackbar("Asset deleted successfully", "success");
                fetchAssets();
            } catch (err) { showSnackbar("Failed to delete asset", "error"); }
        });
    };

    const handleEditClick = (asset) => {
        setSelectedAsset(asset);
        setIsEditing(true);
        setRegisterData({
            asset_id: asset.asset_id,
            brand: asset.brand,
            model: asset.model,
            bought_on: asset.bought_on ? asset.bought_on.split('T')[0] : '',
            ram: asset.ram || '',
            processor: asset.processor || '',
            screen_size: asset.screen_size || '',
            os: asset.os || '',
            storage_capacity: asset.storage_capacity || ''
        });
        setShowRegisterModal(true);
    };

    const handleRepairSubmit = async () => {
        try {
            await axios.post('http://localhost:5000/api/assets/repair', {
                asset_id: selectedAsset.asset_id,
                issue: repairData.issue,
                date: repairData.date
            });
            showSnackbar("Asset sent to repairs", "success");
            setShowRepairModal(false);
            setRepairData({ issue: '', date: new Date().toISOString().split('T')[0] });
            fetchAssets();
        } catch (err) { showSnackbar("Failed to update status", "error"); }
    };

    const handleSolveSubmit = async () => {
        try {
            await axios.put(`http://localhost:5000/api/assets/solve-repair/${selectedAsset.asset_id}`, solveData);
            showSnackbar("Repair marked as solved!", "success");
            setShowSolveModal(false);
            setSolveData({ main_issue: '', cost: '', solved_date: new Date().toISOString().split('T')[0] });
            fetchAssets();
        } catch (err) { showSnackbar("Failed to update status", "error"); }
    };

    const handleEndAssignment = async () => {
        try {
            await axios.put(`http://localhost:5000/api/assets/unassign/${selectedAsset.asset_id}`, { remarks: returnRemarks });
            showSnackbar("Assignment ended", "success");
            setShowEndModal(false);
            setReturnRemarks('');
            fetchAssets();
        } catch (err) { showSnackbar("Failed to end assignment", "error"); }
    };

    const handleDeleteType = () => {
        askConfirmation("Delete Category", "Are you sure?", async () => {
            try {
                await axios.put(`http://localhost:5000/api/asset-types/soft-delete/${typeName}`);
                navigate('/');
            } catch (err) { showSnackbar("Failed to delete", "error"); }
        });
    };

    const filteredEmployees = allEmployees.filter(emp => {
        const name = (emp.name || '').toLowerCase();
        const id = (emp.employee_id || '').toLowerCase();
        return name.includes(empSearch.toLowerCase()) || id.includes(empSearch.toLowerCase());
    });

    const handleAssignSubmit = async () => {
        askConfirmation("Confirm Assignment", `Assign ${selectedAsset.asset_id} to ${assignData.employee_name}?`, async () => {
            try {
                await axios.post('http://localhost:5000/api/assets/assign-existing', {
                    asset_id: selectedAsset.asset_id,
                    ...assignData
                });
                showSnackbar("Assigned successfully", "success");
                setShowAssignModal(false);
                setEmpSearch('');
                fetchAssets();
            } catch (err) { showSnackbar("Assignment failed", "error"); }
        });
    };

    const tabs = ['Inventory', 'Assigned', 'Repairs', 'Retired'];
    const isInteractive = activeTab === 'Inventory' || activeTab === 'Assigned';

    return (
        <ThemeProvider theme={orangeMuiTheme}>
            <div className={`min-h-screen ${theme.pageBg} ${theme.mainText} p-3`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate('/')} className={`p-2 hover:${theme.iconBg} rounded-full transition`}><ArrowLeft size={24} /></button>
                            <h1 className="text-xl font-semibold uppercase tracking-tight">{typeName} Management</h1>
                        </div>
                        {activeTab === 'Inventory' && (
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setIsEditing(false); setShowRegisterModal(true); }} className={`${theme.btnPrimary} px-2 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all`}><Plus size={15} /> Add New Asset</button>
                                <button onClick={handleDeleteType} className={`${theme.btnSecondary} border-red-100 text-red-600 hover:bg-red-50 px-2 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all`}><Trash2 size={15} /> Delete Category</button>
                            </div>
                        )}
                    </div>

                    <div className="flex bg-gray-200/50 p-1.5 rounded-2xl mb-2 w-fit border border-gray-200">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl font-semibold transition-all text-xs uppercase tracking-widest ${activeTab === tab ? 'bg-white text-orange-600 shadow-md' : 'text-gray-500 hover:text-orange-600'}`}>{tab}</button>
                        ))}
                    </div>

                    <div className={`${theme.cardBg} rounded-3xl overflow-hidden border ${theme.cardBorder} shadow-xl`}>
                        <table className="w-full text-left">
                            <thead className={`${theme.tableHeaderBg} border-b ${theme.cardBorder} text-[10px] font-black uppercase tracking-widest ${theme.tableHeaderText}`}>
                                <tr>
                                    <th className="px-6 py-3">Asset ID</th>
                                    <th className="px-6 py-3">Device Details</th>
                                    {activeTab === 'Repairs' ? (
                                        <>
                                            <th className="px-6 py-3">Issue Reported</th>
                                        </>
                                    ) : (
                                        typeName === 'Laptop' && <><th className="px-6 py-3">Processor & RAM</th><th className="px-6 py-2">Storage & OS</th></>
                                    )}
                                    {activeTab === 'Assigned' && <><th className="px-6 py-3">Assigned To</th><th className="px-6 py-2 text-center">Assign Date</th></>}
                                    <th className="px-6 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${theme.tableRowBorder}`}>
                                {assets.map((asset) => (
                                    <tr 
                                        key={asset.asset_id} 
                                        className={`${isInteractive ? theme.tableRowHover + ' cursor-pointer' : ''} transition`}
                                    >
                                        <td 
                                            className="px-6 py-2 font-mono font-semibold text-orange-600" 
                                            onClick={() => isInteractive && navigate(`/assets/history/${asset.asset_id}`)}
                                        >
                                            {asset.asset_id}
                                        </td>
                                        <td 
                                            className="px-6 py-2" 
                                            onClick={() => isInteractive && navigate(`/assets/history/${asset.asset_id}`)}
                                        >
                                            <div className="font-semibold text-gray-900">{asset.brand}</div>
                                            <div className="text-xs text-gray-500 uppercase font-medium">{asset.model}</div>
                                        </td>

                                        {activeTab === 'Repairs' ? (
                                            <>
                                                <td className="px-6 py-2 text-sm text-red-600 font-semibold italic">{asset.issue_reported || 'No issue described'}</td>
                                                {/* <td className="px-6 py-2 text-sm font-bold text-gray-800 text-center">₹{asset.amount || '0.00'}</td> */}
                                            </>
                                        ) : (
                                            typeName === 'Laptop' && (
                                                <>
                                                    <td className="px-6 py-2 text-sm"><div>{asset.processor}</div><div className="text-xs text-gray-500">{asset.ram} RAM</div></td>
                                                    <td className="px-6 py-2 text-sm"><div>{asset.storage_capacity}</div><div className="text-xs text-gray-500">{asset.os}</div></td>
                                                </>
                                            )
                                        )}

                                        {activeTab === 'Assigned' && (
                                            <>
                                                <td className="px-6 py-2"><div>{asset.employee_name}</div><div className="text-[10px] text-orange-500 font-semibold tracking-tighter">{asset.employee_id}</div></td>
                                                <td className="px-6 py-2 text-center text-xs font-black text-gray-500 uppercase">{asset.assign_date}</td>
                                            </>
                                        )}
                                        <td className="px-6 py-2">
                                            <div className="flex justify-center gap-2 items-center">
                                                {activeTab === 'Inventory' && (
                                                    asset.status === 'Repairs' ? (
                                                        <>
                                                            <span className="text-[10px] font-black text-red-500 bg-red-50 px-4 py-1.5 rounded-xl border border-red-100 uppercase italic">In Repair</span>
                                                            <button onClick={(e) => { e.stopPropagation(); handleRetireAsset(asset.asset_id); }} className="bg-gray-800 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 transition">Retire</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setShowAssignModal(true); }} className="bg-orange-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-md">Assign</button>
                                                            <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setShowRepairModal(true); }} className="bg-gray-100 text-gray-600 border px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">Repair</button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleRetireAsset(asset.asset_id); }} className="bg-gray-800 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 transition">Retire</button>
                                                            <div className="flex gap-2 ml-2 border-l pl-2 border-gray-200">
                                                                <Edit2 size={16} className="text-blue-500 cursor-pointer hover:scale-110 transition" onClick={(e) => { e.stopPropagation(); handleEditClick(asset); }} />
                                                                <Trash2 size={16} className="text-red-500 cursor-pointer hover:scale-110 transition" onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.asset_id); }} />
                                                            </div>
                                                        </>
                                                    )
                                                )}
                                                {activeTab === 'Assigned' && (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setShowEndModal(true); }} className="bg-white text-gray-600 border border-gray-300 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase hover:bg-orange-600 hover:text-white transition shadow-sm">Surrender</button>
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setShowRepairModal(true); }} className="bg-gray-100 text-gray-600 border px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition">Repair</button>
                                                    </div>
                                                )}
                                                {activeTab === 'Repairs' && (
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setShowSolveModal(true); }} className="bg-green-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-md">Solved</button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleRetireAsset(asset.asset_id); }} className="bg-gray-800 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 transition">Retire</button>
                                                    </div>
                                                )}
                                                {activeTab === 'Retired' && (
                                                    <div className="flex items-center gap-3 justify-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleRestoreAsset(asset.asset_id); }}
                                                            className="bg-orange-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-md hover:bg-black transition"
                                                        >
                                                            Back to Inventory
                                                        </button>
                                                        <div className="border-l pl-3 border-gray-200">
                                                            <Trash2
                                                                size={18}
                                                                className="text-red-500 cursor-pointer hover:scale-110 transition hover:text-red-700"
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.asset_id); }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Dialog open={showRegisterModal} onClose={() => { setShowRegisterModal(false); setIsEditing(false); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px' } }}>
                        <DialogTitle sx={{ fontWeight: 600, textTransform: 'uppercase', pt: 2, px: 4 }}>{isEditing ? 'Edit Asset Details' : `Register New ${typeName}`}</DialogTitle>
                        <DialogContent dividers sx={{ px: 4, py: 1.5 }}>
                            <Grid container spacing={2.5}>
                                <Grid item xs={6}><TextField fullWidth label="Asset ID" disabled={isEditing} value={registerData.asset_id} onChange={e => setRegisterData({ ...registerData, asset_id: e.target.value })} /></Grid>
                                <Grid item xs={6}><TextField fullWidth label="Brand" value={registerData.brand} onChange={e => setRegisterData({ ...registerData, brand: e.target.value })} /></Grid>
                                <Grid item xs={12}><TextField fullWidth label="Model" value={registerData.model} onChange={e => setRegisterData({ ...registerData, model: e.target.value })} /></Grid>
                                {typeName === 'Laptop' && (
                                    <>
                                        <Grid item xs={6}><TextField fullWidth label="Processor" value={registerData.processor} onChange={e => setRegisterData({ ...registerData, processor: e.target.value })} /></Grid>
                                        <Grid item xs={6}><TextField fullWidth label="RAM" value={registerData.ram} onChange={e => setRegisterData({ ...registerData, ram: e.target.value })} /></Grid>
                                        <Grid item xs={6}><TextField fullWidth label="Storage" value={registerData.storage_capacity} onChange={e => setRegisterData({ ...registerData, storage_capacity: e.target.value })} /></Grid>
                                        <Grid item xs={6}><TextField fullWidth label="OS" value={registerData.os} onChange={e => setRegisterData({ ...registerData, os: e.target.value })} /></Grid>
                                        <Grid item xs={12}><TextField fullWidth label="Screen Size" value={registerData.screen_size} onChange={e => setRegisterData({ ...registerData, screen_size: e.target.value })} /></Grid>
                                    </>
                                )}
                                <Grid item xs={12}><TextField fullWidth type="date" label="Purchase Date" InputLabelProps={{ shrink: true }} value={registerData.bought_on} onChange={e => setRegisterData({ ...registerData, bought_on: e.target.value })} /></Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 1.5, px: 3 }}>
                            <Button onClick={() => { setShowRegisterModal(false); setIsEditing(false); }} sx={{ color: 'gray', fontWeight: 'bold' }}>Cancel</Button>
                            <Button variant="contained" onClick={handleAddAsset} disabled={!registerData.asset_id}>{isEditing ? 'Update Details' : 'Save to Inventory'}</Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog open={showEndModal} onClose={() => setShowEndModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px', p: 1 } }}>
                        <DialogTitle sx={{ fontWeight: 600, textTransform: 'uppercase', pt: 2, px: 4 }}>End Assignment: {selectedAsset?.asset_id}</DialogTitle>
                        <DialogContent sx={{ px: 4, py: 1 }}>
                            <Box sx={{ mb: 1, p: 2, backgroundColor: '#fff7ed', borderRadius: '16px', border: '1px solid #ffedd5' }}>
                                <p className="text-[11px] font-semibold text-orange-800 uppercase tracking-wider">Current User</p>
                                <p className="text-sm font-semibold text-gray-900">{selectedAsset?.employee_name}</p>
                                <p className="text-[10px] font-semibold text-orange-600 uppercase">{selectedAsset?.employee_id}</p>
                            </Box>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1 block">Reason for Return / Remarks</label>
                            <TextField sx={{ fontWeight:50 }} fullWidth multiline rows={4} placeholder="e.g. Employee resigned, Upgrading device, etc." value={returnRemarks} onChange={(e) => setReturnRemarks(e.target.value)} />
                        </DialogContent>
                        <DialogActions sx={{ p: 2, pt: 1 }}>
                            <Button onClick={() => setShowEndModal(false)} sx={{ color: 'gray', fontWeight: 'bold' }}>Cancel</Button>
                            <Button variant="contained" onClick={handleEndAssignment} sx={{ px: 2, borderRadius: '12px', backgroundColor: '#ea580c', '&:hover': { backgroundColor: '#000' } }}>Complete Return</Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px', p: 1 } }}>
                        <DialogTitle sx={{ fontWeight: 600, textTransform: 'uppercase', pt: 1, px: 3 }}>Assign to Employee</DialogTitle>
                        <DialogContent sx={{ px: 3, py: 1 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}><Box sx={{ mb: 1 }}>
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Select Results</label>
                                </Box>
                                <TextField select fullWidth value={assignData.employee_id} onChange={(e) => 
                                { 
                                    const emp = allEmployees.find(u => u.employee_id === e.target.value); 
                                    setAssignData({ ...assignData, employee_id: emp.employee_id, employee_name: emp.name }); }} 
                                    InputProps={{ sx: {width:'250px',maxWidth:'100%', borderRadius: '12px','& .MuiSelect-select':{pr:2} } }}>
                                        {filteredEmployees.map((emp) => (
                                    <MenuItem key={emp.id} value={emp.employee_id} sx={{ py: 1, borderBottom: '1px solid #f3f4f6' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}><span className="font-semibold text-gray-900">{emp.name}</span><span className="text-[10px] text-orange-500 font-black uppercase tracking-tighter">{emp.employee_id}</span>
                                </Box>
                                </MenuItem>))}
                                </TextField></Grid>
                                <Grid item xs={12}><Box sx={{ mb: 1 }}><label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Assignment Date</label></Box><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} value={assignData.from_date} onChange={(e) => setAssignData({ ...assignData, from_date: e.target.value })} InputProps={{ sx: { borderRadius: '12px' } }} /></Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 2, pt: 1 }}><Button onClick={() => setShowAssignModal(false)} sx={{ color: 'gray', fontWeight: 'bold' }}>Cancel
                            </Button><Button variant="contained" onClick={handleAssignSubmit} disabled={!assignData.employee_id} sx={{ px: 2, py: 1, borderRadius: '12px', fontWeight: '600', backgroundColor: '#ea580c' }}>Confirm Assignment
                                </Button>
                                </DialogActions>
                    </Dialog>
                    <Dialog open={showRepairModal} onClose={() => setShowRepairModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px', p: 1 } }}>
                        <DialogTitle sx={{ fontWeight: 600, textTransform: 'uppercase', pt: 1, px: 3 }}>Move to Repair: {selectedAsset?.asset_id}</DialogTitle>
                        <DialogContent sx={{ px: 4, py: 1 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}><Box sx={{ mb: 1 }}><label className="text-[10px] font-semibold text-gray-400 uppercase">Issue Description (Faced)</label></Box><TextField fullWidth multiline rows={3} placeholder="Describe the issue reported..." value={repairData.issue} onChange={e => setRepairData({ ...repairData, issue: e.target.value })} /></Grid>
                                <Grid item xs={12}><Box sx={{ mb: 1 }}><label className="text-[10px] font-semibold text-gray-400 uppercase">Reported Date</label></Box><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} value={repairData.date} onChange={e => setRepairData({ ...repairData, date: e.target.value })} /></Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 2, pt: 1 }}><Button onClick={() => setShowRepairModal(false)}>Cancel</Button><Button variant="contained" onClick={handleRepairSubmit} sx={{ backgroundColor: '#ef4444' }}>Move to Repairs</Button></DialogActions>
                    </Dialog>
                    <Dialog open={showSolveModal} onClose={() => setShowSolveModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '28px', p: 1 } }}>
                        <DialogTitle sx={{ fontWeight: 600, textTransform: 'uppercase', pt: 2, px: 4 }}>Resolve Repair: {selectedAsset?.asset_id}</DialogTitle>
                        <DialogContent sx={{ px: 4, py: 2 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}><Box sx={{ mb: 1 }}><label className="text-[10px] font-black text-gray-400 uppercase">Actual Issue Fixed</label></Box><TextField fullWidth multiline rows={2} placeholder="What was the final diagnosis/fix?" value={solveData.main_issue} onChange={e => setSolveData({ ...solveData, main_issue: e.target.value })} /></Grid>
                                <Grid item xs={6}><Box sx={{ mb: 1 }}><label className="text-[10px] font-black text-gray-400 uppercase">Final Repair Cost</label></Box><TextField fullWidth type="number" placeholder="0.00" value={solveData.cost} onChange={e => setSolveData({ ...solveData, cost: e.target.value })} /></Grid>
                                <Grid item xs={6}><Box sx={{ mb: 1 }}><label className="text-[10px] font-black text-gray-400 uppercase">Resolution Date</label></Box><TextField fullWidth type="date" InputLabelProps={{ shrink: true }} value={solveData.solved_date} onChange={e => setSolveData({ ...solveData, solved_date: e.target.value })} /></Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 4, pt: 1 }}>
                            <Button onClick={() => setShowSolveModal(false)}>Cancel</Button>
                            <Button variant="contained" onClick={handleSolveSubmit} sx={{ backgroundColor: '#16a34a' }}>Confirm Resolution</Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
        </ThemeProvider>
    );
};

export default AssetDetails;