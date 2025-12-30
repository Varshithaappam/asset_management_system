import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserPlus, Edit2, Trash2, Upload, Search, Package, Clock, ShieldCheck } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext';
import { useConfirm } from '../context/ConfirmContext';
import { theme } from '../theme';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, TextField, Box } from '@mui/material';

const UserManagement = ({ authUser }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ employee_id: '', name: '', email: '', role: 'Employee' });

  const [showProfile, setShowProfile] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeAssets, setEmployeeAssets] = useState({ currentAssets: [], history: [] });

  const showSnackbar = useSnackbar();
  const askConfirmation = useConfirm();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (error) { showSnackbar("Failed to load users", "error"); }
  }, [showSnackbar]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUserClick = async (user) => {
    setSelectedEmployee(user);
    try {
      const res = await axios.get(`http://localhost:5000/api/users/assets/${user.employee_id}`);
      setEmployeeAssets(res.data);
      setShowProfile(true);
    } catch (err) {
      showSnackbar("Failed to load employee profile", "error");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').slice(1);
      const importedUsers = rows.map(row => {
        const [empId, name, email] = row.split(',');
        return { employee_id: empId?.trim(), name: name?.trim(), email: email?.trim(), role: 'Employee' };
      }).filter(u => u.name && u.email);
      try {
        await axios.post('http://localhost:5000/api/users/bulk', { users: importedUsers });
        showSnackbar(`${importedUsers.length} users imported successfully`, "success");
        fetchUsers();
      } catch (err) { showSnackbar("Failed to import CSV", "error"); }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleDelete = (user) => {
    if (user.email === authUser?.email) {
      showSnackbar("Cannot remove your own administrative access", "error");
      return;
    }
    askConfirmation("Deactivate User", `Are you sure you want to remove access for ${user.name}? This will mark the user as inactive.`, async () => {
      try {
        await axios.delete(`http://localhost:5000/api/users/${user.id}`);
        showSnackbar("User access removed", "success");
        fetchUsers();
      } catch (err) { showSnackbar("Failed to deactivate user", "error"); }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/users/${selectedUser.id}`, formData);
        showSnackbar("User details and role updated", "success");
      } else {
        await axios.post('http://localhost:5000/api/users', formData);
        showSnackbar("New user added successfully", "success");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) { showSnackbar("Error saving user data", "error"); }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${theme.pageBg} ${theme.mainText} p-5`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-4">
          <div>
            <h2 className="text-2xl font-semibold uppercase tracking-tight">User Management</h2>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${theme.mutedText}`}>Admins:</span>
                <span className="text-sm font-black text-orange-600">{users.filter(u => u.role === 'Admin').length}</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-gray-300 pl-4">
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${theme.mutedText}`}>Employees:</span>
                <span className={`text-sm font-black ${theme.mainText}`}>{users.filter(u => u.role !== 'Admin').length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:w-55">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search ID, Name or Email..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <label className={`${theme.btnSecondary} px-2 py-2 rounded-xl flex items-center gap-2 cursor-pointer border shadow-sm`}>
              <Upload size={18} />
              <span className="hidden sm:inline">Add File</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
            <button
              onClick={() => { setIsEditing(false); setFormData({ employee_id: '', name: '', email: '', role: 'Employee' }); setShowModal(true); }}
              className={`${theme.btnPrimary} px-2 py-2 rounded-xl flex items-center gap-2 transition shadow-lg`}
            >
              <UserPlus size={18} /> Add user
            </button>
          </div>
        </div>

        <div className={`${theme.cardBg} rounded-2xl ${theme.cardShadow} overflow-hidden border ${theme.cardBorder}`}>
          <table className="w-full text-left">
            <thead className={`${theme.tableHeaderBg} border-b ${theme.cardBorder} text-sm font-bold ${theme.tableHeaderText} uppercase`}>
              <tr>
                <th className="px-6 py-3 text-center w-20">#</th>
                <th className="px-6 py-3">Emp ID</th>
                <th className="px-6 py-3">Full Name</th>
                <th className="px-6 py-3">Email ID</th>
                <th className="px-6 py-3 text-center">Role</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.tableRowBorder}`}>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className={`${theme.tableRowHover} transition`}>
                  <td className={`px-6 py-2 text-center ${theme.mutedText} font-medium`}>{index + 1}</td>
                  <td className={`px-6 py-2 font-mono text-xs font-bold text-orange-600`}>{user.employee_id || 'N/A'}</td>
                  <td
                    className={`px-6 py-2 font-semibold cursor-pointer ${theme.statusAssigned} hover:text-black transition-all`}
                    onClick={() => handleUserClick(user)}
                  >
                    {user.name}
                  </td>
                  <td className={`px-6 py-2 ${theme.mutedText} font-medium`}>{user.email}</td>
                  <td className="px-6 py-2 text-center">
                    {user.role === 'Admin' ? (
                      <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center justify-center gap-1 w-fit mx-auto">
                        <ShieldCheck size={10} /> Admin
                      </span>
                    ) : user.role === 'Inactive' ? (
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-red-200">
                        Inactive
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                        Employee
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {user.role !== 'Inactive' ? (
                        <>
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setSelectedUser(user);
                              setFormData({ employee_id: user.employee_id, name: user.name, email: user.email, role: user.role });
                              setShowModal(true);
                            }}
                            className={`p-2 ${theme.statusAssigned} hover:${theme.iconBg} rounded-full transition`}
                          >
                            <Edit2 size={18} />
                          </button>
                          {user.email !== authUser?.email && (
                            <button onClick={() => handleDelete(user)} className={`p-2 text-red-600 hover:bg-red-50 rounded-full transition`}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-sm font-medium text-gray-400 italic">No access</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 z-50">
          <form onSubmit={handleSubmit} className={`${theme.cardBg} p-8 rounded-3xl shadow-2xl max-w-md w-full border ${theme.cardBorder}`}>
            <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter text-gray-900">
              {isEditing ? 'Modify User Privileges' : 'Register New User'}
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Employee ID</label>
                <input required className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl px-4 py-2.5 ${theme.mainText} outline-none focus:border-orange-500 transition-all font-mono text-sm`} placeholder="GAD-000" value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Full Name</label>
                <input required className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl px-4 py-2.5 ${theme.mainText} outline-none focus:border-orange-500 transition-all text-sm`} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">Email Address</label>
                <input required type="email" className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl px-4 py-2.5 ${theme.mainText} outline-none focus:border-orange-500 transition-all text-sm`} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-1.5 uppercase tracking-widest">System Role</label>
                <select
                  className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl px-4 py-2.5 ${theme.mainText} outline-none focus:border-orange-500 transition-all text-sm font-bold`}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin (Management Access)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 font-bold hover:text-black transition uppercase text-xs tracking-widest">Discard</button>
              <button type="submit" className="bg-orange-600 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-black transition-all">
                {isEditing ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <Dialog open={showProfile} onClose={() => setShowProfile(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
        <DialogTitle sx={{ p: 3, pb: 0 }}>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-2xl font-black uppercase tracking-tighter text-gray-900">{selectedEmployee?.name}</span>
              <span className="text-xs font-bold text-orange-600 tracking-widest uppercase">ID: {selectedEmployee?.employee_id}</span>
            </div>
            <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-black transition text-xl">✕</button>
          </div>
        </DialogTitle>

        <DialogContent dividers sx={{ backgroundColor: '#f9fafb', py: 4 }}>
          <div className="mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Package size={14} className="text-green-500" /> Currently Holding ({employeeAssets.currentAssets.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employeeAssets.currentAssets.map(asset => (
                <div key={asset.asset_id} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-mono font-bold text-orange-600 text-sm">{asset.asset_id}</p>
                    <p className="text-sm font-bold text-gray-800">{asset.brand} {asset.model}</p>
                    <p className="text-[10px] uppercase font-medium text-gray-400">{asset.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Assigned On</p>
                    <p className="text-xs font-black">{new Date(asset.from_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {employeeAssets.currentAssets.length === 0 && (
                <p className="text-sm italic text-gray-400 py-2 pl-2">No assets currently assigned.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
              <Clock size={14} /> Assignment History
            </h3>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Asset</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employeeAssets.history.map((h, idx) => (
                    <tr key={idx} className="text-sm hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800">{h.asset_id}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase">{h.type}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="text-gray-500 font-medium">{h.from_date}</span>
                        <span className="mx-2 text-gray-300">→</span>
                        <span className="text-orange-600 font-bold">{h.to_date}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500 italic">{h.remarks || '---'}</div>
                        {h.remarks === 'Moved to Repair' && h.issue_reported && (
                          <div className="mt-1">
                            <span className="text-[9px] font-black uppercase text-red-400 tracking-tighter">Issue: </span>
                            <span className="text-[10px] text-gray-600 font-bold">{h.issue_reported}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {employeeAssets.history.length === 0 && (
                <div className="p-8 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">No history records found.</div>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowProfile(false)} sx={{ fontWeight: 'bold', color: '#666', textTransform: 'none', fontSize: '12px' }}>Close Profile</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserManagement;