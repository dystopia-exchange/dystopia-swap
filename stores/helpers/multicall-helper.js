export async function multicallRequest(
  multicall,
  array,
  contractCall,
  batch = 20
) {
  let calls = [];
  const results = [];

  for (let i = 0; i < array.length; i++) {
    let el = array[i];
    contractCall(calls, el)
    if (calls > batch) {
      results.push(...(await multicall.aggregate(calls)))
      calls = [];
    }
  }

  if (calls.length > 0) {
    results.push(...(await multicall.aggregate(calls)))
  }
  return results;
}
