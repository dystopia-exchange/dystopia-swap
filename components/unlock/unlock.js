import React, { Component } from "react";
import { withStyles } from "@mui/styles";
import { Typography, Button, CircularProgress } from "@mui/material";
import { Close } from "@mui/icons-material";

import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";

import { ACTIONS } from '../../stores/constants';

const {
  ERROR,
  CONNECTION_DISCONNECTED,
  CONNECTION_CONNECTED,
  CONFIGURE_SS,
} = ACTIONS;

import stores from "../../stores";
import { useAppThemeContext } from '../../ui/AppThemeProvider';

const styles = theme => ({
  root: {
    flex: 1,
    height: "auto",
    display: "flex",
    position: "relative",
  },
  contentContainer: {
    margin: "auto",
    textAlign: "center",
    display: "flex",
    flexWrap: "wrap",
  },
  cardContainer: {
    marginTop: "60px",
    minHeight: "260px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-around",
    alignItems: "center",
  },
  unlockCard: {
    padding: "24px",
  },
  buttonText: {
    marginLeft: "12px",
    fontWeight: "700",
  },
  instruction: {
    maxWidth: "400px",
    marginBottom: "32px",
    marginTop: "32px",
  },
  actionButton: {
    padding: "12px",
    backgroundColor: "white",
    borderRadius: "3rem",
    border: "1px solid #E1E1E1",
    fontWeight: 500,
    [theme.breakpoints.up("md")]: {
      padding: "15px",
    },
  },
  connect: {
    width: "100%",
  },
  closeIcon: {
    position: "absolute",
    right: "-8px",
    top: "-8px",
    cursor: "pointer",
  },
});

class Unlock extends Component {
  constructor(props) {
    super();

    this.state = {
      loading: false,
      error: null,
    };
  }

  componentWillMount() {
    stores.emitter.on(CONNECTION_CONNECTED, this.connectionConnected);
    stores.emitter.on(CONNECTION_DISCONNECTED, this.connectionDisconnected);
    stores.emitter.on(ERROR, this.error);
  }

  componentWillUnmount() {
    stores.emitter.removeListener(
      CONNECTION_CONNECTED,
      this.connectionConnected,
    );
    stores.emitter.removeListener(
      CONNECTION_DISCONNECTED,
      this.connectionDisconnected,
    );
    stores.emitter.removeListener(ERROR, this.error);
  }

  error = err => {
    this.setState({loading: false, error: err});
  };

  connectionConnected = () => {
    stores.dispatcher.dispatch({
      type: CONFIGURE_SS,
      content: {connected: true},
    });

    if (this.props.closeModal != null) {
      this.props.closeModal();
    }
  };

  connectionDisconnected = () => {
    stores.dispatcher.dispatch({
      type: CONFIGURE_SS,
      content: {connected: false},
    });
    if (this.props.closeModal != null) {
      this.props.closeModal();
    }
  };

  render() {
    const {classes, closeModal} = this.props;

    return (
      <div className={classes.root}>
        <div className={classes.contentContainer}>
          <Web3ReactProvider getLibrary={getLibrary}>
            <MyComponent closeModal={closeModal}/>
          </Web3ReactProvider>
        </div>
      </div>
    );
  }
}

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 8000;
  return library;
}

function onConnectionClicked(
  currentConnector,
  name,
  setActivatingConnector,
  activate,
) {
  const connectorsByName = stores.accountStore.getStore("connectorsByName");
  setActivatingConnector(currentConnector);
  activate(connectorsByName[name]);
}

function onDeactivateClicked(deactivate, connector) {
  if (deactivate) {
    deactivate();
  }
  if (connector && connector.close) {
    connector.close();
  }
  stores.accountStore.setStore({account: {}, web3context: null});
  stores.emitter.emit(CONNECTION_DISCONNECTED);
}

function MyComponent(props) {
  const context = useWeb3React();
  const localContext = stores.accountStore.getStore("web3context");
  var localConnector = null;
  if (localContext) {
    localConnector = localContext.connector;
  }
  const {
    connector,
    library,
    account,
    activate,
    deactivate,
    active,
    error,
  } = context;
  var connectorsByName = stores.accountStore.getStore("connectorsByName");

  const {closeModal} = props;

  const [activatingConnector, setActivatingConnector] = React.useState();
  React.useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined);
    }
  }, [activatingConnector, connector]);

  React.useEffect(() => {
    if (account && active && library) {
      stores.accountStore.setStore({
        account: {address: account},
        web3context: context,
      });
      stores.emitter.emit(CONNECTION_CONNECTED);
      stores.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
    }
  }, [account, active, closeModal, context, library]);

  const width = window.innerWidth;
  const {appTheme} = useAppThemeContext();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: width > 576 ? "space-between" : "center",
        alignItems: "center",
      }}
    >
      {Object.keys(connectorsByName).map(name => {
        const currentConnector = connectorsByName[name];
        const activating = currentConnector === activatingConnector;
        const connected =
          currentConnector === connector || currentConnector === localConnector;
        const disabled = !!activatingConnector || !!error;

        let url;
        let display = name;
        let descriptor = "";
        if (name === "MetaMask") {
          url = "/connectors/icn-metamask.svg";
        } else if (name === "TrustWallet") {
          url = "/connectors/trustWallet.svg";
        } else if (name === "Portis") {
          url = "/connectors/portisIcon.png";
        } else if (name === "Fortmatic") {
          url = "/connectors/fortmaticIcon.png";
        } else if (name === "Ledger") {
          url = "/connectors/icn-ledger.svg";
        } else if (name === "Squarelink") {
          url = "/connectors/squarelink.png";
        } else if (name === "Trezor") {
          url = "/connectors/trezor.png";
        } else if (name === "Torus") {
          url = "/connectors/torus.jpg";
        } else if (name === "Authereum") {
          url = "/connectors/icn-aethereum.svg";
        } else if (name === "WalletLink") {
          display = "Coinbase Wallet";
          url = "/connectors/coinbaseWalletIcon.svg";
        } else if (name === "WalletConnect") {
          url = "/connectors/walletConnectIcon.svg";
          descriptor = "Scan with WalletConnect to connect";
        } else if (name === "Frame") {
          return "";
        }

        return (
          <div
            key={name}
            style={{
              padding: "0px",
              display: "flex",
              marginBottom: "10px",
            }}
          >
            <Button
              style={{
                width: width > 576 ? "400px" : "calc(100vw - 100px)",
                padding: '10px 20px',
                backgroundColor: appTheme === "dark" ? '#24292D' : '#CFE5F2',
                border: appTheme === "dark" ? '1px solid #5F7285' : '1px solid #86B9D6',
                borderRadius: 0,
                color: "rgba(108,108,123,1)",
              }}
              variant="contained"
              onClick={() => {
                onConnectionClicked(
                  currentConnector,
                  name,
                  setActivatingConnector,
                  activate,
                );
              }}
              disableElevation
              color="secondary"
              disabled={disabled}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: 'column',
                  justifyContent: "space-between",
                }}>
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}>
                    {activating && (
                      <CircularProgress size={15} style={{marginRight: "10px"}}/>
                    )}

                    <Typography
                      style={{
                        fontWeight: 500,
                        fontSize: '24px',
                        lineHeight: '120%',
                        color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                      }}>
                      {display}
                    </Typography>
                  </div>

                  <img
                    style={{
                      width: "60px",
                      height: "60px",
                    }}
                    src={url}
                    alt=""
                  />
                </div>

                {descriptor && (
                  <Typography
                    style={{
                      paddingTop: '10px',
                      borderTop: appTheme === "dark" ? '1px solid #5F7285' : '1px solid #86B9D6',
                      textAlign: 'left',
                      fontSize: '18px',
                      color: appTheme === "dark" ? '#C6CDD2' : '#325569',
                    }}
                    variant={"body2"}>
                    {descriptor}
                  </Typography>
                )}

                {!activating && connected && (
                  <div
                    style={{
                      background: "#4caf50",
                      borderRadius: "10px",
                      width: "10px",
                      height: "10px",
                      marginRight: "0px",
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                    }}
                  ></div>
                )}
              </div>
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default withStyles(styles)(Unlock);
