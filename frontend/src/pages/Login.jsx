import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useSnackbar } from '../context/SnackbarContext';
const Login = ({ setAuthUser }) => {
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();

  const handleLoginSuccess = async (response) => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/google', {
      token: response.credential,
    }, { withCredentials: true });

    if (res.data.user) {
      showSnackbar("Successfully Authenticated!", "success");
      setAuthUser(res.data.user);
      // window.location.href = "/"; 
    }
  } catch (err) {
    showSnackbar(err.response?.data?.error || "User not authorized in system", "error");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full hover:bg-gray-700 bg-gray-600 rounded-2xl shadow-2xl shadow-black p-8 text-center border border-gray-600">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-black/100 rounded-full text-blue-600">
            <ShieldCheck size={50} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Asset Management</h1>
        <p className="text-white mb-8 text-sm">
          Please sign in with your Google account.
        </p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => console.log('Login Failed')}
            useOneTap={false} 
            itp_support={true}
          />
        </div>

        <p className="mt-8 text-xs text-white">
          Only authorized administrators can access this system.
        </p>
      </div>
    </div>
  );
};

export default Login;