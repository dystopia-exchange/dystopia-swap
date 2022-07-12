/* eslint-disable react/jsx-filename-extension */
import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheets } from "@mui/styles";


export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="stylesheet" href="/fonts/Inter/Inter.css"/>
          <link rel="stylesheet" href="/fonts/MonumentExt/Monument.css"/>
          <link rel="stylesheet" href="/fonts/Druk/Druk.css"/>
          <link rel="stylesheet" href="/fonts/PPNeueMachina/PPNeueMachina.css"/>
          <link rel="stylesheet" href="/fonts/RobotoMono/RobotoMono.css"/>
          <link rel="stylesheet" href="/fonts/Poppins/Poppins.css"/>
        </Head>
        <body
          style={{
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            // zoom: '0.8',
          }}>

        <Main style={{display: 'flex', flexDirection: 'column'}}/>

        <NextScript/>
        </body>
      </Html>
    );
  }
}

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with server-side generation (SSG).
MyDocument.getInitialProps = async ctx => {
  // Render app and page and get the context of the page with collected side effects.
  const sheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: App => props => sheets.collect(<App {...props} />),
    });

  const initialProps = await Document.getInitialProps(ctx);

  return {
    ...initialProps,
    // Styles fragment is rendered after the app and page rendering finish.
    styles: [
      ...React.Children.toArray(initialProps.styles),
      sheets.getStyleElement(),
    ],
  };
};
