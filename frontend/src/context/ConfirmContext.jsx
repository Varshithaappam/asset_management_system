import React, { createContext, useState, useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ThemeProvider, createTheme } from '@mui/material';
import { theme } from '../theme';

const ConfirmContext = createContext();

const orangeMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ea580c' }, 
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '10px', fontWeight: 'semibold', textTransform: 'none' }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: '20px' }
      }
    }
  }
});

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({ open: false, title: '', message: '', onConfirm: null });

  const askConfirmation = (title, message, callback) => {
    setState({ open: true, title, message, onConfirm: callback });
  };

  const handleClose = () => setState({ ...state, open: false });

  const handleConfirm = async () => {
    if (state.onConfirm) {
      await state.onConfirm();
    }
    handleClose();
  };

  return (
    <ConfirmContext.Provider value={askConfirmation}>
      <ThemeProvider theme={orangeMuiTheme}>
        {children}
        <Dialog open={state.open} onClose={handleClose}>
          <DialogTitle sx={{ fontWeight: '900', color: '#111827', pt: 2 }}>
            {state.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: '#4b5563', fontWeight: '500' }}>
              {state.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleClose} sx={{ color: '#6b7280' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              variant="contained" 
              sx={{ bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' } }} 
              autoFocus
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);