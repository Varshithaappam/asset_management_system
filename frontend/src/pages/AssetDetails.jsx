import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext';
import { useConfirm } from '../context/ConfirmContext';
import { theme } from '../theme';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Grid, createTheme, ThemeProvider
} from '@mui/material';

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

const AssetDetails = () => {
    const { typeName } = useParams();
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const askConfirmation = useConfirm();

    const [assets, setAssets] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const [assignData, setAssignData] = useState({
        asset_id: '', brand: '', model: '', ram: '', processor: '',
        screen_size: '', os: '', storage_capacity: '',
        employee_id: '', employee_name: '',
        from_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => { fetchAssets(); }, [typeName]);

    const fetchAssets = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/assets/details/${typeName}`);
            setAssets(res.data);
        } catch (err) { showSnackbar("Error fetching asset details", "error"); }
    };

    const handleDeleteType = () => {
        askConfirmation(
            "Delete Category",
            `Are you sure you want to delete '${typeName}'?`,
            async () => {
                try {
                    await axios.put(`http://localhost:5000/api/asset-types/soft-delete/${typeName}`);
                    showSnackbar(`${typeName} deleted successfully`, "success");
                    navigate('/');
                } catch (err) {
                    showSnackbar("Failed to delete category", "error");
                }
            }
        );
    };

    const handleAddAndAssign = async () => {
        try {
            const payload = {
                asset_id: assignData.asset_id,
                brand: assignData.brand,
                model: assignData.model,
                typeName: typeName,
                employee_id: assignData.employee_id,
                employee_name: assignData.employee_name,
                from_date: assignData.from_date,
                ram: typeName === 'Laptop' ? assignData.ram : null,
                processor: typeName === 'Laptop' ? assignData.processor : null,
                storage_capacity: typeName === 'Laptop' ? assignData.storage_capacity : null,
                os: typeName === 'Laptop' ? assignData.os : null,
                screen_size: typeName === 'Laptop' ? assignData.screen_size : null,
            };

            const res = await axios.post('http://localhost:5000/api/assets/assignments', payload);

            showSnackbar(res.data.message, "success");
            setShowAssignModal(false);
            setAssignData({
                asset_id: '', brand: '', model: '', ram: '', processor: '',
                screen_size: '', os: '', storage_capacity: '',
                employee_id: '', employee_name: '',
                from_date: new Date().toISOString().split('T')[0]
            });

            fetchAssets();
        } catch (err) {
            showSnackbar(err.response?.data?.error || "Server Error", "error");
        }
    };

    return (
        <ThemeProvider theme={orangeMuiTheme}>
            <div className={`min-h-screen ${theme.pageBg} ${theme.mainText} p-8`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className={`p-2 hover:${theme.iconBg} rounded-full ${theme.iconText} transition`}
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className="text-2xl font-semibold uppercase tracking-tight">{typeName} Inventory</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className={`${theme.btnPrimary} px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all`}
                            >
                                <Plus size={20} /> Assign New {typeName}
                            </button>
                            <button
                                onClick={handleDeleteType}
                                className={`${theme.btnSecondary} border-red-100 text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all`}
                            >
                                <Trash2 size={16} /> Delete {typeName}
                            </button>
                        </div>
                    </div>

                    <div className={`${theme.cardBg} rounded-3xl ${theme.cardShadowHover} overflow-hidden border ${theme.cardBorder}`}>
                        <table className="w-full text-left">
                            <thead className={`${theme.tableHeaderBg} border-b ${theme.cardBorder} text-xs font-semibold uppercase ${theme.tableHeaderText}`}>
                                <tr>
                                    <th className="px-6 py-4">Asset ID</th>
                                    <th className="px-6 py-4">Brand & Model</th>
                                    {typeName === 'Laptop' && (
                                        <>
                                            <th className="px-6 py-4">Processor & RAM</th>
                                            <th className="px-6 py-4">Storage & OS</th>
                                            <th className="px-6 py-4">Screen Size</th>
                                        </>
                                    )}
                                    <th className="px-6 py-4">Assigned To</th>
                                    <th className="px-6 py-4 text-center">Assign Date</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${theme.tableRowBorder}`}>
                                {assets.map((asset) => (
                                    <tr key={asset.asset_id} className={`${theme.tableRowHover} transition`}>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`/assets/history/${asset.asset_id}`)}
                                                className={`font-semibold ${theme.statusAssigned} hover:text-black transition-all text-left`}
                                            >
                                                {asset.asset_id}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`font-normal ${theme.mainText}`}>{asset.brand}</div>
                                            <div className={`text-xs ${theme.mutedText} font-medium`}>{asset.model}</div>
                                        </td>

                                        {typeName === 'Laptop' && (
                                            <>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className={`${theme.mainText} font-normal opacity-80`}>{asset.processor || '-'}</div>
                                                    <div className={`text-xs ${theme.mutedText}`}>{asset.ram ? `${asset.ram} RAM` : '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className={`${theme.mainText} font-normal opacity-80`}>{asset.storage_capacity || '-'}</div>
                                                    <div className={`text-xs ${theme.mutedText}`}>{asset.os || '-'}</div>
                                                </td>
                                                <td className={`px-6 py-4 text-sm ${theme.mainText} font-normal opacity-80`}>
                                                    {asset.screen_size || '-'}
                                                </td>
                                            </>
                                        )}

                                        <td className="px-6 py-4">
                                            <div className={`text-sm font-normal ${theme.mainText}`}>{asset.employee_name}</div>
                                            <div className={`text-xs ${theme.mutedText} font-mono`}>{asset.employee_id}</div>
                                        </td>
                                        <td className={`px-6 py-4 text-center ${theme.mutedText} font-normal text-xs uppercase`}>{asset.assign_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {assets.length === 0 && (
                            <div className={`p-20 text-center ${theme.mutedText} font-bold uppercase tracking-widest italic`}>No assets registered under this category.</div>
                        )}
                    </div>

                    <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
                        <DialogTitle sx={{ fontWeight: '900', textTransform: 'uppercase', tracking: 'tight', pt: 3, color: '#111827' }}>Register & Assign {typeName}</DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={6}><TextField fullWidth size="small" label="Asset ID" value={assignData.asset_id} onChange={e => setAssignData({ ...assignData, asset_id: e.target.value })} /></Grid>
                                <Grid item xs={6}><TextField fullWidth size="small" label="Brand" value={assignData.brand} onChange={e => setAssignData({ ...assignData, brand: e.target.value })} /></Grid>
                                <Grid item xs={12}><TextField fullWidth size="small" label="Model" value={assignData.model} onChange={e => setAssignData({ ...assignData, model: e.target.value })} /></Grid>

                                {typeName === 'Laptop' && (
                                    <>
                                        <Grid item xs={6}><TextField fullWidth size="small" label="Processor" value={assignData.processor} onChange={e => setAssignData({ ...assignData, processor: e.target.value })} /></Grid>
                                        <Grid item xs={6}><TextField fullWidth size="small" label="RAM" value={assignData.ram} onChange={e => setAssignData({ ...assignData, ram: e.target.value })} /></Grid>
                                        <Grid item xs={6}><TextField fullWidth size="small" label="Storage" value={assignData.storage_capacity} onChange={e => setAssignData({ ...assignData, storage_capacity: e.target.value })} /></Grid>
                                        <Grid item xs={6}><TextField fullWidth size="small" label="OS" value={assignData.os} onChange={e => setAssignData({ ...assignData, os: e.target.value })} /></Grid>
                                        <Grid item xs={12}><TextField fullWidth size="small" label="Screen Size" value={assignData.screen_size} onChange={e => setAssignData({ ...assignData, screen_size: e.target.value })} /></Grid>
                                    </>
                                )}

                                <Grid item xs={6}><TextField fullWidth size="small" label="Emp ID" value={assignData.employee_id} onChange={e => setAssignData({ ...assignData, employee_id: e.target.value })} /></Grid>
                                <Grid item xs={6}><TextField fullWidth size="small" label="Emp Name" value={assignData.employee_name} onChange={e => setAssignData({ ...assignData, employee_name: e.target.value })} /></Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 3 }}>
                            <Button onClick={() => setShowAssignModal(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                            <Button onClick={handleAddAndAssign} variant="contained" color="primary" disabled={!assignData.asset_id || !assignData.employee_id}>Register & Assign</Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </div>
        </ThemeProvider>
    );
};

export default AssetDetails;