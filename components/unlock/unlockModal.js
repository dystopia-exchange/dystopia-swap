import React, { useState } from "react";
import { DialogContent, DialogTitle, Dialog, Slide } from "@mui/material";
import Unlock from "./unlock.js";
import { Close } from '@mui/icons-material';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

export default function UnlockModal(props) {
  const {closeModal, modalOpen} = props;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  return (
    <Dialog
      open={modalOpen}
      onClose={closeModal}
      fullWidth={false}
      maxWidth="false"
      TransitionComponent={Transition}
      style={{borderRadius: 0}}
      onClick={(e) => {
        if (e.target.classList.contains('MuiDialog-container')) {
          closeModal()
        }
      }}
    >
      <div style={{
        width: windowWidth > 530 ? 460 : '100%',
        background: appTheme === "dark" ? '#151718' : '#DBE6EC',
        border: appTheme === "dark" ? '1px solid #5F7285' : '1px solid #86B9D6',
        borderRadius: 0,
      }}>
        <DialogTitle style={{
          padding: windowWidth > 530 ? 30 : 15,
          paddingBottom: 0,
          fontWeight: 500,
          fontSize: 18,
          lineHeight: '140%',
          color: '#0A2C40',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              color: appTheme === "dark" ? '#ffffff' : '#0A2C40'
            }}>
              Connect wallet
            </div>

            <Close
              style={{
                cursor: 'pointer',
                color: appTheme === "dark" ? '#ffffff' : '#0A2C40'
              }}
              onClick={closeModal}/>
          </div>
        </DialogTitle>

        <DialogContent style={{
          padding: windowWidth > 530 ? 30 : 15,
          paddingBottom: windowWidth > 530 ? 20 : 10,
        }}>
          <Unlock closeModal={closeModal}/>
        </DialogContent>
      </div>
    </Dialog>
  );
}
