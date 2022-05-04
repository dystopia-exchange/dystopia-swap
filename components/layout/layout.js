import Head from "next/head";
import classes from "./layout.module.css";
import Header from "../header";
import SnackbarController from "../snackbar";
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import { useState } from "react";

export default function Layout({
  children,
  configure,
  backClicked,
  changeTheme,
  title
}) {
  const { appTheme } = useAppThemeContext();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <link
          rel="preload"
          href="/fonts/Inter/Inter-Regular.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Inter/Inter-Bold.ttf"
          as="font"
          crossOrigin=""
        />
        <meta name="description" content="Dystopia allows low cost, near 0 slippage trades on uncorrelated or tightly correlated assets built on Fantom." />
        <meta name="og:title" content="Dystopia" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      {windowWidth > 600 ? (
        <div className={[classes.content, classes[`content--${appTheme}`], 'g-flex-column'].join(' ')}>
          {!configure && (
            <Header backClicked={backClicked} changeTheme={changeTheme} title={title} />
          )}
          <SnackbarController />
          <main className={[classes.main, 'g-flex-column__item', 'g-flex-column', 'g-scroll-y'].join(' ')}>
            {children}
          </main>
        </div>
      ) : (
        <div className={[classes.content, classes[`content--mobile`], 'g-flex-column'].join(' ')}>
          {!configure && (
            <Header backClicked={backClicked} changeTheme={changeTheme} title={title} />
          )}
          <SnackbarController />
          <main className={[classes.main, 'g-flex-column__item', 'g-flex-column', 'g-scroll-y'].join(' ')}>
            {children}
          </main>
        </div>
      )}
    </>
  );
}
