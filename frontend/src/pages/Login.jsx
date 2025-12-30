import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Cpu, Lock } from 'lucide-react'; // Added more icons
import { useSnackbar } from '../context/SnackbarContext';
import { theme } from '../theme';
import mylogo from '../assets/logo1.jpeg';

const Login = ({ setAuthUser }) => {
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();

  const handleLoginSuccess = async (response) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/google', {
        token: response.credential,
      }, { withCredentials: true });

      if (res.data.user) {
        showSnackbar("Successfully Logged In!", "success");
        setAuthUser(res.data.user);
      }
    } catch (err) {
      showSnackbar(err.response?.data?.error || "User not authorized in system", "error");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-orange-100 via-white to-orange-50 p-4`}>
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className={`relative max-w-md w-full bg-white/80 backdrop-blur-xl rounded-[40px] shadow-[0_20px_50px_rgba(234,88,12,0.15)] p-10 text-center border border-white/50 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(234,88,12,0.25)]`}>
        
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white p-2 rounded-2xl shadow-sm flex items-center justify-center overflow-hidden">
              <img
                src={mylogo}
                alt="Logo"
                className="h-14 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-2 mb-10">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
            Asset <span className="text-orange-600">Management</span>
          </h1>
          <div className="h-1 w-12 bg-orange-500 mx-auto rounded-full"></div>
          <p className="text-gray-500 text-sm font-semibold uppercase tracking-widest pt-2">
            Inventory Portal
          </p>
        </div>

        {/* Login Button Container */}
        <div className="bg-orange-50/50 p-8 rounded-3xl border border-orange-100/50 mb-10">
           <p className="text-gray-600 mb-6 text-sm font-medium">
             Authorized Personnel Only
           </p>
           <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => console.log('Login Failed')}
              useOneTap={false}
              shape="pill"
              theme="filled_blue"
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col items-center gap-4">
            <p className="text-[11px] text-gray-400 max-w-[250px] leading-relaxed">
                By signing in, you agree to the company's internal data security policies.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;