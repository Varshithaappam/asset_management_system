import { useEffect } from 'react';
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import AssetsLanding from './pages/AssetsLanding';
import UserManagement from './pages/UserManagement';
import { useConfirm } from './context/ConfirmContext';
import { useSnackbar } from './context/SnackbarContext';
import AssetDetails from './pages/AssetDetails';
import AssetHistory from './pages/AssetHistory';
import AssetDeepView from './pages/AssetDeepView';

function App() {
  const [authUser, setAuthUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const askConfirmation = useConfirm();
  const showSnackbar = useSnackbar();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/me', { withCredentials: true });
        if (res.data.user) {
          setAuthUser(res.data.user);
        }
      } catch (err) {
        setAuthUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    askConfirmation(
      "Confirm Logout",
      "Are you sure you want to logout?",
      async () => {
        try {
          await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
          setAuthUser(null);
          showSnackbar("Logged out successfully", "success");
        } catch (err) {
          console.error("Logout failed", err);
          showSnackbar("Error during logout", "error");
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white font-bold animate-pulse">Authenticating...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login setAuthUser={setAuthUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <nav className="bg-gray-800/50 shadow-lg shadow-gray-700 backdrop-blur-md border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <div className="flex bg-gray-900/80 p-1 rounded-xl border border-gray-700">
            <Link
              to="/"
              className={`px-6 py-2 rounded-lg font-medium transition-all ${location.pathname === '/' || location.pathname.startsWith('/assets')
                ? 'bg-white text-blue-600 shadow-lg'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              Assets
            </Link>
            <Link
              to="/users"
              className={`px-6 py-2 rounded-lg font-medium transition-all ${location.pathname === '/users'
                ? 'bg-white text-blue-600 shadow-lg'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              User Management
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-300 hidden sm:block">
            Welcome, <span className="font-bold text-white">{authUser.name}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-gray-300 font-medium bg-gray-700/50 hover:bg-red-600 hover:text-white px-5 py-2 rounded-lg transition-all border border-gray-600 hover:border-red-500"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<AssetsLanding />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/assets/:typeName" element={<AssetDetails />} />
          <Route path="/assets/history/:assetId" element={<AssetHistory />} />
          <Route path="/assets/deep-view/:assetId/:empId" element={<AssetDeepView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;