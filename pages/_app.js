import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Head from "next/head";
import Layout from "../components/layout/layout.js";
import CssBaseline from "@mui/material/CssBaseline";
import { useRouter } from "next/router";

import { AppThemeProvider, useAppTheme } from "../ui/AppThemeProvider";

import Configure from "./configure";

import stores from "../stores/index.js";

import { ACTIONS } from "../stores/constants";
import "../styles/global.css";
import "../styles/variables.css";
import { createTheme, ThemeProvider } from '@mui/material/styles';

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const { appTheme, setAppTheme } = useAppTheme();

  const [stalbeSwapConfigured, setStableSwapConfigured] = useState(false);
  const [accountConfigured, setAccountConfigured] = useState(false);

  useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  const changeTheme = (dark) => {
    setAppTheme(dark ? 'dark' : 'light')

    localStorage.setItem('dystopia.finance-dark-mode', dark ? 'dark' : 'light');
  };

  const accountConfigureReturned = () => {
    setAccountConfigured(true);
  };

  const stalbeSwapConfigureReturned = () => {
    setStableSwapConfigured(true);
  };

  useEffect(function () {
    const localStorageDarkMode = window.localStorage.getItem(
      "dystopia.finance-dark-mode"
    );
    changeTheme(localStorageDarkMode ? localStorageDarkMode === "dark" : false);
  }, []);

  useEffect(function () {
    stores.emitter.on(ACTIONS.CONFIGURED_SS, stalbeSwapConfigureReturned);
    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountConfigureReturned);

    stores.dispatcher.dispatch({ type: ACTIONS.CONFIGURE });

    return () => {
      stores.emitter.removeListener(
        ACTIONS.CONFIGURED_SS,
        stalbeSwapConfigureReturned
      );
      stores.emitter.removeListener(
        ACTIONS.ACCOUNT_CONFIGURED,
        accountConfigureReturned
      );
    };
  }, []);

  const validateConfigured = () => {
    switch (router.pathname) {
      case "/":
        return accountConfigured;
      default:
        return accountConfigured;
    }
  };

  const theme = createTheme({
    typography: {
      allVariants: {
        fontFamily: '"Roboto Mono", serif',
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <React.Fragment>
        <Head>
          <title>Dystopia</title>
          <meta
            name="viewport"
            content="minimum-scale=1, initial-scale=1, width=device-width"
          />
        </Head>
        <AppThemeProvider value={{appTheme, setAppTheme}}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline/>
          {validateConfigured() && (
            <Layout>
              <Component {...pageProps} changeTheme={changeTheme}/>
            </Layout>
          )}
          {!validateConfigured() && <Configure {...pageProps} />}
        </AppThemeProvider>
      </React.Fragment>
    </ThemeProvider>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
};
