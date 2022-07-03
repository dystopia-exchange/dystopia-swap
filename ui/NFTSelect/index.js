import React, { useState } from "react";
import classes from "./NFTSelect.module.css";
import { Dialog, DialogContent, DialogTitle, TextField, InputAdornment } from "@mui/material";
import { Close, Search } from "@mui/icons-material";

export const NFTSelect = ({ text }) => {
  const [open, setOpen] = useState(false);

  const openSearch = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const renderAssetOption = (idx) => {
    return (
      <div className={classes.selectItem} key={idx}>
        <div className={classes.selectItemCol}>
          <div className={classes.selectItemTitle}>NFT #1231</div>
          <div className={classes.selectItemValue}>50 000 000 veTET</div>
        </div>
        <div className={classes.selectItemCol}>
          <div className={classes.selectItemTitle}>2022-06-19</div>
          <div className={classes.selectItemValue}>Expiry date</div>
        </div>
      </div>
    );
  };

  const renderOptions = () => {
    return (
      <>
        <div className={classes.searchInline}>
          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Search by name or paste address"
            InputProps={{
              classes: {
                root: classes.searchInput,
                inputAdornedStart: classes.searchInputText,
              },
              endAdornment: <InputAdornment position="end">
                <Search style={{ color: '#779BF4' }} />
              </InputAdornment>,
            }}
          />
        </div>

        <div className={[classes.dialogOptions, "g-flex-column__item"].join(" ")}>
          <div className={classes.items}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((asset, idx) => {
              return renderAssetOption(idx);
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <React.Fragment>
      <div
        className={classes.selectContainer}
        onClick={() => {
          openSearch();
        }}
      >
        <div className={classes.selectContainerRow}>
          <div className={classes.selectContainerCol}>
            <div className={classes.selectContainerTitle}>#1234</div>
            <div className={classes.selectContainerValue}>50 000 000 veTET</div>
          </div>
          <div className={classes.selectContainerCol}>
            <div className={classes.selectContainerTitle} style={{ fontSize: 16 }}>2022-06-19</div>
            <div className={classes.selectContainerValue}>Expiry date</div>
          </div>
        </div>
        {/* {text} */}
      </div>

      <Dialog
        classes={{ paperScrollPaper: classes.paperScrollPaper, paper: classes.paper }}
        aria-labelledby="simple-dialog-title"
        open={open}
        onClick={(e) => {
          if (e.target.classList.contains("MuiDialog-container")) {
            onClose();
          }
        }}
      >
        <div className={classes.dialogContainer}>
          <DialogTitle className={classes.dialogTitle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className={classes.dialogTitleText}>Select an NFT</div>

              <div className={classes.dialogClose}>
                <Close
                  style={{
                    fontSize: 12,
                    color: "#1e2c48",
                    cursor: "pointer",
                  }}
                  onClick={onClose}
                />
              </div>
            </div>
          </DialogTitle>

          <DialogContent
            style={{overflow: 'hidden'}}
            className={[classes.dialogContent, 'g-flex-column__item', 'g-flex-column'].join(' ')}
          >
            {renderOptions()}
          </DialogContent>
        </div>
      </Dialog>
    </React.Fragment>
  );
};
