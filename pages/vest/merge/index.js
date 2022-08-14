import React, { useState, useEffect, useCallback } from "react";
import {
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
} from "@mui/material";
import { ArrowBackIosNew, Close, Search } from "@mui/icons-material";
import classes from "./vest.module.css";
import { useRouter } from "next/router";
import Form from "../../../ui/MigratorForm";
import stores from "../../../stores";
import { ACTIONS } from "../../../stores/constants";
import moment from "moment";

const renderAssetOption = (item, callbackClick) => {
  return (
    <div className={classes.selectItem} key={item.id} onClick={() => callbackClick(item)}>
      <div className={classes.selectItemCol}>
        <div className={classes.selectItemTitle}>NFT #{item.id}</div>
        <div className={classes.selectItemValue}>{Number(item.lockAmount).toFixed(2)} CONE</div>
      </div>
      <div className={classes.selectItemCol}>
        <div className={classes.selectItemTitle}>{moment.unix(item.lockEnds).format("YYYY-MM-DD")}</div>
        <div className={classes.selectItemValue}>Expiry date</div>
      </div>
    </div>
  );
};

const renderOptions = (data, callbackClick) => {
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
          {data.map(asset => {
            return renderAssetOption(asset, callbackClick);
          })}
        </div>
      </div>
    </>
  );
};

const merge = () => {
  const router = useRouter();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [vestNFTs, setVestNFTs] = useState();

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  useEffect(() => {
    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
    });

    const vestNFTsReturned = (nfts) => {
      setVestNFTs(nfts);
      forceUpdate();
    };

    window.setTimeout(() => {
      stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_NFTS, content: {} });
    }, 1);

    stores.emitter.on(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned);
    return () => {
      stores.emitter.removeListener(
        ACTIONS.VEST_NFTS_RETURNED,
        vestNFTsReturned
      );
    };
  }, []);

  const onBack = () => {
    router.push("/vest");
  };

  // const [openSelectToken1, setOpenSelectToken1] = useState(false);
  // const [openSelectToken2, setOpenSelectToken2] = useState(false);
  const [firstSelectedNft, setFirstSelectedNft] = useState();
  const [secondSelectedNft, setSecondSelectedNft] = useState();
  const [lockloader, setLockLoading] = useState(false);

  console.log('firstSelectedNft', firstSelectedNft)
  console.log('secondSelectedNft', secondSelectedNft)

  // const openSelect1 = () => {
  //   setOpenSelectToken1(!openSelectToken1);
  // };
  // const openSelect2 = () => {
  //   setOpenSelectToken2(!openSelectToken2);
  // };

  // const closeSelect1 = () => {
  //   setOpenSelectToken1(false);
  // };
  // const closeSelect2 = () => {
  //   setOpenSelectToken2(false);
  // };

  const handleChange1 = (value) => {
    setFirstSelectedNft(value);
  };

  const handleChange2 = (value) => {
    setSecondSelectedNft(value);
  };

  const merge = async (firstSelectedNft, secondSelectedNft) => {
    setLockLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.MERGE_NFT,
      content: { tokenIDOne: firstSelectedNft, tokenIDTwo: secondSelectedNft },
    });
    setLockLoading(false);
  };

  const renderNftSelect1 = () => {
    const [open, setOpen] = useState(false);

    const closeModal = () => setOpen(false);

    const openModal = () => setOpen(true);

    return (
      <div>
        <span className={classes.selectTitle}>1st NFT</span>
        <div
          onClick={openModal}
          className={classes.tokenSelect}
        >
          {firstSelectedNft == undefined ? (
            <div className={classes.tokenSelectLabel}>Select 1st NFT</div>
          ) : (
            <div className={classes.tokenSelectInfo}>
              <div className={classes.tokenSelectInfoCol}>
                <div className={classes.tokenSelectInfoTitle}>NFT #{firstSelectedNft.id}</div>
                <div className={classes.tokenSelectInfoValue}>
                  {Number(firstSelectedNft.lockAmount)} CONE
                </div>
              </div>
              <div className={classes.tokenSelectInfoCol}>
                <div className={classes.tokenSelectInfoTitle}>
                  {moment.unix(firstSelectedNft.lockEnds).format("YYYY-MM-DD")}
                </div>
                <div className={classes.tokenSelectInfoValue}>Expiry date</div>
              </div>
            </div>
          )}
        </div>

        <Dialog
          open={open}
          width={782}
          classes={{
            paperScrollPaper: classes.paperScrollPaper,
            paper: classes.paper
          }}
          onClick={(e) => {
            if (e.target.classList.contains('MuiDialog-container')) {
              closeModal();
            }
          }}
        >
          <div className={[classes.dialogContainer, 'g-flex-column'].join(' ')}>
            <DialogTitle className={[classes.dialogTitle, 'g-flex-column__item-fixed'].join(' ')}>
              <div className={classes.dialogTitleRow}>
                <div className={classes.dialogTitleLeft}>Select an NFT</div>
                <div className={classes.dialogTitleRight}>
                  <Close
                    style={{
                      fontSize: 12,
                      color: '#1e2c48',
                      cursor: 'pointer',
                    }}
                    onClick={closeModal}
                  />
                </div>
              </div>
            </DialogTitle>
            <DialogContent
              style={{overflow: 'hidden'}}
              className={[classes.dialogContent, 'g-flex-column__item', 'g-flex-column'].join(' ')}
            >
              {vestNFTs && renderOptions(vestNFTs, value => {
                handleChange1(value)
                closeModal();
              })}
            </DialogContent>
          </div>
        </Dialog>
      </div>
    );
  };
  const renderNftSelect2 = () => {
    const [open, setOpen] = useState(false);

    const closeModal = () => setOpen(false);

    const openModal = () => setOpen(true);

    return (
      <div>
        <span className={classes.selectTitle}>2nd NFT</span>
        <div
          onClick={openModal}
          className={classes.tokenSelect}
        >
          {secondSelectedNft == undefined ? (
            <div className={classes.tokenSelectLabel}>Select 2nd NFT</div>
          ) : (
            <div className={classes.tokenSelectInfo}>
              <div className={classes.tokenSelectInfoCol}>
                <div className={classes.tokenSelectInfoTitle}>NFT #{secondSelectedNft.id}</div>
                <div className={classes.tokenSelectInfoValue}>
                  {Number(secondSelectedNft.lockAmount)} CONE
                </div>
              </div>
              <div className={classes.tokenSelectInfoCol}>
                <div className={classes.tokenSelectInfoTitle}>
                  {moment.unix(secondSelectedNft.lockEnds).format("YYYY-MM-DD")}
                </div>
                <div className={classes.tokenSelectInfoValue}>Expiry date</div>
              </div>
            </div>
          )}
        </div>

        <Dialog
          open={open}
          width={782}
          classes={{
            paperScrollPaper: classes.paperScrollPaper,
            paper: classes.paper
          }}
          onClick={(e) => {
            if (e.target.classList.contains('MuiDialog-container')) {
              closeModal();
            }
          }}
        >
          <div className={[classes.dialogContainer, 'g-flex-column'].join(' ')}>
            <DialogTitle className={[classes.dialogTitle, 'g-flex-column__item-fixed'].join(' ')}>
              <div className={classes.dialogTitleRow}>
                <div className={classes.dialogTitleLeft}>Select an NFT</div>
                <div className={classes.dialogTitleRight}>
                  <Close
                    style={{
                      fontSize: 12,
                      color: '#1e2c48',
                      cursor: 'pointer',
                    }}
                    onClick={closeModal}
                  />
                </div>
              </div>
            </DialogTitle>
            <DialogContent
              style={{overflow: 'hidden'}}
              className={[classes.dialogContent, 'g-flex-column__item', 'g-flex-column'].join(' ')}
            >
              {vestNFTs && renderOptions(vestNFTs, value => {
                handleChange2(value);
                closeModal();
              })}
            </DialogContent>
          </div>
        </Dialog>
      </div>
    );
  };

  return (
    <Paper elevation={0} className={classes.container3}>
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
        <Form>
          <div className={classes.dropdownCtn}>
            <div className={classes.dropdown}>{renderNftSelect1()}</div>

            <div className={classes.divider}>
              <div className={classes.dividerInner}>
                <span></span>
              </div>
            </div>

            <div className={classes.dropdown}>{renderNftSelect2()}</div>
          </div>

          <div className={classes.info}>
            <Typography className={classes.infoInner} color="textSecondary">
              <img src="/images/ui/info-circle-blue.svg" />
              <span>New NFT will have the the longest expiry date out of 2 NFTs exposed to the merge.</span>
            </Typography>
          </div>

          <div className={classes.inputRow}>
            <div className={classes.inputCol}>
              <p className={[classes.pageTitle, classes.pageTitle2].join(" ")}>
                <span>New NFT:</span>
              </p>
              <p className={classes.subtitle}>Automatically calculated</p>
            </div>

            <div className={classes.inputCol}>
              {firstSelectedNft !== undefined && secondSelectedNft !== undefined ? (
                <>
                  {firstSelectedNft.lockEnds > secondSelectedNft.lockEnds ? (
                    <div className={classes.dropdownSimple}>
                      <span className={classes.selectTitle}>Result NFT</span>
                      <div className={classes.selectItem}>
                        <div className={classes.selectItemCol}>
                          <div className={classes.selectItemTitle}>NFT #{secondSelectedNft.id}</div>
                          <div className={classes.selectItemValue}>
                            {(Number(firstSelectedNft.lockAmount) + Number(secondSelectedNft.lockAmount)).toFixed(2)} CONE
                          </div>
                        </div>
                        <div className={classes.selectItemCol}>
                          <div className={classes.selectItemTitle}>
                            {moment.unix(firstSelectedNft.lockEnds).format("YYYY-MM-DD")}
                          </div>
                          <div className={classes.selectItemValue}>Expiry date</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={classes.dropdownSimple}>
                      <span className={classes.selectTitle}>Result NFT</span>
                      <div className={classes.selectItem}>
                        <div className={classes.selectItemCol}>
                          <div className={classes.selectItemTitle}>NFT #{secondSelectedNft.id}</div>
                          <div className={classes.selectItemValue}>
                            {(Number(firstSelectedNft.lockAmount) + Number(secondSelectedNft.lockAmount)).toFixed(2)} CONE
                          </div>
                        </div>
                        <div className={classes.selectItemCol}>
                          <div className={classes.selectItemTitle}>
                            {moment.unix(secondSelectedNft.lockEnds).format("YYYY-MM-DD")}
                          </div>
                          <div className={classes.selectItemValue}>Expiry date</div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={classes.dropdownSimple}>
                  <span className={classes.selectTitle}>Result NFT</span>
                  <div className={classes.tokenSelect}>
                    <div className={classes.tokenSelectLabel}>Result NFT after Merge</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Form>
      </div>

      <div>
        {firstSelectedNft === undefined ||
        secondSelectedNft === undefined ||
        secondSelectedNft.id == firstSelectedNft.id ? (
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="primary"
            className={[classes.buttonOverride, classes.buttonOverrideDisabled].join(" ")}
            disabled
          >
            <Typography className={classes.actionButtonText}>
              Select NFTs to merge
            </Typography>
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="primary"
            className={classes.buttonOverride}
            onClick={() => merge(firstSelectedNft, secondSelectedNft)}
          >
            <Typography className={classes.actionButtonText}>
              Merge NFTs
            </Typography>
          </Button>
        )}
      </div>
    </Paper>
  );
};

export default merge;
