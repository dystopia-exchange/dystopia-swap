import React, { useState } from "react";
import css from "./ssVests.module.css";
import { useAppThemeContext } from "../../ui/AppThemeProvider";

export const Notification = () => {
  const { appTheme } = useAppThemeContext();
  const [visible, setVisible] = useState(true);

  const closeNotification = () => {
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className={[css.notification, css[`notification--${appTheme}`]].join(" ")}
    >
      <div
        className={[
          css.notification_divider,
          css[`notification_divider--${appTheme}`],
        ].join(" ")}
      />
      <p>
        Lock your DYST to earn rewards and governance rights. Each locked
        position is created and represented as an NFT, meaning you can hold
        multiple locked positions.
      </p>
      <button onClick={closeNotification} className={css.notification_close} />
    </div>
  );
};
