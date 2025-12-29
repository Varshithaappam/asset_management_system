import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Wrench, History, UserMinus, ShieldCheck, Cpu, CheckCircle } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext';
import { theme } from '../theme';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Typography, ThemeProvider, createTheme
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

const AssetDeepView = () => {
    const { assetId, empId } = useParams();
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();

    const [details, setDetails] = useState(null);
    const [repairs, setRepairs] = useState([]);
    const [assignmentHistory, setAssignmentHistory] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    const [showRepairModal, setShowRepairModal] = useState(false);
    const [showEndAssignment, setShowEndAssignment] = useState(false);

    const [endRemarks, setEndRemarks] = useState('');
    const [repairForm, setRepairForm] = useState({
        date_reported: new Date().toISOString().split('T')[0],
        issue_reported: '',
        amount: '',
        resolver_comments: ''
    });

    const [reassignForm, setReassignForm] = useState({
        new_employee_id: '',
        new_employee_name: '',
        remarks: ''
    });

    const fetchFullDetails = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/assets/id/${assetId}`);
            setDetails(res.data);

            const repairRes = await axios.get(`http://localhost:5000/api/assets/repairs/${assetId}`);
            setRepairs(repairRes.data);

            const historyRes = await axios.get(`http://localhost:5000/api/assets/history/${assetId}`);
            setAssignmentHistory(historyRes.data);

        } catch (err) {
            console.error("Fetch error:", err);
            showSnackbar("Error fetching asset details", "error");
        }
    };

    useEffect(() => {
        fetchFullDetails();
    }, [assetId]);

    const employeeRecord = assignmentHistory.find(h => h.employee_id === empId);

    const isAssignmentActive = employeeRecord &&
        (!employeeRecord.to_date ||
            employeeRecord.to_date === '---' ||
            employeeRecord.to_date === '00-00-0000');

    const handleEndAssignment = async () => {
        if (!endRemarks.trim()) {
            showSnackbar("Please provide remarks", "error");
            return;
        }
        try {
            const res = await axios.post('http://localhost:5000/api/assets/end-assignment', {
                asset_id: assetId,
                employee_id: empId,
                remarks: endRemarks
            });
            showSnackbar(res.data.message, "success");
            setShowEndAssignment(false);
            setEndRemarks('');
            fetchFullDetails();
        } catch (err) {
            showSnackbar("Failed to end assignment", "error");
        }
    };

    const handleRepairSubmit = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/assets/add-repair', {
                asset_id: assetId,
                ...repairForm
            });
            showSnackbar(res.data.message, "success");
            setShowRepairModal(false);
            fetchFullDetails();
        } catch (err) {
            showSnackbar("Error adding repair", "error");
        }
    };

    const handleReassignSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/assets/reassign', {
                asset_id: assetId,
                old_employee_id: empId,
                ...reassignForm
            });
            showSnackbar(response.data.message, "success");
            setIsUpdating(false);
            fetchFullDetails();
            setTimeout(() => navigate(`/assets/history/${assetId}`), 1500);
        } catch (err) {
            showSnackbar("Reassignment failed", "error");
        }
    };

    return (
        <ThemeProvider theme={orangeMuiTheme}>
            <div className={`min-h-screen ${theme.pageBg} ${theme.mainText} p-8 font-sans`}>
                <div className="max-w-7xl mx-auto">
                    <button onClick={() => navigate(-1)} className={`flex items-center gap-2 text-black hover:opacity-80 mb-8 transition-all group font-bold`}>
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to History
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 space-y-6">
                            <div className={`bg-white border-2 ${theme.cardBorder} rounded-3xl p-8 shadow-xl`}>
                                <h2 className={`text-2xl font-semibold mb-4 flex items-center gap-2 ${theme.iconText} uppercase tracking-tight`}>
                                    <ShieldCheck /> Device Information
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4 mb-2">
                                    <div><p className={`${theme.mutedText} text-[10px] uppercase font-bold mb-1`}>Asset ID</p><p className="text-xl font-semibold">{details?.asset_id}</p></div>
                                    <div><p className={`${theme.mutedText} text-[10px] uppercase font-bold mb-1`}>Brand</p><p className="text-xl font-semibold">{details?.brand}</p></div>
                                    <div><p className={`${theme.mutedText} text-[10px] uppercase font-bold mb-1`}>Model</p><p className="text-xl font-semibold">{details?.model}</p></div>
                                </div>

                                {details?.asset_id?.startsWith('LPT') && (
                                    <div className={`border-t ${theme.tableRowBorder} pt-8`}>
                                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-purple-600 uppercase tracking-tight">
                                            <Cpu /> Configuration
                                        </h2>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
                                            <div><p className={`${theme.mutedText} text-[10px] uppercase font-bold mb-1`}>Processor</p><p className="font-semibold">{details?.processor || '---'}</p></div>
                                            <div><p className={`${theme.mutedText} text-[10px] uppercase font-bold mb-1`}>RAM</p><p className="font-semibold">{details?.ram || '---'}</p></div>
                                            <div><p className={`${theme.mutedText} text-[10px] uppercase font-bold mb-1`}>Storage</p><p className="font-semibold">{details?.storage_capacity || '---'}</p></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {isAssignmentActive ? (
                                <>
                                    {!isUpdating ? (
                                        <div className={`bg-orange-50 border-2 ${theme.cardBorder} p-4 rounded-3xl shadow-lg`}>
                                            <h3 className={`text-xl font-semibold mb-4 ${theme.iconText} uppercase tracking-tighter flex items-center gap-2`}>
                                                <History size={15} /> Reassignment Flow
                                            </h3>
                                            <p className={`${theme.mutedText} text-sm mb-3 font-medium`}>Asset is currently with <b className={theme.mainText}>{empId}</b>.</p>
                                            <button onClick={() => setIsUpdating(true)} className={`w-full ${theme.btnPrimary} py-4 rounded-2xl font-semibold text-sm uppercase transition-all`}>
                                                Update Assignment
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`bg-white border-2 ${theme.cardBorderHover} p-4 rounded-3xl shadow-2xl`}>
                                            <h3 className={`text-xl font-semibold ${theme.iconText} mb-3 uppercase`}>New Assignment</h3>
                                            <form onSubmit={handleReassignSubmit} className="space-y-4">
                                                <input required placeholder="New Employee ID" className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl p-3 text-sm focus:${theme.cardBorderHover} outline-none transition-all`} value={reassignForm.new_employee_id} onChange={(e) => setReassignForm({ ...reassignForm, new_employee_id: e.target.value })} />
                                                <input required placeholder="New Employee Name" className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl p-3 text-sm focus:${theme.cardBorderHover} outline-none transition-all`} value={reassignForm.new_employee_name} onChange={(e) => setReassignForm({ ...reassignForm, new_employee_name: e.target.value })} />
                                                <textarea required placeholder="Transfer Remarks" className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl p-3 text-sm focus:${theme.cardBorderHover} outline-none transition-all`} value={reassignForm.remarks} onChange={(e) => setReassignForm({ ...reassignForm, remarks: e.target.value })} />
                                                <button type="submit" className={`w-full bg-green-600 text-white hover:bg-green-700 py-4 rounded-2xl font-black uppercase text-xs transition-all shadow-md shadow-green-100`}>Confirm</button>
                                                <button type="button" onClick={() => setIsUpdating(false)} className={`w-full ${theme.mutedText} text-xs uppercase font-black mt-2 hover:${theme.mainText} transition-all`}>Cancel</button>
                                            </form>
                                        </div>
                                    )}
                                    {!isUpdating && (
                                        <div className="bg-red-50 border-2 border-red-100 p-3 rounded-3xl shadow-lg">
                                            <h3 className="text-lg font-semibold mb-2 text-red-600 uppercase flex items-center gap-3">
                                                <UserMinus size={15} /> End Assignment
                                            </h3>
                                            <button onClick={() => setShowEndAssignment(true)} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold uppercase text-sm transition-all shadow-md shadow-red-100">
                                                End User Assignment
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className={`bg-orange-50 border-2 ${theme.cardBorder} p-8 rounded-3xl text-center shadow-inner`}>
                                    <CheckCircle className={`mx-auto text-green-600 mb-4`} size={48} />
                                    <h3 className={`text-lg font-black ${theme.mainText} uppercase`}>Assignment Closed</h3>
                                    <p className={`text-xs ${theme.mutedText} mt-2 font-medium`}>
                                        This employee's tenure with this asset ended on <br />
                                        <span className={`${theme.iconText} font-black`}>{employeeRecord?.to_date}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <Dialog open={showEndAssignment} onClose={() => setShowEndAssignment(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '24px' } }}>
                    <DialogTitle sx={{ fontWeight: '900', textTransform: 'uppercase', tracking: 'tight' }}>End User Assignment</DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontStyle: 'italic' }}>Provide remarks regarding the device condition.</Typography>
                        <TextField
                            fullWidth multiline rows={3} label="Closing Remarks" variant="outlined" value={endRemarks}
                            onChange={(e) => setEndRemarks(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setShowEndAssignment(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                        <Button onClick={handleEndAssignment} variant="contained" color="error" sx={{ fontWeight: '900' }}>Confirm End</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={showRepairModal} onClose={() => setShowRepairModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '24px' } }}>
                    <DialogTitle sx={{ fontWeight: '900', textTransform: 'uppercase' }}>Add Repair Record</DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField label="Issue Description" fullWidth value={repairForm.issue_reported} onChange={(e) => setRepairForm({ ...repairForm, issue_reported: e.target.value })} />
                        <TextField label="Repair Cost (₹)" type="number" fullWidth value={repairForm.amount} onChange={(e) => setRepairForm({ ...repairForm, amount: e.target.value })} />
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={() => setShowRepairModal(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
                        <Button onClick={handleRepairSubmit} variant="contained" sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, fontWeight: '900' }}>Save</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </ThemeProvider>
    );
};

export default AssetDeepView;