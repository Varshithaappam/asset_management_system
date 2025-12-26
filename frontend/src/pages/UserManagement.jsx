import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserPlus, Edit2, X, Trash2 } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext';
import { useConfirm } from '../context/ConfirmContext';

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
    const action = isEditing ? 'update' : 'add';
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">User Management</h2>
          <button
            onClick={() => { setIsEditing(false); setFormData({ name: '', email: '' }); setShowModal(true); }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-900/20"
          >
            <UserPlus size={18} /> Add user
          </button>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          <table className="w-full text-left">
            <thead className="bg-gray-900/50 border-b border-gray-700 text-sm font-semibold text-gray-400">
              <tr>
                <th className="px-6 py-4 text-center w-20">#</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Email ID</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 text-center text-gray-500">{index + 1}</td>
                  <td
                    className="px-6 py-4 font-medium cursor-pointer text-blue-400 hover:text-white transition-all"
                    onClick={() => {
                      setIsEditing(true);
                      setSelectedUser(user);
                      setFormData({ name: user.name, email: user.email });
                      setShowModal(true);
                    }}
                  >
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setIsEditing(true); setSelectedUser(user); setFormData({ name: user.name, email: user.email }); setShowModal(true); }} className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-full transition"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(user)} className="p-2 text-red-400 hover:bg-red-900/30 rounded-full transition"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold mb-6">{isEditing ? 'Update User' : 'Add New User'}</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Full Name</label>
                <input required className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Email Address</label>
                <input required type="email" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-400 hover:text-white transition">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">Save User</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;