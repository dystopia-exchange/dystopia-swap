import React, { useState, useEffect, useCallback } from 'react';

import PairsTable from './ssLiquidityPairsTable.js';

import stores from '../../stores';
import { ACTIONS } from '../../stores/constants';

export default function ssLiquidityPairs() {
  const [isLoading, setIsLoading] = useState(true);
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [pairs, setPairs] = useState([]);
  const [pairBalancesLoading, setPairBalancesLoading] = useState(false);

  useEffect(() => {
    const stableSwapUpdated = () => {
      setPairs(stores.stableSwapStore.getStore('pairs'));
      forceUpdate();
      setIsLoading(false)
    };

    setPairs(stores.stableSwapStore.getStore('pairs'));

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
    };
  }, []);

  return (
    <PairsTable pairs={pairs} isLoading={isLoading} />
  );
}
