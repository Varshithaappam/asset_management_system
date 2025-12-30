import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, History } from 'lucide-react';
import { ThemeProvider, createTheme } from '@mui/material';
import { theme } from '../theme';

const orangeMuiTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#ea580c' },
        background: { paper: '#ffffff', default: '#ffffff' }
    }
});

const AssetHistory = () => {
    const { assetId } = useParams();
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [repairs, setRepairs] = useState([]);
    const [viewMode, setViewMode] = useState('assignment');

    const fetchAssetData = async () => {
        try {
            // Fetch Assignment History
            const histRes = await axios.get(`http://localhost:5000/api/assets/history/${assetId}`);
            setHistory(histRes.data);
            // Fetch Repair History
            const repairRes = await axios.get(`http://localhost:5000/api/assets/repairs/${assetId}`);
            setRepairs(repairRes.data);
        } catch (err) {
            console.error("Error loading asset data:", err);
        }
    };

    useEffect(() => {
        fetchAssetData();
    }, [assetId]);

    return (
        <ThemeProvider theme={orangeMuiTheme}>
            <div className={`min-h-screen ${theme.pageBg} ${theme.mainText} p-5`}>
                <div className="max-w-7xl mx-auto">
                    {/* Simplified Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className={`p-2 hover:${theme.iconBg} rounded-full ${theme.iconText} transition`}>
                                <ArrowLeft size={25} />
                            </button>
                            <div>
                                <p className={`${theme.iconText} font-mono text-[10px] uppercase tracking-widest font-black`}>Asset History</p>
                                <h1 className="text-xl font-semibold uppercase tracking-tighter">Asset: {assetId}</h1>
                            </div>
                        </div>
                    </div>

                    {/* Unified History Container */}
                    <div className={`bg-white rounded-3xl ${theme.cardShadowHover} overflow-hidden border-2 ${theme.cardBorder}`}>
                        <div className={`p-2 ${theme.tableHeaderBg} border-b ${theme.cardBorder} flex flex-col md:flex-row items-center justify-between gap-4`}>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <History size={20} className={theme.iconText} />
                                    <span className={`font-semibold uppercase tracking-tighter ${theme.mainText}`}>
                                        {viewMode === 'assignment' ? 'Assignment History' : 'Repair History'}
                                    </span>
                                </div>
                                <div className={`flex bg-white p-1 rounded-xl border ${theme.cardBorder}`}>
                                    <button
                                        onClick={() => setViewMode('assignment')}
                                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'assignment' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-orange-600'}`}
                                    >
                                        Assignments
                                    </button>
                                    <button
                                        onClick={() => setViewMode('repair')}
                                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${viewMode === 'repair' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-orange-600'}`}
                                    >
                                        Repairs
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                {viewMode === 'assignment' ? (
                                    <>
                                        <thead className={`${theme.tableHeaderBg} text-[10px] font-black ${theme.tableHeaderText} uppercase border-b ${theme.cardBorder}`}>
                                            <tr>
                                                <th className="px-6 py-3">Employee Name</th>
                                                <th className="px-6 py-3">Employee ID</th>
                                                <th className="px-6 py-3">From Date</th>
                                                <th className="px-6 py-3">To Date</th>
                                                <th className="px-6 py-3">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${theme.tableRowBorder}`}>
                                            {history.map((entry, index) => (
                                                <tr key={index} className={`${theme.tableRowHover} transition-all`}>
                                                    <td className={`px-6 py-2.5 font-semibold text-sm ${theme.mainText}`}>{entry.employee_name}</td>
                                                    <td className={`px-6 py-2.5 ${theme.mutedText} font-mono text-xs font-bold`}>{entry.employee_id}</td>
                                                    <td className={`px-6 py-2.5 text-xs font-medium ${theme.mainText} opacity-70`}>{entry.from_date}</td>
                                                    <td className={`px-6 py-2.5 text-xs`}>
                                                        {entry.to_date ? <span className="opacity-70 font-medium">{entry.to_date}</span> : <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-black text-[10px] uppercase border border-green-200">Active Holder</span>}
                                                    </td>
                                                    <td className={`px-6 py-2.5 text-xs ${theme.mutedText} italic font-medium`}>{entry.remarks || "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </>
                                ) : (
                                    <>
                                        <thead className={`${theme.tableHeaderBg} text-[10px] font-black ${theme.tableHeaderText} uppercase border-b ${theme.cardBorder}`}>
                                            <tr>
                                                <th className="px-6 py-3">Reported By</th>
                                                <th className="px-6 py-3">Issue Description</th>
                                                <th className="px-6 py-3 text-center">Cost</th>
                                                <th className="px-6 py-3">Date Reported</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${theme.tableRowBorder}`}>
                                            {repairs.length > 0 ? repairs.map((repair, index) => (
                                                <tr key={index} className="transition-all">
                                                    <td className={`px-6 py-2.5 font-semibold text-sm ${theme.mainText}`}>
                                                        {repair.employee_name}
                                                    </td>
                                                    <td className={`px-6 py-2.5 text-sm ${theme.mainText} opacity-80 font-medium`}>
                                                        {repair.issue_reported}
                                                    </td>
                                                    <td className={`px-6 py-2.5 font-semibold text-sm text-center text-red-600`}>
                                                        ₹{repair.amount}
                                                    </td>
                                                    <td className={`px-6 py-2.5 ${theme.mutedText} font-mono text-xs font-semibold`}>
                                                        {repair.date_reported}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className={`px-6 py-6 text-center ${theme.mutedText} font-semibold text-[10px] uppercase tracking-widest italic opacity-50`}>
                                                        No maintenance history recorded for this asset.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ThemeProvider>
    );
};

export default AssetHistory;