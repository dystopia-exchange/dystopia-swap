import React from 'react';
import LiquidityPairs from '../../components/ssLiquidityPairs'
import { NotConnect } from "../../components/notConnect/index";

function Liquidity() {
  return (
    <NotConnect
      title="Liquidity"
      description="Create a pair or add liquidity to existing stable or volatile Liquidity Pairs."
      buttonText="LAUNCH APP"
    >
      <LiquidityPairs />
    </NotConnect>
  );
}

export default Liquidity;
