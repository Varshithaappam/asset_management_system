import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UserPlus, Edit2, X, Trash2 } from 'lucide-react'; // Added Trash2 icon
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
    } catch (error) {
      showSnackbar("Failed to load users", "error");
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // NEW: Delete Logic
  const handleDelete = (user) => {
    askConfirmation(
      "Confirm Deletion",
      `Are you sure you want to remove ${user.name}? This action cannot be undone.`,
      async () => {
        try {
          await axios.delete(`http://localhost:5000/api/users/${user.id}`);
          showSnackbar("User deleted successfully", "success");
          fetchUsers();
        } catch (err) {
          showSnackbar(err.response?.data?.error || "Failed to delete user", "error");
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = isEditing ? 'update' : 'add';
    
    askConfirmation(
      isEditing ? "Update User" : "Add User",
      `Are you sure you want to ${action} ${formData.name}?`,
      async () => {
        try {
          if (isEditing) {
            await axios.put(`http://localhost:5000/api/users/${selectedUser.id}`, formData);
            showSnackbar("User updated successfully", "success");
          } else {
            await axios.post('http://localhost:5000/api/users', formData);
            showSnackbar("User added successfully", "success");
          }
          setShowModal(false);
          setFormData({ name: '', email: '' });
          fetchUsers(); 
        } catch (err) {
          showSnackbar(err.response?.data?.error || "An error occurred while saving.", "error");
        }
      }
    );
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email });
    setShowModal(true);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setFormData({ name: '', email: '' });
    setShowModal(true);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <button 
          onClick={openAddModal}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-700 transition"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-4 text-center w-20">#</th>
              <th className="px-6 py-4">User Name</th>
              <th className="px-6 py-4">Email ID</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={user.id || index} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-center text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        {/* Edit Button */}
                        <button 
                          onClick={() => openEditModal(user)} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                          title="Edit User"
                        >
                          <Edit2 size={18} />
                        </button>
                        
                        {/* NEW: Delete Button */}
                        <button 
                          onClick={() => handleDelete(user)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ... Modal Code stays exactly as before ... */}
      {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSubmit} 
            className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full relative animate-in fade-in zoom-in duration-200"
          >
            <button 
              type="button" 
              onClick={() => setShowModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {isEditing ? 'Update User Details' : 'Add New Authorized User'}
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input 
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input 
                  required
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md shadow-blue-200 transition"
              >
                {isEditing ? 'Save Changes' : 'Confirm & Add'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;