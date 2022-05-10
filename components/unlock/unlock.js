import React, { Component, useState } from "react";
import { withStyles } from "@mui/styles";
import { Typography, Button, CircularProgress } from "@mui/material";
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { ACTIONS } from '../../stores/constants';
import classes from './unlockModal.module.css';
import stores from "../../stores";
import { useAppThemeContext } from '../../ui/AppThemeProvider';

const {
  ERROR,
  CONNECTION_DISCONNECTED,
  CONNECTION_CONNECTED,
  CONFIGURE_SS,
} = ACTIONS;

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
  const [activatingNetwork, setActivatingNetwork] = React.useState('');

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

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: windowWidth > 530 ? "space-between" : "center",
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
              TouchRippleProps={{classes: classes.rippleClasses}}
              style={{
                width: windowWidth > 530 ? "400px" : "calc(100vw - 100px)",
                borderRadius: 0,
              }}
              className={[classes.networkButton, classes[`networkButton--${appTheme}`]].join(' ')}
              onClick={() => {
                setActivatingNetwork(name);
                onConnectionClicked(
                  currentConnector,
                  name,
                  setActivatingConnector,
                  activate,
                );
              }}
              disableElevation
              disabled={disabled}>
              <div className={[classes.networkButtonCornerLT, classes[`networkButtonCornerLT--${appTheme}`]].join(' ')}>
              </div>

              <div className={[classes.networkButtonCornerLB, classes[`networkButtonCornerLB--${appTheme}`]].join(' ')}>
              </div>

              <div className={[classes.networkButtonCornerRT, classes[`networkButtonCornerRT--${appTheme}`]].join(' ')}>
              </div>

              <div className={[classes.networkButtonCornerRB, classes[`networkButtonCornerRB--${appTheme}`]].join(' ')}>
              </div>

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
                    {activatingNetwork === name && (
                      <>
                        <svg
                          className={classes.rotating}
                          style={{
                            marginRight: 20,
                          }}
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M12 2C12.2652 2 12.5196 2.10536 12.7071 2.29289C12.8946 2.48043 13 2.73478 13 3V6C13 6.26522 12.8946 6.51957 12.7071 6.70711C12.5196 6.89464 12.2652 7 12 7C11.7348 7 11.4804 6.89464 11.2929 6.70711C11.1054 6.51957 11 6.26522 11 6V3C11 2.73478 11.1054 2.48043 11.2929 2.29289C11.4804 2.10536 11.7348 2 12 2ZM12 17C12.2652 17 12.5196 17.1054 12.7071 17.2929C12.8946 17.4804 13 17.7348 13 18V21C13 21.2652 12.8946 21.5196 12.7071 21.7071C12.5196 21.8946 12.2652 22 12 22C11.7348 22 11.4804 21.8946 11.2929 21.7071C11.1054 21.5196 11 21.2652 11 21V18C11 17.7348 11.1054 17.4804 11.2929 17.2929C11.4804 17.1054 11.7348 17 12 17ZM22 12C22 12.2652 21.8946 12.5196 21.7071 12.7071C21.5196 12.8946 21.2652 13 21 13H18C17.7348 13 17.4804 12.8946 17.2929 12.7071C17.1054 12.5196 17 12.2652 17 12C17 11.7348 17.1054 11.4804 17.2929 11.2929C17.4804 11.1054 17.7348 11 18 11H21C21.2652 11 21.5196 11.1054 21.7071 11.2929C21.8946 11.4804 22 11.7348 22 12ZM7 12C7 12.2652 6.89464 12.5196 6.70711 12.7071C6.51957 12.8946 6.26522 13 6 13H3C2.73478 13 2.48043 12.8946 2.29289 12.7071C2.10536 12.5196 2 12.2652 2 12C2 11.7348 2.10536 11.4804 2.29289 11.2929C2.48043 11.1054 2.73478 11 3 11H6C6.26522 11 6.51957 11.1054 6.70711 11.2929C6.89464 11.4804 7 11.7348 7 12ZM19.071 19.071C18.8835 19.2585 18.6292 19.3638 18.364 19.3638C18.0988 19.3638 17.8445 19.2585 17.657 19.071L15.536 16.95C15.3538 16.7614 15.253 16.5088 15.2553 16.2466C15.2576 15.9844 15.3628 15.7336 15.5482 15.5482C15.7336 15.3628 15.9844 15.2576 16.2466 15.2553C16.5088 15.253 16.7614 15.3538 16.95 15.536L19.071 17.656C19.164 17.7489 19.2377 17.8592 19.2881 17.9806C19.3384 18.102 19.3643 18.2321 19.3643 18.3635C19.3643 18.4949 19.3384 18.625 19.2881 18.7464C19.2377 18.8678 19.164 18.9781 19.071 19.071ZM8.464 8.464C8.27647 8.65147 8.02216 8.75679 7.757 8.75679C7.49184 8.75679 7.23753 8.65147 7.05 8.464L4.93 6.344C4.74236 6.15649 4.63689 5.90212 4.6368 5.63685C4.6367 5.37158 4.74199 5.11714 4.9295 4.9295C5.11701 4.74186 5.37138 4.63639 5.63665 4.6363C5.90192 4.6362 6.15636 4.74149 6.344 4.929L8.464 7.05C8.65147 7.23753 8.75679 7.49184 8.75679 7.757C8.75679 8.02216 8.65147 8.27647 8.464 8.464ZM4.93 19.071C4.74253 18.8835 4.63721 18.6292 4.63721 18.364C4.63721 18.0988 4.74253 17.8445 4.93 17.657L7.051 15.536C7.14325 15.4405 7.25359 15.3643 7.3756 15.3119C7.4976 15.2595 7.62882 15.2319 7.7616 15.2307C7.89438 15.2296 8.02606 15.2549 8.14895 15.3052C8.27185 15.3555 8.3835 15.4297 8.4774 15.5236C8.57129 15.6175 8.64554 15.7291 8.69582 15.852C8.7461 15.9749 8.7714 16.1066 8.77025 16.2394C8.7691 16.3722 8.74151 16.5034 8.6891 16.6254C8.63669 16.7474 8.56051 16.8578 8.465 16.95L6.345 19.071C6.25213 19.164 6.14184 19.2377 6.02044 19.2881C5.89904 19.3384 5.76892 19.3643 5.6375 19.3643C5.50608 19.3643 5.37596 19.3384 5.25456 19.2881C5.13316 19.2377 5.02287 19.164 4.93 19.071ZM15.536 8.464C15.3485 8.27647 15.2432 8.02216 15.2432 7.757C15.2432 7.49184 15.3485 7.23753 15.536 7.05L17.656 4.929C17.8435 4.74136 18.0979 4.63589 18.3631 4.6358C18.6284 4.6357 18.8829 4.74099 19.0705 4.9285C19.2581 5.11601 19.3636 5.37038 19.3637 5.63565C19.3638 5.90092 19.2585 6.15536 19.071 6.343L16.95 8.464C16.7625 8.65147 16.5082 8.75679 16.243 8.75679C15.9778 8.75679 15.7235 8.65147 15.536 8.464Z"
                            fill={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
                        </svg>
                      </>
                    )}

                    <Typography
                      style={{
                        fontWeight: 500,
                        fontSize: windowWidth > 530 ? 24 : 18,
                        lineHeight: '120%',
                        textAlign: 'left',
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
                      fontSize: windowWidth > 530 ? 18 : 14,
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
                    }}>
                  </div>
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
