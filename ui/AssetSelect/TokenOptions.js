import React, { useState } from "react";
import classes from "./AssetSelect.module.css";
import { AddToken } from "./AddToken";
import { CopyAddress } from "./CopyAddress";
import { Popover } from "@mui/material";

export const TokenOptions = (props) => {
  const { value, anchorEl, handleClosePopover, handleOpenPopover } = props;

  const visible = Boolean(anchorEl);

  return (
    <>
      <div
        className={classes.dotsSelectMenu}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleOpenPopover(e);
        }}
      >
        <div />
      </div>
      <Popover
        open={visible}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        classes={{
          paper: classes.tokenPopover_root,
        }}
      >
        <div className={classes.tokenPopover}>
          <CopyAddress value={value} onClose={handleClosePopover} />
          <AddToken value={value} onClose={handleClosePopover} />
        </div>
      </Popover>
    </>
  );
};
