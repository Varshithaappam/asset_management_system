import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SnackbarProvider } from './context/SnackbarContext';
import { ConfirmProvider } from './context/ConfirmContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="821960464116-ne6ja3a55s5ljod3dhsu2nft190v26vt.apps.googleusercontent.com">
      <BrowserRouter>
        <SnackbarProvider>
        <ConfirmProvider> 
          <App />
        </ConfirmProvider>
      </SnackbarProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);