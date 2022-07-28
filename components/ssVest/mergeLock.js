import React from "react";
import { useRouter } from "next/router";
import { Paper, Typography, IconButton, Tooltip, Button } from "@mui/material";
import classes from "./ssVest.module.css";
import classesMerge from "./mergeLock.module.css";
import { ArrowBackIosNew } from "@mui/icons-material";
import { NFTSelect } from "../../ui/NFTSelect";

export function MergeLock() {
  const router = useRouter();

  const onBack = () => {
    router.push("/vest");
  };

  function NFTItem() {
    return (
      <div className={classesMerge.inputRow}>
        <div className={[classesMerge.inputCol, classesMerge.inputMergeCol].join(" ")}>
          <div className={classesMerge.inputWrapper}>
            <Typography className={classesMerge.inputTitleText} noWrap>
              1st NFT
            </Typography>

            <NFTSelect text="Select 1st NFT" />
          </div>
        </div>

        <div className={classesMerge.divider}>
          <div className={classesMerge.dividerInner}>
            <span></span>
          </div>
        </div>

        <div className={[classesMerge.inputCol, classesMerge.inputMergeCol].join(" ")}>
          <div className={classesMerge.inputWrapper}>
            <Typography className={classesMerge.inputTitleText} noWrap>
              2nd NFT
            </Typography>

            <NFTSelect text="Select 2nd NFT" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Paper
      elevation={0}
      className={[classes.container3, classes["g-flex-column"]].join(" ")}
    >
      <p className={classes.pageTitle}>
        <div className={classes.titleSection}>
          <Tooltip title="Back to Vest" placement="top">
            <IconButton onClick={onBack}>
              <div className={classes.backIconWrap}>
                <ArrowBackIosNew className={classes.backIcon} />
              </div>
            </IconButton>
          </Tooltip>
          <p>Back to Vest</p>
        </div>

        <span>Merge NFTs</span>
      </p>

      <div className={classes.reAddPadding3}>
        <NFTItem />
      </div>

      <div className={classes.info}>
        <Typography className={classes.infoInner} color="textSecondary">
          <img src="/images/ui/info-circle-blue.svg" />
          <span>New NFT will have the the longest expiry date out of 2 NFTs exposed to the merge.</span>
        </Typography>
      </div>

      <div className={classes.reAddPadding3}>
        <div className={classesMerge.inputRow}>
          <div className={classesMerge.inputCol}>
            <p className={[classes.pageTitle, classesMerge.pageTitle2].join(" ")}>
              <span>New NFT:</span>
            </p>
            <p className={classesMerge.subtitle}>Automatically calculated</p>
          </div>

          <div className={classesMerge.inputCol}>
            <div className={classesMerge.inputWrapper}>
              <Typography className={classesMerge.inputTitleText} noWrap>
                Result NFT
              </Typography>

              <NFTSelect text="Result NFT after Merge" />
            </div>
          </div>
        </div>
      </div>

      <Button
        className={classes.buttonOverride}
        fullWidth
        variant="contained"
        size="large"
        color="primary"
      >
        <Typography className={classes.actionButtonText}>Merge</Typography>
      </Button>

      <Button
        className={[
          classes.buttonOverride,
          classes.buttonOverrideDisabled,
        ].join(" ")}
        fullWidth
        variant="contained"
        size="large"
        color="primary"
        disabled={true}
      >
        <Typography className={classes.actionButtonText}>
          Select NFTs to merge
        </Typography>
      </Button>
    </Paper>
  );
}
