import {removeDuplicate} from '../../utils';

export const removeBaseAsset = (asset, baseAssets) => {
  try {
    let localBaseAssets = [];
    const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

    if (localBaseAssetsString && localBaseAssetsString !== "") {
      localBaseAssets = JSON.parse(localBaseAssetsString);

      localBaseAssets = localBaseAssets.filter(function (obj) {
        return obj.address.toLowerCase() !== asset.address.toLowerCase();
      });

      localStorage.setItem(
        "stableSwap-assets",
        JSON.stringify(localBaseAssets)
      );


      return baseAssets.filter(function (obj) {
        return (
          obj.address.toLowerCase() !== asset.address.toLowerCase() &&
          asset.local === true
        );
      });
    }
  } catch (ex) {
    console.log('removeBaseAsset error', ex);
    throw ex;
  }
};

export const getLocalAssets = () => {
  try {
    let localBaseAssets = [];
    const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

    if (localBaseAssetsString && localBaseAssetsString !== "") {
      localBaseAssets = JSON.parse(localBaseAssetsString);
    }

    return localBaseAssets;
  } catch (ex) {
    console.log("Get local asset error", ex);
    throw ex;
  }
};

export function saveLocalAsset(newBaseAsset) {
  let localBaseAssets = getLocalAssets();
  localBaseAssets = removeDuplicate([...localBaseAssets, newBaseAsset]);
  localStorage.setItem("stableSwap-assets", JSON.stringify(localBaseAssets));
}
