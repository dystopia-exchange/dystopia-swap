import React from 'react';
import Gauges from '../../components/ssVotes';
import { NotConnect } from "../../components/notConnect/index";

function Vote() {
  return (
    <NotConnect
      title="Vote"
      description="Use your veCONE to vote for your selected liquidity pair's rewards distribution or create a bribe to encourage others to do the same."
      buttonText="LAUNCH APP"
    >
      <Gauges />
    </NotConnect>
  )
}

export default Vote;
