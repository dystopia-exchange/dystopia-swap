import Head from "next/head";
import classes from "./layout.module.css";
import Header from "../header";
import SnackbarController from "../snackbar";
import { useAppThemeContext } from '../../ui/AppThemeProvider';


export default function Layout({
  children,
  configure,
  backClicked,
  changeTheme,
  title
}) {
  const { appTheme } = useAppThemeContext();

  const isHomePage = window.location.pathname === '/home'

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
        <meta name="description" content="Cone allows low cost, near 0 slippage trades on uncorrelated or tightly correlated assets built on Fantom." />
        <meta name="og:title" content="Cone" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div
        className={[
          classes.content,
          classes[`content--${appTheme}`],
          isHomePage ? classes[`homePage--${appTheme}`] : '',
          'g-flex-column'
        ].join(' ')}
      >
        {!configure && (
          <Header backClicked={backClicked} changeTheme={changeTheme} title={ title } />
        )}
        <SnackbarController />
        <main className={[classes.main, 'g-flex-column__item', 'g-flex-column', 'g-scroll-y'].join(' ')}>
          <div className={[classes.containerInner, 'g-flex-column'].join(' ')}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
