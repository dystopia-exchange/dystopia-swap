import React, { Component, useState } from "react";
import { DialogContent, DialogTitle, Dialog, Slide } from "@mui/material";
import Unlock from "./unlock.js";
import { Close } from '@mui/icons-material';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import classes from './unlockModal.module.css';

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
      classes={{
        paper: classes.unlockModal
      }}
    >
      <div style={{
        width: windowWidth > 1122 ? 1052 : '100%',
        // background: appTheme === "dark" ? '#151718' : '#DBE6EC',
        // background: "#1F2B49",
        // border: appTheme === "dark" ? '1px solid #5F7285' : '1px solid #86B9D6',
        // borderRadius: 12,
      }}>
        <DialogTitle
          style={{
            // padding: windowWidth > 530 ? 40 : 15,
            padding: 40,
            paddingBottom: 0,
            fontWeight: 500,
            fontSize: 60,
            lineHeight: '72px',
            color: '#fff',
          }}
        >
          <div style={{
            display: 'flex',
            // alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              // color: appTheme === "dark" ? '#ffffff' : '#0A2C40'
              color: "#fff"
            }}>
              Select your wallet provider
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: 20,
                height: 20,
                backgroundColor: '#8191B9',
                borderRadius: 5,
              }}
            >
              <Close
                style={{
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#1e2c48',
                  // color: appTheme === "dark" ? '#ffffff' : '#0A2C40'
                }}
                onClick={closeModal}
              />
            </div>
          </div>
        </DialogTitle>

        <DialogContent style={{
          // padding: windowWidth > 530 ? 30 : 15,
          padding: 40,
          paddingBottom: 12,
          // paddingBottom: windowWidth > 530 ? 20 : 10,
        }}>
          <Unlock closeModal={closeModal}/>
        </DialogContent>
      </div>
    </Dialog>
  );
}
