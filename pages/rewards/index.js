
import React from 'react';
import SSRewards from '../../components/ssRewards'
import { NotConnect } from "../../components/notConnect/index";

function Rewards() {
  return (
    <NotConnect
      title="Rewards"
      description="Claim your share of rewards!"
      buttonText="LAUNCH APP"
    >
      <SSRewards />
    </NotConnect>
  )
}

export default Rewards;
