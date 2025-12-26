import React, { createContext, useState, useContext } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const ConfirmContext = createContext();

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
      {children}
      <Dialog open={state.open} onClose={handleClose}>
        <DialogTitle className="font-bold">{state.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{state.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);