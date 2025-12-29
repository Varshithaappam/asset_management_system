import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserPlus, Edit2, X, Trash2 } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext';
import { useConfirm } from '../context/ConfirmContext';
import { theme } from '../theme';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const showSnackbar = useSnackbar();
  const askConfirmation = useConfirm();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (error) { showSnackbar("Failed to load users", "error"); }
  }, [showSnackbar]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = (user) => {
    askConfirmation("Confirm Deletion", `Remove user access for ${user.name}?`, async () => {
      try {
        await axios.delete(`http://localhost:5000/api/users/${user.id}`);
        showSnackbar("User removed", "success");
        fetchUsers();
      } catch (err) { showSnackbar("Failed to delete user", "error"); }
    }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/users/${selectedUser.id}`, formData);
        showSnackbar("User updated", "success");
      } else {
        await axios.post('http://localhost:5000/api/users', formData);
        showSnackbar("User added", "success");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) { showSnackbar("Error saving user", "error"); }
  };

  return (
    <div className={`min-h-screen ${theme.pageBg} ${theme.mainText} p-5`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold uppercase tracking-tight">User Management</h2>
          <button
            onClick={() => { setIsEditing(false); setFormData({ name: '', email: '' }); setShowModal(true); }}
            className={`${theme.btnPrimary} px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg`}
          >
            <UserPlus size={18} /> Add user
          </button>
        </div>

        <div className={`${theme.cardBg} rounded-2xl ${theme.cardShadow} overflow-hidden border ${theme.cardBorder}`}>
          <table className="w-full text-left">
            <thead className={`${theme.tableHeaderBg} border-b ${theme.cardBorder} text-sm font-bold ${theme.tableHeaderText} uppercase`}>
              <tr>
                <th className="px-6 py-4 text-center w-20">#</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Email ID</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.tableRowBorder}`}>
              {users.map((user, index) => (
                <tr key={user.id} className={`${theme.tableRowHover} transition`}>
                  <td className={`px-6 py-4 text-center ${theme.mutedText} font-medium`}>{index + 1}</td>
                  <td
                    className={`px-6 py-4 font-semibold cursor-pointer ${theme.statusAssigned} hover:text-black transition-all`}
                    onClick={() => {
                      setIsEditing(true);
                      setSelectedUser(user);
                      setFormData({ name: user.name, email: user.email });
                      setShowModal(true);
                    }}
                  >
                    {user.name}
                  </td>
                  <td className={`px-6 py-4 ${theme.mutedText} font-medium`}>{user.email}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => { setIsEditing(true); setSelectedUser(user); setFormData({ name: user.name, email: user.email }); setShowModal(true); }} 
                        className={`p-2 ${theme.statusAssigned} hover:${theme.iconBg} rounded-full transition`}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user)} 
                        className={`p-2 text-red-600 hover:bg-red-50 rounded-full transition`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className={`p-20 text-center ${theme.mutedText} italic font-bold uppercase tracking-widest`}>
              No users registered in the system.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className={`${theme.cardBg} p-8 rounded-3xl shadow-2xl max-w-md w-full border ${theme.cardBorder}`}>
            <h3 className={`text-2xl font-black mb-6 uppercase tracking-tight ${theme.mainText}`}>
              {isEditing ? 'Update User' : 'Add New User'}
            </h3>
            <div className="space-y-5">
              <div>
                <label className={`block text-xs font-bold ${theme.mutedText} mb-2 uppercase tracking-wider`}>Full Name</label>
                <input 
                  required 
                  className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl px-4 py-2 ${theme.mainText} outline-none focus:${theme.cardBorderHover} transition-all`} 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div>
                <label className={`block text-xs font-bold ${theme.mutedText} mb-2 uppercase tracking-wider`}>Email Address</label>
                <input 
                  required 
                  type="email" 
                  className={`w-full bg-gray-50 border-2 ${theme.cardBorder} rounded-xl px-4 py-2 ${theme.mainText} outline-none focus:${theme.cardBorderHover} transition-all`} 
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setShowModal(false)} className={`px-5 py-2 ${theme.mutedText} font-bold hover:${theme.mainText} transition`}>Cancel</button>
              <button type="submit" className={`px-6 py-2 ${theme.btnPrimary} rounded-xl font-bold shadow-md transition`}>Save User</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;