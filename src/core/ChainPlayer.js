const LOCALSTORAGE_CHAININDEX = "chain_index";

var CHAIN_MODE = false;
const chain_fx = [
  {class: "Non_Regression_Tests", platform: "STE"},
  {class: "FX_TestParser", platform: "ST"},
  {class: "Draw2Buffer", platform: "OCS"},
  {class: "BlitterTornado", platform: "OCS"},
  {class: "RevisionLogo_v1", platform: "OCS"},
  {class: "RevisionLogo_v2", platform: "OCS"},
  {class: "FX_Spherev1", platform: "OCS"},
  {class: "FX_Spherev2", platform: "OCS"},
  {class: "FX_Spherev3", platform: "OCS"},
  {class: "FX_Spherev4", platform: "OCS"},
  {class: "FX_StarFieldv1", platform: "OCS"},
  {class: "FX_StarFieldv2", platform: "OCS"},
  {class: "FX_Heroes", platform: "OCS"},
  {class: "TestCopper", platform: "OCS"},
  {class: "AtariSTe_BlitterFill", platform: "STE"},
  {class: "AtariVBL", platform: "STE"},
  {class: "tut_Atari_HBL", platform: "STE"},
  {class: "testAmigaBlitter", platform: "OCS"},
  {class: "testSTEBlitter", platform: "STE"},
  {class: "tut_Atari1", platform: "STE"},
  {class: "tut4_automodified", platform: "STE"},
  {class: "tut5_AmigaImage", platform: "OCS"},
  {class: "tut6_STEImage", platform: "STE"},
];

function Check_Chain() {
  let index = localStorage.getItem(LOCALSTORAGE_CHAININDEX);
  if (!index)
    return false;
  index = parseInt(index);
  if (!isNaN(index)) {
    const arrayIndex = index - 1;
    if (arrayIndex >= 0 && arrayIndex < chain_fx.length) {
      const classname = chain_fx[arrayIndex].class;
      if (!main_startChosenFx(classname)) {
        alert("ERROR: Can't start FX " + classname);
        return false;
      }
      CHAIN_MODE = true;
      localStorage.setItem(LOCALSTORAGE_CHAININDEX, index + 1);
      return true;
    } else  {
      localStorage.setItem(LOCALSTORAGE_CHAININDEX, null);
      localStorage.clear();
      alert("CHAIN DONE!");
      window.location.reload(true);
    }
  }
  return false;
}

