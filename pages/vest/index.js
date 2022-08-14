import React from 'react';
import VestsNFTs from '../../components/ssVests';
import { NotConnect } from "../../components/notConnect/index";

function Vesting() {
  return (
    <NotConnect
      title="Vest"
      description="Lock your CONE to earn rewards and governance rights. Each locked position is created and represented as an NFT, meaning you can hold multiple locked positions."
      buttonText="LAUNCH APP"
    >
      <VestsNFTs />
    </NotConnect>
  );
}

export default Vesting;
