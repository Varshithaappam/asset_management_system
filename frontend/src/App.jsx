import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import AssetsLanding from './pages/AssetsLanding';
import UserManagement from './pages/UserManagement';

function App() {
  const [authUser, setAuthUser] = useState(null); // Auth State
  const location = useLocation();

  const handleLogout = async () => {
    try {
      // Requirement: Confirmation dialog for Logout
      if (window.confirm("Are you sure you want to logout?")) {
        await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
        setAuthUser(null);
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // If not logged in, only show the Login page
  if (!authUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login setAuthUser={setAuthUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 border-b shadow-2xl shadow-black/60 hover:bg-gray-900 border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <div className="flex bg-gray-300 p-1 rounded-xl">
            <Link 
              to="/" 
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                location.pathname === '/' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Assets
            </Link>
            <Link 
              to="/users" 
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                location.pathname === '/users' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              User Management
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-white hidden sm:block">Welcome, {authUser.name}</span>
          <button 
            onClick={handleLogout} 
            className="text-red-500 font-medium bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="container mx-auto p-6">
        <Routes>
          <Route path="/" element={<AssetsLanding />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;