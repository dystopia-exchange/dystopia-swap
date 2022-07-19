import React from "react";
import SwapComponent from "../../components/ssSwap";
import { NotConnect } from "../../components/notConnect/index";

function Swap() {
  return (
    <NotConnect
      title="Swap"
      description="Swap between Cone supported stable and volatile assets."
      buttonText="LAUNCH APP"
    >
      <SwapComponent />
    </NotConnect>
  )
}

export default Swap;
